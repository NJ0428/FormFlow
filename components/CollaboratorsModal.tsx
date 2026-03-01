'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Shield, Trash2, UserPlus, Loader2 } from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string | null;
}

interface Collaborator {
  id: number;
  user_id: number;
  email: string;
  name: string | null;
  permission_level: 'owner' | 'editor' | 'viewer';
  added_at: string;
}

interface CollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

const PERMISSION_LABELS = {
  owner: '소유자',
  editor: '편집자',
  viewer: '뷰어'
};

const PERMISSION_DESCRIPTIONS = {
  owner: '모든 권한 (수정, 삭제, 협업자 관리)',
  editor: '수정 가능 (삭제, 협업자 관리 불가)',
  viewer: '조회만 가능'
};

export default function CollaboratorsModal({
  isOpen,
  onClose,
  formId,
  formTitle
}: CollaboratorsModalProps) {
  const [owner, setOwner] = useState<User | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'editor' | 'viewer'>('editor');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, formId]);

  const fetchCollaborators = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/collaborators`, {
        headers: {
          'Cookie': `auth-token=${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOwner(data.owner);
        setCollaborators(data.collaborators);
      } else {
        const data = await response.json();
        setError(data.error || '협업자 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Fetch collaborators error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify({
          email: email.trim(),
          permission_level: permission
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators);
        setEmail('');
        setSuccess('협업자가 추가되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || '협업자 추가에 실패했습니다.');
      }
    } catch (err) {
      console.error('Add collaborator error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdatePermission = async (userId: number, newPermission: 'editor' | 'viewer') => {
    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/collaborators/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify({
          permission_level: newPermission
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators);
        setSuccess('권한이 수정되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || '권한 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('Update permission error:', err);
      setError('서버 오류가 발생했습니다.');
    }
  };

  const handleRemoveCollaborator = async (userId: number) => {
    if (!confirm('정말 이 협업자를 제거하시겠습니까?')) {
      return;
    }

    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/collaborators/${userId}`, {
        method: 'DELETE',
        headers: {
          'Cookie': `auth-token=${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators);
        setSuccess('협업자가 제거되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || '협업자 제거에 실패했습니다.');
      }
    } catch (err) {
      console.error('Remove collaborator error:', err);
      setError('서버 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">협업자 관리</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error and Success Messages */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Owner Section */}
          {owner && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{owner.name || owner.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{owner.email}</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                  소유자
                </span>
              </div>
            </div>
          )}

          {/* Add Collaborator Form */}
          <form onSubmit={handleAddCollaborator} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">협업자 추가</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'editor' | 'viewer')}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="editor">편집자</option>
                <option value="viewer">뷰어</option>
              </select>
              <button
                type="submit"
                disabled={adding}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    추가 중...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    추가
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {PERMISSION_DESCRIPTIONS[permission]}
            </p>
          </form>

          {/* Collaborators List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : collaborators.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                협업자 ({collaborators.length})
              </h3>
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {collaborator.name?.charAt(0) || collaborator.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {collaborator.name || collaborator.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{collaborator.email}</p>
                  </div>
                  <select
                    value={collaborator.permission_level}
                    onChange={(e) => handleUpdatePermission(collaborator.user_id, e.target.value as 'editor' | 'viewer')}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="editor">편집자</option>
                    <option value="viewer">뷰어</option>
                  </select>
                  <button
                    onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="협업자 제거"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              협업자가 없습니다.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
