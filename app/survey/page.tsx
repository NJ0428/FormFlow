'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Form {
  id: number;
  title: string;
  description: string | null;
  author_name: string | null;
  created_at: string;
  response_count: number;
  is_open: number;
}

interface User {
  id: number;
  email: string;
  name: string | null;
}

export default function SurveyListPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchForms();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
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

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms');
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms);
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredForms = () => {
    return forms.filter(form => {
      const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'open' && form.is_open === 1) ||
        (filterStatus === 'closed' && form.is_open === 0);
      return matchesSearch && matchesStatus;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
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

  const filteredForms = getFilteredForms();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/')}
            >
              <h1 className="text-2xl font-bold text-purple-600">FormFlow</h1>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 dark:text-gray-300">설문조사 게시판</span>
            </div>
            <div className="flex items-center gap-3">
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
                    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    회원가입
                  </button>
                </>
              )}
              <button
                onClick={() => router.push('/survey/create')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                설문조사 만들기
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="설문조사 제목 또는 내용 검색..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-3 rounded-lg transition ${
                    filterStatus === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterStatus('open')}
                  className={`px-4 py-3 rounded-lg transition ${
                    filterStatus === 'open'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  진행중
                </button>
                <button
                  onClick={() => setFilterStatus('closed')}
                  className={`px-4 py-3 rounded-lg transition ${
                    filterStatus === 'closed'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  마감
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              총 <span className="font-bold text-purple-600">{filteredForms.length}</span>개의 설문조사
              {searchTerm && ` (검색: "${searchTerm}")`}
            </p>
          </div>
        </div>

        {/* Survey List - Board Style */}
        <div className="max-w-6xl mx-auto">
          {filteredForms.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {searchTerm ? '검색 결과가 없습니다' : '아직 설문조사가 없습니다'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? '다른 검색어를 시도해보세요.' : '첫 번째 설문조사를 만들어보세요!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/survey/create')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  설문조사 만들기
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <div className="col-span-1 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">번호</div>
                <div className="col-span-5 text-sm font-semibold text-gray-600 dark:text-gray-300">제목</div>
                <div className="col-span-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">작성자</div>
                <div className="col-span-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">작성일</div>
                <div className="col-span-1 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">참여</div>
                <div className="col-span-1 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">상태</div>
              </div>

              {/* Table Body */}
              {filteredForms.map((form, index) => (
                <div
                  key={form.id}
                  onClick={() => router.push(`/survey/${form.id}`)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  {/* Number */}
                  <div className="col-span-1 text-center text-sm text-gray-500 dark:text-gray-400">
                    {filteredForms.length - index}
                  </div>

                  {/* Title */}
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition truncate">
                        {form.title}
                      </h3>
                      {form.description && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {form.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Author */}
                  <div className="col-span-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    {form.author_name || '익명'}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(form.created_at)}
                  </div>

                  {/* Response Count */}
                  <div className="col-span-1 text-center text-sm text-gray-600 dark:text-gray-400">
                    {form.response_count}
                  </div>

                  {/* Status */}
                  <div className="col-span-1 text-center">
                    {form.is_open === 1 ? (
                      <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                        진행중
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
                        마감
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
