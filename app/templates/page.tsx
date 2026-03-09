'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface Template {
  id: number;
  name: string;
  description: string | null;
  category: string;
  questions: Question[];
  is_preset: boolean;
  created_at: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      // 사용자 정보 가져오기
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      // 템플릿 목록 가져오기
      const categoryParam = selectedCategory === 'all' ? '' : `&category=${selectedCategory}`;
      const templatesRes = await fetch(`/api/templates?userId=${user?.id || ''}${categoryParam}`);
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: number) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/templates/${templateId}/duplicate`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        alert('템플릿이 적용되었습니다! 설문조사 수정 페이지로 이동합니다.');
        router.push(`/survey/create?edit=${data.form.id}`);
      } else {
        const data = await res.json();
        alert(data.error || '템플릿 적용에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('템플릿이 삭제되었습니다.');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      customer_satisfaction: '고객 만족도',
      event_attendance: '이벤트 참석',
      employee_satisfaction: '직원 만족도',
      product_feedback: '제품 피드백',
      course_evaluation: '강의 평가',
      wedding_rsvp: '웨딩 참석',
      custom: '내 템플릿',
    };
    return labels[category] || category;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push('/')}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  FormFlow
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">설문조사 템플릿</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  템플릿을 선택하여 빠르게 설문조사를 만들어보세요
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/mypage')}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              ← 마이페이지
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedCategory('customer_satisfaction')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'customer_satisfaction'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              고객 만족도
            </button>
            <button
              onClick={() => setSelectedCategory('event_attendance')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'event_attendance'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              이벤트 참석
            </button>
            <button
              onClick={() => setSelectedCategory('employee_satisfaction')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'employee_satisfaction'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              직원 만족도
            </button>
            <button
              onClick={() => setSelectedCategory('product_feedback')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'product_feedback'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              제품 피드백
            </button>
            <button
              onClick={() => setSelectedCategory('course_evaluation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'course_evaluation'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              강의 평가
            </button>
            <button
              onClick={() => setSelectedCategory('wedding_rsvp')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'wedding_rsvp'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              웨딩 참석
            </button>
            <button
              onClick={() => setSelectedCategory('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              내 템플릿
            </button>
          </div>
        </div>

        {/* 템플릿 목록 */}
        {templates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              템플릿이 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              마이페이지에서 내 설문조사를 템플릿으로 저장해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      {template.is_preset && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                          프리셋
                        </span>
                      )}
                      {!template.is_preset && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                          내 템플릿
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                      {getCategoryLabel(template.category)}
                    </span>
                  </div>
                </div>

                {template.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>📋 {template.questions.length}개 질문</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                  >
                    사용하기
                  </button>
                  {!template.is_preset && user && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={deletingId === template.id}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm"
                    >
                      {deletingId === template.id ? '삭제 중...' : '삭제'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
