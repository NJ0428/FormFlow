'use client';

import { useState, useEffect } from 'react';
import { X, Palette, Image as ImageIcon, Layout, CheckCircle } from 'lucide-react';
import ColorPicker from './ColorPicker';
import ImageUpload from './ImageUpload';

interface BrandingSettings {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  background_image_url: string | null;
  background_image_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  background_image_size: 'cover' | 'contain' | 'auto';
  completion_message: string;
  completion_image_url: string | null;
  completion_button_text: string;
  completion_button_url: string | null;
  show_completion_image: boolean;
}

interface BrandingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

type TabType = 'colors' | 'logo' | 'background' | 'completion';

const POSITION_OPTIONS = [
  { value: 'center', label: '중앙' },
  { value: 'top', label: '상단' },
  { value: 'bottom', label: '하단' },
  { value: 'left', label: '좌측' },
  { value: 'right', label: '우측' },
];

const SIZE_OPTIONS = [
  { value: 'cover', label: '덮기 (Cover)' },
  { value: 'contain', label: '맞춤 (Contain)' },
  { value: 'auto', label: '원본 크기 (Auto)' },
];

export default function BrandingSettingsModal({
  isOpen,
  onClose,
  formId,
  formTitle
}: BrandingSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const [branding, setBranding] = useState<BrandingSettings>({
    logo_url: null,
    primary_color: '#7C3AED',
    secondary_color: '#4F46E5',
    background_color: '#FFFFFF',
    text_color: '#1F2937',
    background_image_url: null,
    background_image_position: 'center',
    background_image_size: 'cover',
    completion_message: '응답해 주셔서 감사합니다!',
    completion_image_url: null,
    completion_button_text: '목록으로',
    completion_button_url: null,
    show_completion_image: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBranding();
    }
  }, [isOpen, formId]);

  const fetchBranding = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/branding`, {
        headers: {
          'Cookie': `auth-token=${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBranding(data.branding);
      } else {
        const data = await response.json();
        setError(data.error || '브랜딩 설정을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Fetch branding error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (field: keyof BrandingSettings, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleImageUpload = async (field: 'logo' | 'background' | 'completion', file: File) => {
    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', field);

      const response = await fetch(`/api/forms/${formId}/branding/image`, {
        method: 'POST',
        headers: {
          'Cookie': `auth-token=${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (field === 'logo') {
          setBranding(prev => ({ ...prev, logo_url: data.url }));
        } else if (field === 'background') {
          setBranding(prev => ({ ...prev, background_image_url: data.url }));
        } else if (field === 'completion') {
          setBranding(prev => ({ ...prev, completion_image_url: data.url }));
        }
        setHasChanges(true);
        setSuccess('이미지가 업로드되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError('서버 오류가 발생했습니다.');
    }
  };

  const handleImageDelete = async (field: 'logo' | 'background' | 'completion') => {
    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/branding/image?type=${field}`, {
        method: 'DELETE',
        headers: {
          'Cookie': `auth-token=${token}`
        }
      });

      if (response.ok) {
        if (field === 'logo') {
          setBranding(prev => ({ ...prev, logo_url: null }));
        } else if (field === 'background') {
          setBranding(prev => ({ ...prev, background_image_url: null }));
        } else if (field === 'completion') {
          setBranding(prev => ({ ...prev, completion_image_url: null, show_completion_image: false }));
        }
        setHasChanges(true);
      } else {
        const data = await response.json();
        setError(data.error || '이미지 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Image delete error:', err);
      setError('서버 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/forms/${formId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify(branding)
      });

      if (response.ok) {
        setSuccess('브랜딩 설정이 저장되었습니다.');
        setHasChanges(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || '브랜딩 설정 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Save branding error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'colors' as TabType, label: '색상', icon: Palette },
    { id: 'logo' as TabType, label: '로고', icon: ImageIcon },
    { id: 'background' as TabType, label: '배경', icon: Layout },
    { id: 'completion' as TabType, label: '완료 페이지', icon: CheckCircle },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">브랜딩 설정</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorPicker
                      label="기본 색상 (Primary)"
                      value={branding.primary_color}
                      onChange={(color) => handleColorChange('primary_color', color)}
                    />
                    <ColorPicker
                      label="보조 색상 (Secondary)"
                      value={branding.secondary_color}
                      onChange={(color) => handleColorChange('secondary_color', color)}
                    />
                    <ColorPicker
                      label="배경 색상"
                      value={branding.background_color}
                      onChange={(color) => handleColorChange('background_color', color)}
                    />
                    <ColorPicker
                      label="텍스트 색상"
                      value={branding.text_color}
                      onChange={(color) => handleColorChange('text_color', color)}
                    />
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">미리보기</h3>
                    <div
                      className="rounded-lg p-6"
                      style={{
                        backgroundColor: branding.background_color,
                        color: branding.text_color
                      }}
                    >
                      <button
                        className="px-4 py-2 rounded-lg font-medium"
                        style={{ backgroundColor: branding.primary_color, color: '#FFFFFF' }}
                      >
                        기본 버튼
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg font-medium ml-2"
                        style={{ backgroundColor: branding.secondary_color, color: '#FFFFFF' }}
                      >
                        보조 버튼
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Logo Tab */}
              {activeTab === 'logo' && (
                <div className="space-y-6">
                  <ImageUpload
                    label="로고 이미지"
                    currentImage={branding.logo_url}
                    onUpload={(file) => handleImageUpload('logo', file)}
                    onDelete={() => handleImageDelete('logo')}
                  />
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 팁</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                      <li>• 권장 크기: 200px x 60px</li>
                      <li>• 지원 형식: PNG, JPEG, GIF, WebP</li>
                      <li>• 투명 배경 PNG 권장</li>
                      <li>• 최대 파일 크기: 5MB</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Background Tab */}
              {activeTab === 'background' && (
                <div className="space-y-6">
                  <ImageUpload
                    label="배경 이미지"
                    currentImage={branding.background_image_url}
                    onUpload={(file) => handleImageUpload('background', file)}
                    onDelete={() => handleImageDelete('background')}
                  />

                  {branding.background_image_url && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          이미지 위치
                        </label>
                        <select
                          value={branding.background_image_position}
                          onChange={(e) => handleColorChange('background_image_position', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          {POSITION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          이미지 크기
                        </label>
                        <select
                          value={branding.background_image_size}
                          onChange={(e) => handleColorChange('background_image_size', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          {SIZE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Completion Page Tab */}
              {activeTab === 'completion' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      완료 메시지
                    </label>
                    <textarea
                      value={branding.completion_message}
                      onChange={(e) => handleColorChange('completion_message', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      placeholder="설문조사 완료 후 표시할 메시지를 입력하세요..."
                    />
                  </div>

                  <ImageUpload
                    label="완료 페이지 이미지"
                    currentImage={branding.completion_image_url}
                    onUpload={(file) => handleImageUpload('completion', file)}
                    onDelete={() => handleImageDelete('completion')}
                  />

                  {branding.completion_image_url && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showCompletionImage"
                        checked={branding.show_completion_image}
                        onChange={(e) => setBranding(prev => ({ ...prev, show_completion_image: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="showCompletionImage" className="text-sm text-gray-700 dark:text-gray-300">
                        완료 페이지에 이미지 표시
                      </label>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      버튼 텍스트
                    </label>
                    <input
                      type="text"
                      value={branding.completion_button_text}
                      onChange={(e) => handleColorChange('completion_button_text', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="목록으로"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      버튼 URL (선택)
                    </label>
                    <input
                      type="url"
                      value={branding.completion_button_url || ''}
                      onChange={(e) => handleColorChange('completion_button_url', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="https://example.com"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      완료 후 이동할 페이지 URL을 입력하세요. 비워두면 목록 페이지로 이동합니다.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            닫기
          </button>
          <div className="flex gap-3">
            {hasChanges && (
              <span className="px-3 py-1 text-orange-600 dark:text-orange-400 text-sm flex items-center">
                저장되지 않은 변경사항이 있습니다
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
