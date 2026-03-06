'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Mail, Clock, Target, Check, Loader2 } from 'lucide-react';

interface NotificationSettings {
  notify_on_response: number;
  notify_deadline_reminder: number;
  deadline_reminder_days: number[];
  notify_goal_achievement: number;
  response_goal: number | null;
  goal_notification_sent: number;
}

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7];

export default function NotificationSettingsModal({
  isOpen,
  onClose,
  formId,
  formTitle
}: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    notify_on_response: 1,
    notify_deadline_reminder: 1,
    deadline_reminder_days: [1, 3],
    notify_goal_achievement: 0,
    response_goal: null,
    goal_notification_sent: 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [responseGoalInput, setResponseGoalInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, formId]);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/notifications`, {
        headers: {
          'Cookie': `auth-token=${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setResponseGoalInput(data.response_goal?.toString() || '');
      } else {
        const data = await response.json();
        setError(data.error || '알림 설정을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Fetch notification settings error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify({
          notify_on_response: settings.notify_on_response,
          notify_deadline_reminder: settings.notify_deadline_reminder,
          deadline_reminder_days: settings.deadline_reminder_days,
          notify_goal_achievement: settings.notify_goal_achievement,
          response_goal: settings.response_goal
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setSuccess('알림 설정이 저장되었습니다.');
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || '알림 설정 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Save notification settings error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    setSettings(prev => ({
      ...prev,
      deadline_reminder_days: prev.deadline_reminder_days.includes(day)
        ? prev.deadline_reminder_days.filter(d => d !== day)
        : [...prev.deadline_reminder_days, day].sort((a, b) => a - b)
    }));
  };

  const handleResponseGoalChange = (value: string) => {
    setResponseGoalInput(value);
    const num = parseInt(value);
    setSettings(prev => ({
      ...prev,
      response_goal: isNaN(num) || num < 1 ? null : num
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6" />
              알림 설정
            </h2>
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
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
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

              {/* New Response Notification */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">새 응답 알림</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        새로운 응답이 도착하면 이메일로 알림을 받습니다
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, notify_on_response: prev.notify_on_response ? 0 : 1 }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.notify_on_response ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notify_on_response ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Deadline Reminder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">마감 기한 리마인더</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        마감일이 다가오면 리마인더 알림을 받습니다
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, notify_deadline_reminder: prev.notify_deadline_reminder ? 0 : 1 }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.notify_deadline_reminder ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notify_deadline_reminder ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                {settings.notify_deadline_reminder && (
                  <div className="ml-13 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">리마인더를 받을 날짜 선택:</p>
                    <div className="flex flex-wrap gap-2">
                      {REMINDER_DAY_OPTIONS.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleReminderDay(day)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            settings.deadline_reminder_days.includes(day)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }`}
                        >
                          {day}일 전
                        </button>
                      ))}
                    </div>
                    {settings.deadline_reminder_days.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        선택된 날짜: {settings.deadline_reminder_days.sort((a, b) => a - b).join(', ')}일 전
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Goal Achievement */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">목표 달성 알림</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        목표 응답 수에 도달하면 축하 알림을 받습니다
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, notify_goal_achievement: prev.notify_goal_achievement ? 0 : 1 }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.notify_goal_achievement ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notify_goal_achievement ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                {settings.notify_goal_achievement && (
                  <div className="ml-13 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                    <div>
                      <label htmlFor="responseGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        목표 응답 수
                      </label>
                      <input
                        id="responseGoal"
                        type="number"
                        min="1"
                        value={responseGoalInput}
                        onChange={(e) => handleResponseGoalChange(e.target.value)}
                        placeholder="예: 100"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    {settings.goal_notification_sent && (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        목표 달성 알림이 이미 발송되었습니다. 목표를 변경하면 새로운 알림을 받을 수 있습니다.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
