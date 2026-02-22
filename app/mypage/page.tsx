'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import ShareModal from '@/components/ShareModal';

interface User {
  id: number;
  email: string;
  name: string | null;
}

interface Form {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  response_count: number;
  is_open: number;
  deadline: string | null;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'forms'>('profile');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');

  // 프로필 수정 폼 상태
  const [name, setName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // 비밀번호 변경 폼 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormTitle, setSelectedFormTitle] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 사용자 정보 가져오기
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setName(userData.user.name || '');
      } else {
        router.push('/login');
        return;
      }

      // 내 설문조사 목록 가져오기
      const formsRes = await fetch('/api/forms?my=true');
      if (formsRes.ok) {
        const formsData = await formsRes.json();
        setForms(formsData.forms || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openShareModal = (formId: string, formTitle: string) => {
    setSelectedFormId(formId);
    setSelectedFormTitle(formTitle);
    setShareModalOpen(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('이름을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        setProfileMessage('프로필이 수정되었습니다.');
      } else {
        setProfileError(data.error || '프로필 수정에 실패했습니다.');
      }
    } catch (err) {
      setProfileError('서버 오류가 발생했습니다.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMessage('비밀번호가 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      setPasswordError('서버 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDeleteForm = async (formId: number) => {
    if (!confirm('정말 이 설문조사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('설문조사가 삭제되었습니다.');
        // Refresh forms list
        const formsRes = await fetch('/api/forms?my=true');
        if (formsRes.ok) {
          const formsData = await formsRes.json();
          setForms(formsData.forms || []);
        }
      } else {
        const data = await res.json();
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleDuplicateForm = async (formId: number) => {
    try {
      const res = await fetch(`/api/forms/${formId}/duplicate`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('설문조사가 복제되었습니다.');
        // Refresh forms list
        const formsRes = await fetch('/api/forms?my=true');
        if (formsRes.ok) {
          const formsData = await formsRes.json();
          setForms(formsData.forms || []);
        }
      } else {
        const data = await res.json();
        alert(data.error || '복제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleToggleOpen = async (formId: number, currentStatus: number) => {
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: forms.find(f => f.id === formId)?.title,
          description: forms.find(f => f.id === formId)?.description,
          is_open: currentStatus === 1 ? 0 : 1,
        }),
      });

      if (res.ok) {
        // Refresh forms list
        const formsRes = await fetch('/api/forms?my=true');
        if (formsRes.ok) {
          const formsData = await formsRes.json();
          setForms(formsData.forms || []);
        }
      } else {
        const data = await res.json();
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">마이페이지</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 text-center font-medium transition ${
                activeTab === 'profile'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              프로필 수정
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 text-center font-medium transition ${
                activeTab === 'password'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              비밀번호 변경
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`flex-1 py-4 text-center font-medium transition ${
                activeTab === 'forms'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              내 설문조사 ({forms.length})
            </button>
          </div>

          <div className="p-6">
            {/* 프로필 수정 탭 */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="max-w-md">
                {profileMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">{profileMessage}</p>
                  </div>
                )}
                {profileError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{profileError}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    이름
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                    placeholder="홍길동"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-4 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
                >
                  프로필 수정
                </button>
              </form>
            )}

            {/* 비밀번호 변경 탭 */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="max-w-md">
                {passwordMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">{passwordMessage}</p>
                  </div>
                )}
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{passwordError}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      현재 비밀번호
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      새 비밀번호
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                      placeholder="6자 이상"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      새 비밀번호 확인
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                      placeholder="비밀번호 재입력"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full mt-4 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
                >
                  비밀번호 변경
                </button>
              </form>
            )}

            {/* 내 설문조사 탭 */}
            {activeTab === 'forms' && (
              <div>
                {/* Search and Filter */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="설문조사 검색..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        filterStatus === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setFilterStatus('open')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        filterStatus === 'open'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      진행중
                    </button>
                    <button
                      onClick={() => setFilterStatus('closed')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        filterStatus === 'closed'
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      마감
                    </button>
                  </div>
                </div>

                {getFilteredForms().length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchTerm ? '검색 결과가 없습니다.' : '아직 만든 설문조사가 없습니다.'}
                    </p>
                    {!searchTerm && (
                      <Link
                        href="/survey/create"
                        className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        첫 설문조사 만들기
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredForms().map((form) => (
                      <div
                        key={form.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {form.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded ${
                                form.is_open
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {form.is_open ? '진행중' : '마감'}
                              </span>
                            </div>
                            {form.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{form.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>📊 {form.response_count}명 참여</span>
                              <span>📅 {new Date(form.created_at).toLocaleDateString('ko-KR')}</span>
                              {form.deadline && (
                                <span className={form.is_open && new Date(form.deadline) > new Date() ? 'text-green-600' : 'text-red-600'}>
                                  ⏰ 마감: {new Date(form.deadline).toLocaleDateString('ko-KR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Link
                                href={`/survey/${form.id}`}
                                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                              >
                                보기
                              </Link>
                              <Link
                                href={`/survey/${form.id}/results`}
                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                              >
                                결과
                              </Link>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openShareModal(form.id.toString(), form.title)}
                                className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                              >
                                공유
                              </button>
                              <button
                                onClick={() => handleToggleOpen(form.id, form.is_open)}
                                className={`flex-1 px-3 py-2 text-white rounded-lg transition text-sm ${
                                  form.is_open
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {form.is_open ? '마감' : '열기'}
                              </button>
                              <button
                                onClick={() => handleDuplicateForm(form.id)}
                                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                              >
                                복제
                              </button>
                              <button
                                onClick={() => router.push(`/survey/create?edit=${form.id}`)}
                                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteForm(form.id)}
                                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 뒤로 가기 */}
        <div className="text-center">
          <Link
            href="/"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && selectedFormId && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedFormId(null);
            setSelectedFormTitle('');
          }}
          formId={selectedFormId}
          formTitle={selectedFormTitle}
        />
      )}
    </div>
  );
}
