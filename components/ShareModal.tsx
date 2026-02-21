'use client';

import { useState, useEffect } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Users from 'lucide-react/dist/esm/icons/users';
import Clock from 'lucide-react/dist/esm/icons/clock';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Send from 'lucide-react/dist/esm/icons/send';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';

interface Invitation {
  id: number;
  email: string;
  name: string | null;
  status: 'pending' | 'responded' | 'failed';
  sent_at: string | null;
  responded_at: string | null;
  reminder_count: number;
  last_reminder_at: string | null;
  created_at: string;
}

interface InvitationStats {
  pending?: number;
  responded?: number;
  failed?: number;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

export default function ShareModal({ isOpen, onClose, formId, formTitle }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'email' | 'invitations'>('link');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({});
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<Array<{ email: string; name: string }>>([{ email: '', name: '' }]);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedInvitations, setSelectedInvitations] = useState<number[]>([]);

  // 초대 목록 불러오기
  useEffect(() => {
    if (isOpen && activeTab === 'invitations') {
      fetchInvitations();
    }
  }, [isOpen, activeTab, formId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forms/${formId}/invitations`, {
        headers: {
          Authorization: token || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/survey/${formId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const addEmailField = () => {
    setEmails([...emails, { email: '', name: '' }]);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, field: 'email' | 'name', value: string) => {
    const newEmails = [...emails];
    newEmails[index][field] = value;
    setEmails(newEmails);
  };

  const sendInvitations = async () => {
    // 유효성 검사
    const validEmails = emails.filter((e) => e.email.trim() !== '');
    if (validEmails.length === 0) {
      alert('최소 한 명 이상의 수신자를 추가해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter((e) => !emailRegex.test(e.email));

    if (invalidEmails.length > 0) {
      alert('유효하지 않은 이메일 주소가 있습니다. 다시 확인해주세요.');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forms/${formId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || '',
        },
        body: JSON.stringify({
          emails: validEmails,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.sent}명에게 초대장을 발송했습니다.${data.failed > 0 ? ` ${data.failed}명 실패` : ''}`);

        // 입력 초기화
        setEmails([{ email: '', name: '' }]);
        setMessage('');

        // 초대 탭으로 이동
        setActiveTab('invitations');
      } else {
        const error = await response.json();
        alert(error.error || '초대장 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send invitations:', error);
      alert('초대장 발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  const sendReminders = async (allPending: boolean = false) => {
    if (!allPending && selectedInvitations.length === 0) {
      alert('리마인더를 발송할 대상을 선택해주세요.');
      return;
    }

    if (!confirm('리마인더 이메일을 발송하시겠습니까?')) {
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forms/${formId}/invitations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || '',
        },
        body: JSON.stringify({
          invitationIds: allPending ? undefined : selectedInvitations,
          allPending,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.sent}명에게 리마인더를 발송했습니다.${data.failed > 0 ? ` ${data.failed}명 실패` : ''}`);
        setSelectedInvitations([]);
        fetchInvitations();
      } else {
        const error = await response.json();
        alert(error.error || '리마인더 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send reminders:', error);
      alert('리마인더 발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  const deleteInvitation = async (invitationId: number) => {
    if (!confirm('이 초대를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forms/${formId}/invitations?invitation_id=${invitationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token || '',
        },
      });

      if (response.ok) {
        fetchInvitations();
      } else {
        alert('초대 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete invitation:', error);
      alert('초대 삭제 중 오류가 발생했습니다.');
    }
  };

  const toggleSelectAll = () => {
    const pendingIds = invitations.filter((inv) => inv.status === 'pending').map((inv) => inv.id);
    if (selectedInvitations.length === pendingIds.length) {
      setSelectedInvitations([]);
    } else {
      setSelectedInvitations(pendingIds);
    }
  };

  const toggleSelectInvitation = (id: number) => {
    if (selectedInvitations.includes(id)) {
      setSelectedInvitations(selectedInvitations.filter((i) => i !== id));
    } else {
      setSelectedInvitations([...selectedInvitations, id]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">설문조사 공유</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{formTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('link')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                activeTab === 'link'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              🔗 링크 공유
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                activeTab === 'email'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              ✉️ 이메일 발송
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-2 rounded-lg transition font-medium relative ${
                activeTab === 'invitations'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              👥 초대 관리
              {stats.pending && stats.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.pending}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">설문조사 링크</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/survey/${formId}`}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 공유 팁</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• 이 링크를 클릭하면 누구나 설문조사에 참여할 수 있습니다</li>
                  <li>• SNS, 메신저, 이메일 등을 통해 자유롭게 공유하세요</li>
                  <li>• 이메일로 초대장을 발송하려면 '이메일 발송' 탭을 이용하세요</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">수신자 추가</h3>

                {emails.map((email, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="이름 (선택)"
                      value={email.name}
                      onChange={(e) => updateEmail(index, 'name', e.target.value)}
                      className="w-1/3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      value={email.email}
                      onChange={(e) => updateEmail(index, 'email', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    {emails.length > 1 && (
                      <button
                        onClick={() => removeEmailField(index)}
                        className="px-3 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={addEmailField}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition"
                >
                  + 수신자 추가
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">추가 메시지 (선택)</h3>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="수신자에게 전달할 추가 메시지를 입력하세요..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <button
                onClick={sendInvitations}
                disabled={sending}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    초대장 발송하기
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'invitations' && (
            <div className="space-y-4">
              {/* 통계 카드 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                  <Users className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.pending || 0}</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">대기 중</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.responded || 0}</p>
                  <p className="text-sm text-green-700 dark:text-green-400">응답 완료</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                  <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {invitations.reduce((sum, inv) => sum + inv.reminder_count, 0)}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-400">리마인더 발송</p>
                </div>
              </div>

              {/* 액션 버튼 */}
              {stats.pending && stats.pending > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => sendReminders(true)}
                    disabled={sending}
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    모든 미응답자에게 리마인더
                  </button>
                  {selectedInvitations.length > 0 && (
                    <button
                      onClick={() => sendReminders(false)}
                      disabled={sending}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      선택한 {selectedInvitations.length}명에게 리마인더
                    </button>
                  )}
                </div>
              )}

              {/* 초대 목록 */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">아직 발송한 초대장이 없습니다</p>
                  <button
                    onClick={() => setActiveTab('email')}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    첫 번째 초대장 발송하기
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* 헤더 */}
                  {stats.pending && stats.pending > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInvitations.length === invitations.filter((inv) => inv.status === 'pending').length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          대기 중인 모든 초대 선택 ({selectedInvitations.length} / {stats.pending})
                        </span>
                      </label>
                    </div>
                  )}

                  {/* 목록 */}
                  <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                          invitation.status === 'responded' ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {invitation.status === 'pending' && (
                              <input
                                type="checkbox"
                                checked={selectedInvitations.includes(invitation.id)}
                                onChange={() => toggleSelectInvitation(invitation.id)}
                                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                            )}

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {invitation.name || invitation.email}
                                </span>
                                {invitation.status === 'pending' && (
                                  <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                                    대기 중
                                  </span>
                                )}
                                {invitation.status === 'responded' && (
                                  <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                                    응답 완료
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{invitation.email}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>발송: {invitation.sent_at ? new Date(invitation.sent_at).toLocaleDateString('ko-KR') : '-'}</span>
                                {invitation.responded_at && (
                                  <span>응답: {new Date(invitation.responded_at).toLocaleDateString('ko-KR')}</span>
                                )}
                                {invitation.reminder_count > 0 && (
                                  <span className="text-orange-600 dark:text-orange-400">
                                    리마인더 {invitation.reminder_count}회
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteInvitation(invitation.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {sending && (
          <div className="absolute inset-0 bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">이메일 발송 중...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
