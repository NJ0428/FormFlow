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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const filteredForms = getFilteredForms();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
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

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-indigo-600 cursor-pointer transition"
              >
                홈
              </a>
              <a className="text-indigo-600 font-semibold cursor-pointer">
                설문조사
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="hidden sm:block text-sm text-gray-600">
                    {user.name || user.email}님
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm"
                  >
                    회원가입
                  </button>
                </>
              )}
              <button
                onClick={() => router.push('/survey/create')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all text-sm font-medium"
              >
                <span className="hidden sm:inline">설문조사 만들기</span>
                <span className="sm:hidden">만들기</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            설문조사 게시판
          </h1>
          <p className="text-gray-600 text-lg">
            다양한 설문조사에 참여하고 의견을 공유하세요
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="설문조사 검색..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-3 rounded-xl font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterStatus('open')}
                className={`px-4 py-3 rounded-xl font-medium transition ${
                  filterStatus === 'open'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                진행중
              </button>
              <button
                onClick={() => setFilterStatus('closed')}
                className={`px-4 py-3 rounded-xl font-medium transition ${
                  filterStatus === 'closed'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                마감
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              총 <span className="font-bold text-indigo-600">{filteredForms.length}</span>개의 설문조사
              {searchTerm && <span className="text-gray-500"> (검색: &quot;{searchTerm}&quot;)</span>}
            </p>
          </div>
        </div>

        {/* Survey Cards Grid */}
        {filteredForms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '아직 설문조사가 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? '다른 검색어를 시도해보세요.' : '첫 번째 설문조사를 만들어보세요!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push('/survey/create')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition font-medium"
              >
                설문조사 만들기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => (
              <div
                key={form.id}
                onClick={() => router.push(`/survey/${form.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    form.is_open === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {form.is_open === 1 ? '진행중' : '마감'}
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                  {form.title}
                </h3>

                {/* Description */}
                {form.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {form.description}
                  </p>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 my-4"></div>

                {/* Footer Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {form.author_name || '익명'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(form.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {form.response_count}명 참여
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">© 2025 FormFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
