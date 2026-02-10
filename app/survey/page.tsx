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
      <div className="preloader">
        <div className="loader">
          <div className="spinner">
            <div className="spinner-container">
              <div className="spinner-rotator">
                <div className="spinner-left">
                  <div className="spinner-circle"></div>
                </div>
                <div className="spinner-right">
                  <div className="spinner-circle"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredForms = getFilteredForms();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="header header-6 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="navbar-area">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-12">
                <nav className="navbar navbar-expand-lg">
                  <a className="navbar-brand cursor-pointer" onClick={() => router.push('/')}>
                    <h1 className="text-2xl font-bold text-purple-600">FormFlow</h1>
                  </a>
                  <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent6">
                    <span className="toggler-icon"></span>
                    <span className="toggler-icon"></span>
                    <span className="toggler-icon"></span>
                  </button>

                  <div className="collapse navbar-collapse sub-menu-bar" id="navbarSupportedContent6">
                    <ul id="nav6" className="navbar-nav ms-auto">
                      <li className="nav-item">
                        <a className="page-scroll cursor-pointer" onClick={() => router.push('/')}>Home</a>
                      </li>
                      <li className="nav-item">
                        <a className="page-scroll active cursor-pointer">설문조사</a>
                      </li>
                    </ul>
                  </div>

                  <div className="header-action d-flex align-items-center gap-3">
                    {user ? (
                      <>
                        <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
                          {user.name || user.email}님
                        </span>
                        <button
                          onClick={handleLogout}
                          className="btn btn-sm"
                        >
                          로그아웃
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push('/login')}
                          className="btn btn-sm"
                        >
                          로그인
                        </button>
                        <button
                          onClick={() => router.push('/register')}
                          className="btn btn-sm"
                        >
                          회원가입
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => router.push('/survey/create')}
                      className="btn btn-sm btn-primary"
                    >
                      <i className="lni lni-plus"></i> 만들기
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section hero-style-5 img-bg" style={{backgroundImage: "url('/assets/img/hero/hero-5/hero-bg.svg')", minHeight: '400px' }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="hero-content-wrapper text-center">
                <h2 className="mb-20 wow fadeInUp" data-wow-delay=".2s">설문조사 게시판</h2>
                <p className="mb-30 wow fadeInUp" data-wow-delay=".4s">
                  다양한 설문조사에 참여하고 의견을 공유하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="feature-section feature-style-5 pb-120">
        <div className="container">
          {/* Search and Filter */}
          <div className="row justify-content-center mb-50">
            <div className="col-lg-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="row g-3">
                  {/* Search */}
                  <div className="col-md-6">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="설문조사 검색..."
                        className="form-control"
                      />
                      <i className="lni lni-search absolute" style={{right: '15px', top: '50%', transform: 'translateY(-50%)'}}></i>
                    </div>
                  </div>

                  {/* Filter */}
                  <div className="col-md-6">
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      >
                        전체
                      </button>
                      <button
                        onClick={() => setFilterStatus('open')}
                        className={`btn ${filterStatus === 'open' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      >
                        진행중
                      </button>
                      <button
                        onClick={() => setFilterStatus('closed')}
                        className={`btn ${filterStatus === 'closed' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      >
                        마감
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="text-center mt-4">
                <p className="text-gray-600 dark:text-gray-400">
                  총 <span className="fw-bold text-primary">{filteredForms.length}</span>개의 설문조사
                  {searchTerm && ` (검색: "${searchTerm}")`}
                </p>
              </div>
            </div>
          </div>

          {/* Survey List - Card Grid Style */}
          {filteredForms.length === 0 ? (
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                  <i className="lni lni-files mb-4" style={{fontSize: '64px', color: '#d1d5db'}}></i>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {searchTerm ? '검색 결과가 없습니다' : '아직 설문조사가 없습니다'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {searchTerm ? '다른 검색어를 시도해보세요.' : '첫 번째 설문조사를 만들어보세요!'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => router.push('/survey/create')}
                      className="btn btn-primary"
                    >
                      <i className="lni lni-plus"></i> 설문조사 만들기
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="row">
              {filteredForms.map((form, index) => (
                <div key={form.id} className="col-xl-4 col-lg-4 col-md-6 col-sm-12 mb-30">
                  <div
                    className="single-feature wow fadeInUp cursor-pointer survey-card"
                    data-wow-delay={`${(index % 3 + 1) * 0.2}s`}
                    onClick={() => router.push(`/survey/${form.id}`)}
                  >
                    <div className="icon">
                      <i className="lni lni-popup"></i>
                      <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                      </svg>
                    </div>
                    <div className="content">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="text-truncate" style={{maxWidth: '70%'}}>{form.title}</h5>
                        {form.is_open === 1 ? (
                          <span className="badge bg-success">진행중</span>
                        ) : (
                          <span className="badge bg-secondary">마감</span>
                        )}
                      </div>
                      {form.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-truncate mb-3">
                          {form.description}
                        </p>
                      )}
                      <div className="d-flex justify-content-between align-items-center text-sm text-gray-500">
                        <span>
                          <i className="lni lni-user"></i> {form.author_name || '익명'}
                        </span>
                        <span>
                          <i className="lni lni-calendar"></i> {formatDate(form.created_at)}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-top border-gray-200 dark:border-gray-700">
                        <span className="text-primary fw-bold">
                          <i className="lni lni-users"></i> {form.response_count}명 참여
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-style-4">
        <div className="container">
          <div className="copyright-wrapper text-center">
            <p>© 2025 FormFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
