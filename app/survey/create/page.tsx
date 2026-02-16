'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface QuestionCondition {
  questionId: string;
  value: string | string[];
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

interface Question {
  id: string;
  type: 'short_text' | 'long_text' | 'multiple' | 'single' | 'rating';
  title: string;
  options?: string[];
  required: boolean;
  condition?: QuestionCondition;
}

interface User {
  id: number;
  email: string;
  name: string | null;
}

export default function CreateSurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');

  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [conditionQuestionId, setConditionQuestionId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fetchingForm, setFetchingForm] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    } finally {
      setCheckingAuth(false);
    }
  };

  // Load form data if editing
  useEffect(() => {
    if (editId && user) {
      loadFormForEdit(editId);
    }
  }, [editId, user]);

  const loadFormForEdit = async (id: string) => {
    setFetchingForm(true);
    try {
      const response = await fetch(`/api/forms/${id}`);
      if (response.ok) {
        const data = await response.json();
        const form = data.form;
        setSurveyTitle(form.title);
        setSurveyDescription(form.description || '');
        setDeadline(form.deadline ? form.deadline.split('T')[0] : '');

        // Convert questions to match the Question interface
        const convertedQuestions = form.questions.map((q: any) => ({
          id: q.id.toString(),
          type: q.type,
          title: q.title,
          options: q.options,
          required: q.required === 1,
          condition: q.condition_question_id ? {
            questionId: q.condition_question_id.toString(),
            value: q.condition_value ? JSON.parse(q.condition_value) : undefined,
            operator: q.condition_operator || 'equals'
          } : undefined
        }));

        setQuestions(convertedQuestions);
        setIsEditMode(true);
      } else {
        alert('설문조사를 불러오는데 실패했습니다.');
        router.push('/mypage');
      }
    } catch (error) {
      console.error('Load form error:', error);
      alert('서버 오류가 발생했습니다.');
      router.push('/mypage');
    } finally {
      setFetchingForm(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (checkingAuth || fetchingForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 border-opacity-75"></div>
      </div>
    );
  }

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: '',
      options: type === 'multiple' || type === 'single' ? ['', ''] : undefined,
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options && q.options.length > 1) {
        return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
      }
      return q;
    }));
  };

  const openConditionModal = (questionId: string) => {
    setConditionQuestionId(questionId);
    setConditionModalOpen(true);
  };

  const closeConditionModal = () => {
    setConditionModalOpen(false);
    setConditionQuestionId(null);
  };

  const updateCondition = (questionId: string, condition: QuestionCondition | undefined) => {
    updateQuestion(questionId, { condition });
    closeConditionModal();
  };

  const getAvailableQuestionsForCondition = (currentQuestionIndex: number) => {
    // Only allow conditions on questions that come before the current one
    return questions.slice(0, currentQuestionIndex);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTitle.trim()) {
      alert('설문조사 제목을 입력해주세요.');
      return;
    }
    if (questions.length === 0) {
      alert('최소 한 개의 질문을 추가해주세요.');
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode ? `/api/forms/${editId}` : '/api/forms';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: surveyTitle,
          description: surveyDescription,
          deadline: deadline || null,
          questions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/survey/${data.form?.id || editId}`);
      } else {
        const error = await response.json();
        alert(error.error || '설문조사 저장에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/')}
            >
              <h1 className="text-2xl font-bold text-purple-600">FormFlow</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {user.name || user.email}님
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    회원가입
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? '설문조사 수정' : '새 설문조사 만들기'}
            </h1>
          </div>

          {/* Survey Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설문조사 제목 *
                </label>
                <input
                  id="title"
                  type="text"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  placeholder="예: 고객 만족도 조사"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설문조사 설명
                </label>
                <textarea
                  id="description"
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition resize-none"
                  placeholder="이 설문조사의 목적과 내용을 설명해주세요."
                />
              </div>
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  마감 기한
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  마감 기한을 설정하지 않으면 무기한 응답 가능합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Add Question Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">질문 추가</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => addQuestion('short_text')}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              >
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">단답형</span>
              </button>
              <button
                onClick={() => addQuestion('long_text')}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              >
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">장문형</span>
              </button>
              <button
                onClick={() => addQuestion('single')}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              >
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">단일 선택</span>
              </button>
              <button
                onClick={() => addQuestion('multiple')}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              >
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">복수 선택</span>
              </button>
              <button
                onClick={() => addQuestion('rating')}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              >
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">별점</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {question.type === 'short_text' && '단답형'}
                    {question.type === 'long_text' && '장문형'}
                    {question.type === 'single' && '단일 선택'}
                    {question.type === 'multiple' && '복수 선택'}
                    {question.type === 'rating' && '별점'}
                  </span>
                  {question.condition && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                      조건부
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <button
                      onClick={() => openConditionModal(question.id)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="조건 추가"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={question.title}
                    onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                    placeholder="질문을 입력하세요"
                  />
                </div>

                {(question.type === 'single' || question.type === 'multiple') && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <span className="text-gray-400">
                          {question.type === 'single' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                          placeholder={`옵션 ${optionIndex + 1}`}
                        />
                        {question.options && question.options.length > 1 && (
                          <button
                            onClick={() => deleteOption(question.id, optionIndex)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(question.id)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1 mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      옵션 추가
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${question.id}`}
                    checked={question.required}
                    onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor={`required-${question.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                    필수 응답
                  </label>
                </div>
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          {questions.length > 0 && (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isEditMode ? '수정 중...' : '생성 중...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isEditMode ? '설문조사 수정' : '설문조사 생성'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Condition Modal */}
      {conditionModalOpen && conditionQuestionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                표시 조건 설정
              </h3>
              <button
                onClick={closeConditionModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ConditionModalForm
              question={questions.find(q => q.id === conditionQuestionId)!}
              availableQuestions={getAvailableQuestionsForCondition(
                questions.findIndex(q => q.id === conditionQuestionId)
              )}
              onSave={(condition) => updateCondition(conditionQuestionId, condition)}
              onCancel={closeConditionModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Condition Modal Form Component
interface ConditionModalFormProps {
  question: Question;
  availableQuestions: Question[];
  onSave: (condition: QuestionCondition | undefined) => void;
  onCancel: () => void;
}

function ConditionModalForm({ question, availableQuestions, onSave, onCancel }: ConditionModalFormProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    question.condition?.questionId.toString() || ''
  );
  const [operator, setOperator] = useState<QuestionCondition['operator']>(
    question.condition?.operator || 'equals'
  );
  const [value, setValue] = useState<string>(
    typeof question.condition?.value === 'string'
      ? question.condition.value
      : Array.isArray(question.condition?.value)
      ? question.condition.value[0] || ''
      : ''
  );

  const selectedQuestion = availableQuestions.find(q => q.id === selectedQuestionId);
  const isNumeric = selectedQuestion?.type === 'rating';
  const isChoice = selectedQuestion?.type === 'single' || selectedQuestion?.type === 'multiple';

  const handleSave = () => {
    if (!selectedQuestionId) {
      alert('의존할 질문을 선택해주세요.');
      return;
    }
    if (!value) {
      alert('조건 값을 입력해주세요.');
      return;
    }

    let finalValue: string | string[] = value;
    if (selectedQuestion?.type === 'multiple') {
      finalValue = [value];
    }

    onSave({
      questionId: selectedQuestionId,
      operator,
      value: finalValue,
    });
  };

  const handleRemoveCondition = () => {
    onSave(undefined);
  };

  const getOperatorLabel = (op: QuestionCondition['operator']) => {
    switch (op) {
      case 'equals': return '같음';
      case 'contains': return '포함';
      case 'greater_than': return '보다 큼';
      case 'less_than': return '보다 작음';
      default: return op;
    }
  };

  return (
    <div className="space-y-4">
      {/* Select Dependent Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          의존할 질문
        </label>
        <select
          value={selectedQuestionId}
          onChange={(e) => {
            setSelectedQuestionId(e.target.value);
            setValue('');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">질문을 선택하세요</option>
          {availableQuestions.map((q, idx) => (
            <option key={q.id} value={q.id}>
              {idx + 1}. {q.title || '제목 없음'} ({q.type === 'short_text' ? '단답형' : q.type === 'long_text' ? '장문형' : q.type === 'single' ? '단일 선택' : q.type === 'multiple' ? '복수 선택' : '별점'})
            </option>
          ))}
        </select>
      </div>

      {/* Select Operator */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          조건 연산자
        </label>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as QuestionCondition['operator'])}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {isNumeric ? (
            <>
              <option value="equals">같음</option>
              <option value="greater_than">보다 큼</option>
              <option value="less_than">보다 작음</option>
            </>
          ) : isChoice ? (
            <>
              <option value="equals">같음</option>
              <option value="contains">포함</option>
            </>
          ) : (
            <>
              <option value="equals">같음</option>
              <option value="contains">포함</option>
            </>
          )}
        </select>
      </div>

      {/* Condition Value Input */}
      {selectedQuestion && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            조건 값
          </label>
          {selectedQuestion.options ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">옵션을 선택하세요</option>
              {selectedQuestion.options.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt || `옵션 ${idx + 1}`}
                </option>
              ))}
            </select>
          ) : selectedQuestion.type === 'rating' ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">점수를 선택하세요</option>
              {[1, 2, 3, 4, 5].map(score => (
                <option key={score} value={score.toString()}>
                  {score}점
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="조건 값을 입력하세요"
            />
          )}
        </div>
      )}

      {/* Condition Preview */}
      {selectedQuestion && value && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">조건 요약:</span> {'Q' + (availableQuestions.findIndex(q => q.id === selectedQuestionId) + 1) + '의 답변이 "' + value + '"' + (operator === 'equals' ? '과 같으면' : operator === 'contains' ? '을 포함하면' : operator === 'greater_than' ? '보다 크면' : '보다 작으면') + ' 표시'}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        {question.condition && (
          <button
            onClick={handleRemoveCondition}
            className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            조건 삭제
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
