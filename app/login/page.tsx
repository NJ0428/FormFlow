'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* 왼쪽: 이미지 섹션 */}
        <div className="relative h-64 lg:h-auto bg-gradient-to-br from-purple-600 to-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=1600&fit=crop"
            alt="Login"
            className="w-full h-full object-cover mix-blend-overlay"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
            <h1 className="text-5xl font-bold mb-4">FormFlow</h1>
            <p className="text-xl text-center opacity-90">간편한 폼 관리의 시작</p>
            <p className="text-sm mt-4 opacity-75">효율적인 업무 흐름을 경험해보세요</p>
          </div>
        </div>

        {/* 오른쪽: 로그인 폼 섹션 */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">로그인</h2>
            <p className="text-gray-600 dark:text-gray-300">계정에 로그인하세요</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              계정이 없으신가요?{' '}
              <a href="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                회원가입
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
