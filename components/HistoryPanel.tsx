'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Edit, Trash2, Plus, FileText, Loader2 } from 'lucide-react';

interface HistoryEntry {
  id: number;
  form_id: number;
  user_id: number;
  user_email?: string;
  user_name?: string;
  action: string;
  changes?: any;
  created_at: string;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

const ACTION_ICONS: Record<string, any> = {
  updated: Edit,
  deleted: Trash2,
  created: Plus,
  default: FileText
};

const ACTION_LABELS: Record<string, string> = {
  updated: '수정됨',
  deleted: '삭제됨',
  created: '생성됨'
};

export default function HistoryPanel({
  isOpen,
  onClose,
  formId,
  formTitle
}: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, formId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/history?limit=50`, {
        headers: {
          'Cookie': `auth-token=${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setTotalCount(data.totalCount);
        setHasMore(data.hasMore);
      } else {
        const data = await response.json();
        setError(data.error || '변경 이력을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Fetch history error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatChanges = (changes: any) => {
    if (!changes) return '';

    const parts: string[] = [];

    if (changes.title) {
      parts.push(`제목: "${changes.title}"`);
    }
    if (changes.questionCount !== undefined) {
      parts.push(`${changes.questionCount}개의 질문`);
    }
    if (changes.description) {
      parts.push(`설명 수정`);
    }

    return parts.join(', ');
  };

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action] || ACTION_ICONS.default;
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'updated':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'deleted':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'created':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">변경 이력</h2>
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pb-2">
                <Clock className="w-4 h-4" />
                <span>총 {totalCount}개의 기록</span>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                {history.map((entry, index) => {
                  const Icon = getActionIcon(entry.action);
                  return (
                    <div key={entry.id} className="relative pl-12 pb-6 last:pb-0">
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${getActionColor(entry.action)}`} />

                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getActionColor(entry.action)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {entry.user_name || entry.user_email || '알 수 없음'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                님이
                              </span>
                              <span className={`text-sm font-medium ${getActionColor(entry.action)}`}>
                                {getActionLabel(entry.action)}
                              </span>
                            </div>

                            {entry.changes && formatChanges(entry.changes) && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {formatChanges(entry.changes)}
                              </p>
                            )}

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {formatTimestamp(entry.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    더 많은 기록이 있습니다...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                변경 이력이 없습니다.
              </p>
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
