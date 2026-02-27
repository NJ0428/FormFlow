'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ShareModal from '@/components/ShareModal';
import { useDraftResponse } from '@/lib/useDraftResponse';
import { getSessionId } from '@/lib/session';

interface QuestionCondition {
  questionId: number;
  value: string | string[];
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

interface Question {
  id: number;
  type: 'short_text' | 'long_text' | 'multiple' | 'single' | 'rating' | 'date' | 'file' | 'image_choice' | 'slider' | 'ranking';
  title: string;
  options?: string[];
  required: boolean;
  condition?: QuestionCondition;
  min?: number;
  max?: number;
  step?: number;
  sliderUnit?: string;
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
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showRestoreDraftModal, setShowRestoreDraftModal] = useState(false);
  const [restoredDraftTimestamp, setRestoredDraftTimestamp] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Initialize session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSessionId(getSessionId(surveyId));
    }
  }, [surveyId]);

  // Load draft answers on mount
  useEffect(() => {
    if (!sessionId || !form || draftLoaded) return;

    const loadDraft = async () => {
      try {
        // First, check local storage
        const storageKey = `draft_${surveyId}_${sessionId}`;
        const localDraft = localStorage.getItem(storageKey);

        if (localDraft) {
          const draft = JSON.parse(localDraft);
          if (draft.answers && Object.keys(draft.answers).length > 0) {
            setRestoredDraftTimestamp(draft.updated_at);
            setShowRestoreDraftModal(true);
            setAnswers(draft.answers);
            setDraftLoaded(true);
            return;
          }
        }

        // If no local draft, check server
        const response = await fetch(`/api/forms/${surveyId}/draft?session_id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.answers && Object.keys(data.answers).length > 0) {
            setRestoredDraftTimestamp(data.updated_at);
            setShowRestoreDraftModal(true);
            setAnswers(data.answers);
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      } finally {
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, [sessionId, form, surveyId, draftLoaded]);

  // Use draft auto-save hook
  const { deleteDraft } = useDraftResponse({
    formId: surveyId,
    sessionId,
    answers,
    enabled: !!sessionId && !!form && !submitted && draftLoaded,
    autosaveInterval: 10000,
  });

  useEffect(() => {
    fetchForm();
  }, [surveyId]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${surveyId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
        setIsOwner(data.isOwner || false);
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
    setSaveStatus('saving');
    // Reset save status after a delay
    setTimeout(() => setSaveStatus('saved'), 1000);
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

  const getProgress = () => {
    const visibleQuestions = getVisibleQuestions();
    const answeredQuestions = visibleQuestions.filter(q => {
      const answer = answers[q.id];
      if (q.required && !answer) return false;
      if (q.type === 'multiple' && answer && answer.length === 0) return false;
      return true;
    });
    return visibleQuestions.length > 0 ? (answeredQuestions.length / visibleQuestions.length) * 100 : 0;
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeleteForm = async () => {
    if (!confirm('정말 이 설문조사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${surveyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('설문조사가 삭제되었습니다.');
        router.push('/survey');
      } else {
        const data = await response.json();
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleDuplicateForm = async () => {
    if (!confirm('이 설문조사를 복제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/${surveyId}/duplicate`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        alert('설문조사가 복제되었습니다. 편집 페이지로 이동합니다.');
        router.push(`/survey/create?edit=${data.form.id}`);
      } else {
        const data = await res.json();
        alert(data.error || '복제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!form) return;

    const templateName = prompt('템플릿 이름을 입력하세요:', form.title);
    if (!templateName) return;

    try {
      const questions = form.questions.map((q) => ({
        id: q.id.toString(),
        type: q.type,
        title: q.title,
        options: q.options,
        required: q.required,
        condition: q.condition
      }));

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: form.description,
          category: 'custom',
          questions: questions,
        }),
      });

      if (res.ok) {
        alert('템플릿이 저장되었습니다!');
      } else {
        const data = await res.json();
        alert(data.error || '템플릿 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Save template error:', err);
      alert('서버 오류가 발생했습니다.');
    }
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
      // 위치 정보 수집 (선택적)
      let location = null;
      try {
        // 시간대를 기반으로 대략적인 위치 추정
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // 간단한 위치 추정 (실제 프로덕션에서는 IP 기반 지오로케이션 API 사용 권장)
        location = {
          country: null, // 사용자 동의가 필요하므로 null
          city: timeZone?.split('/')[0] || null, // 시간대에서 대략적인 지역 정보
          latitude: null,
          longitude: null,
        };
      } catch (err) {
        console.log('Location detection skipped:', err);
      }

      const response = await fetch(`/api/forms/${surveyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, location }),
      });

      if (response.ok) {
        setSubmitted(true);
        // Delete draft after successful submission
        await deleteDraft();
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

  const handleClearDraft = useCallback(() => {
    setAnswers({});
    setShowRestoreDraftModal(false);
    setRestoredDraftTimestamp(null);
    deleteDraft();
  }, [deleteDraft]);

  const formatDraftTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
    return `${Math.floor(diffMins / 1440)}일 전`;
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

  // Restore draft modal
  if (showRestoreDraftModal && form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            이어서 응답하시겠습니까?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            {restoredDraftTimestamp && (
              <>
                이전에 작성하던 내용이 있습니다.
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  ({formatDraftTimestamp(restoredDraftTimestamp)}에 저장됨)
                </span>
              </>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClearDraft}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              새로 시작하기
            </button>
            <button
              onClick={() => setShowRestoreDraftModal(false)}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              이어서 작성하기
            </button>
          </div>
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
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/survey')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로가기
            </button>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <button
                    onClick={handleDeleteForm}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    삭제
                  </button>
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    초대
                  </button>
                  <button
                    onClick={handleDuplicateForm}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    복제
                  </button>
                  <button
                    onClick={handleSaveAsTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    템플릿
                  </button>
                </>
              )}
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copied ? '링크 복사됨!' : '공유'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {getVisibleQuestions().length > 0 && (
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  진행률
                </span>
                <div className="flex items-center gap-2">
                  {saveStatus !== 'idle' && (
                    <span className={`text-xs ${saveStatus === 'saving' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {saveStatus === 'saving' ? '저장 중...' : '저장됨'}
                    </span>
                  )}
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {Math.round(getProgress())}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
            </div>
          )}
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

                    {/* Date Picker */}
                    {question.type === 'date' && (
                      <input
                        type="date"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
                      />
                    )}

                    {/* File Upload */}
                    {question.type === 'file' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">클릭하여 업로드</span>
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                PNG, JPG, PDF (최대 10MB)
                              </p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // For demo: just store filename
                                  handleAnswerChange(question.id, file.name);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {answers[question.id] && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                              선택된 파일: {answers[question.id]}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image Choice */}
                    {question.type === 'image_choice' && question.options && (
                      <div className="grid grid-cols-2 gap-3">
                        {question.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswerChange(question.id, option)}
                            className={`p-4 border-2 rounded-lg transition ${
                              answers[question.id] === option
                                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/10'
                            }`}
                          >
                            <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg mb-2 flex items-center justify-center">
                              {option.startsWith('http') ? (
                                <img src={option} alt={option} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <span className="text-3xl">🖼️</span>
                              )}
                            </div>
                            <p className="text-sm text-center text-gray-700 dark:text-gray-300 truncate">
                              {option.startsWith('http') ? `옵션 ${idx + 1}` : option}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Slider */}
                    {question.type === 'slider' && (
                      <div className="space-y-4">
                        <input
                          type="range"
                          min={question.min ?? 0}
                          max={question.max ?? 100}
                          step={question.step ?? 1}
                          value={answers[question.id] || (question.min ?? 0)}
                          onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                          className="w-full accent-orange-600"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {question.min ?? 0}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {answers[question.id] || (question.min ?? 0)}
                            </span>
                            {question.sliderUnit && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {question.sliderUnit}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {question.max ?? 100}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Ranking (Drag & Drop) */}
                    {question.type === 'ranking' && question.options && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          항목을 드래그하여 순서를 변경하세요
                        </p>
                        {(answers[question.id] || question.options).map((option: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 cursor-move"
                            draggable
                          >
                            <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-semibold">
                              {idx + 1}
                            </span>
                            <span className="flex-1 text-gray-700 dark:text-gray-300">
                              {option}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const currentOrder = answers[question.id] || question.options;
                                  if (idx > 0) {
                                    const newOrder = [...currentOrder];
                                    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                                    handleAnswerChange(question.id, newOrder);
                                  }
                                }}
                                disabled={idx === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  const currentOrder = answers[question.id] || question.options;
                                  if (idx < currentOrder.length - 1) {
                                    const newOrder = [...currentOrder];
                                    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
                                    handleAnswerChange(question.id, newOrder);
                                  }
                                }}
                                disabled={idx === (answers[question.id] || question.options).length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>
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

      {/* Share Modal - Owner Only */}
      {shareModalOpen && isOwner && form && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          formId={surveyId}
          formTitle={form.title}
        />
      )}
    </div>
  );
}
