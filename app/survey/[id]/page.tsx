'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface QuestionCondition {
  questionId: number;
  value: string | string[];
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

interface Question {
  id: number;
  type: 'short_text' | 'long_text' | 'multiple' | 'single' | 'rating';
  title: string;
  options?: string[];
  required: boolean;
  condition?: QuestionCondition;
}

interface Form {
  id: number;
  title: string;
  description: string | null;
  author_name: string | null;
  created_at: string;
  is_open: number;
  deadline: string | null;
  questions: Question[];
}

export default function SurveyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [surveyId]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${surveyId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
      } else {
        alert('설문조사를 찾을 수 없습니다.');
        router.push('/survey');
      }
    } catch (error) {
      console.error('Failed to fetch form:', error);
      alert('설문조사를 불러오는데 실패했습니다.');
      router.push('/survey');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const shouldShowQuestion = (question: Question): boolean => {
    if (!question.condition) return true;

    const dependentAnswer = answers[question.condition.questionId];
    const conditionValue = question.condition.value;
    const operator = question.condition.operator;

    switch (operator) {
      case 'equals':
        if (Array.isArray(dependentAnswer)) {
          return dependentAnswer.includes(conditionValue);
        }
        return dependentAnswer === conditionValue;
      case 'contains':
        if (Array.isArray(dependentAnswer)) {
          return dependentAnswer.includes(conditionValue);
        }
        return String(dependentAnswer).includes(String(conditionValue));
      case 'greater_than':
        return Number(dependentAnswer) > Number(conditionValue);
      case 'less_than':
        return Number(dependentAnswer) < Number(conditionValue);
      default:
        return true;
    }
  };

  const getVisibleQuestions = (): Question[] => {
    if (!form) return [];
    return form.questions.filter(q => shouldShowQuestion(q));
  };

  const getQuestionNumber = (question: Question): number => {
    const visibleQuestions = getVisibleQuestions();
    return visibleQuestions.findIndex(q => q.id === question.id) + 1;
  };

  const validateAnswers = () => {
    if (!form) return false;

    // Only validate visible questions
    const visibleQuestions = form.questions.filter(q => shouldShowQuestion(q));

    for (const question of visibleQuestions) {
      if (question.required && !answers[question.id]) {
        return false;
      }
      if (question.type === 'multiple' && answers[question.id] && answers[question.id].length === 0 && question.required) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAnswers()) {
      alert('필수 응답을 모두 작성해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/forms/${surveyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(error.error || '제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 border-opacity-75 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            제출 완료!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            소중한 의견에 감사드립니다.
          </p>
          <button
            onClick={() => router.push('/survey')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            다른 설문조사 보기
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  // Check if form is closed or deadline passed
  const isDeadlinePassed = form.deadline && new Date(form.deadline) < new Date();

  if (form.is_open === 0 || isDeadlinePassed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isDeadlinePassed ? '마감 기한 경과' : '마감된 설문조사'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {isDeadlinePassed ? '이 설문조사의 마감 기한이 지났습니다.' : '이 설문조사는 이미 마감되었습니다.'}
          </p>
          <button
            onClick={() => router.push('/survey')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            다른 설문조사 보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/survey')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로가기
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">FormFlow</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Survey Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {form.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>작성자: {form.author_name || '익명'}</span>
              <span>•</span>
              <span>총 {getVisibleQuestions().length}개 질문</span>
              {form.deadline && (
                <>
                  <span>•</span>
                  <span className={isDeadlinePassed ? 'text-red-600' : 'text-orange-600'}>
                    ⏰ 마감: {new Date(form.deadline).toLocaleDateString('ko-KR')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6 mb-8">
            {form.questions.filter(q => shouldShowQuestion(q)).map((question) => (
              <div key={question.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-semibold">
                    {getQuestionNumber(question)}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {question.title}
                      {question.required && (
                        <span className="ml-2 text-red-500">*</span>
                      )}
                    </h3>

                    {/* Short Text Input */}
                    {question.type === 'short_text' && (
                      <input
                        type="text"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
                        placeholder="답변을 입력하세요..."
                      />
                    )}

                    {/* Long Text Input */}
                    {question.type === 'long_text' && (
                      <textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition resize-none"
                        placeholder="답변을 입력하세요..."
                      />
                    )}

                    {/* Single Choice */}
                    {question.type === 'single' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label
                            key={optionIndex}
                            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition"
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={answers[question.id] === option}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Multiple Choice */}
                    {question.type === 'multiple' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label
                            key={optionIndex}
                            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition"
                          >
                            <input
                              type="checkbox"
                              value={option}
                              checked={answers[question.id]?.includes(option) || false}
                              onChange={(e) => {
                                const currentAnswers = answers[question.id] || [];
                                if (e.target.checked) {
                                  handleAnswerChange(question.id, [...currentAnswers, option]);
                                } else {
                                  handleAnswerChange(question.id, currentAnswers.filter((a: string) => a !== option));
                                }
                              }}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Rating */}
                    {question.type === 'rating' && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleAnswerChange(question.id, rating)}
                            className={`w-12 h-12 rounded-lg text-xl font-bold transition ${
                              answers[question.id] === rating
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push('/survey')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  제출 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  제출하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
