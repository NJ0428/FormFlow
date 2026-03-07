'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  currentImage: string | null;
  onUpload: (file: File) => Promise<string>;
  onDelete: () => Promise<void>;
  uploading?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  maxSizeMB?: number;
}

export default function ImageUpload({
  label,
  currentImage,
  onUpload,
  onDelete,
  uploading = false,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  maxSize = 5 * 1024 * 1024, // 5MB
  maxSizeMB = 5
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const acceptedTypes = accept.split(',');
    if (!acceptedTypes.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP만 가능합니다.';
    }

    // Check file size
    if (file.size > maxSize) {
      return `파일 크기가 ${maxSizeMB}MB를 초과할 수 없습니다.`;
    }

    return null;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      setError('');
      await onUpload(file);
    }
  }, [onUpload, maxSize, accept, maxSizeMB]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError('');

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      await onUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async () => {
    if (confirm('이미지를 삭제하시겠습니까?')) {
      await onDelete();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {currentImage ? (
        // Preview existing image
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
            <img
              src={currentImage}
              alt={label}
              className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-700"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={handleButtonClick}
                disabled={uploading}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                변경
              </button>
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Upload area
        <div>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleChange}
              disabled={uploading}
              className="hidden"
            />

            {uploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-400">업로드 중...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                  <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    JPEG, PNG, GIF, WebP (최대 {maxSizeMB}MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
