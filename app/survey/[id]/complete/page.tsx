'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface Branding {
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

interface Form {
  id: number;
  title: string;
  description: string | null;
  branding?: Branding;
}

export default function CompletionPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, [surveyId]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${surveyId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
      } else {
        // Form not found or error, redirect to survey list
        router.push('/survey');
      }
    } catch (error) {
      console.error('Fetch form error:', error);
      router.push('/survey');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (form?.branding?.completion_button_url) {
      // If custom URL is provided, navigate there
      window.location.href = form.branding.completion_button_url;
    } else {
      // Default to survey list
      router.push('/survey');
    }
  };

  const getBackgroundStyles = () => {
    if (!form?.branding) return {};

    const styles: Record<string, string> = {};

    if (form.branding.background_image_url) {
      styles.backgroundImage = `url(${form.branding.background_image_url})`;
      styles.backgroundPosition = form.branding.background_image_position;
      styles.backgroundSize = form.branding.background_image_size;
      styles.backgroundRepeat = 'no-repeat';
    }

    return styles;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!form) {
    return null;
  }

  const branding = form.branding;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        ...getBackgroundStyles(),
        backgroundColor: branding?.background_color || '#ffffff'
      }}
    >
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Logo */}
          {branding?.logo_url && (
            <div className="mb-6 flex justify-center">
              <img
                src={branding.logo_url}
                alt="Logo"
                className="max-h-20 object-contain"
              />
            </div>
          )}

          {/* Success Icon or Custom Image */}
          {branding?.show_completion_image && branding?.completion_image_url ? (
            <div className="mb-6">
              <img
                src={branding.completion_image_url}
                alt="Completion"
                className="max-h-48 mx-auto rounded-lg"
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                backgroundColor: `${branding?.primary_color || '#7C3AED'}20`
              }}
            >
              <CheckCircle
                className="w-12 h-12"
                style={{ color: branding?.primary_color || '#7C3AED' }}
              />
            </div>
          )}

          {/* Completion Message */}
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: branding?.text_color || '#1F2937' }}
          >
            제출 완료!
          </h2>
          <p
            className="text-lg mb-8"
            style={{ color: branding?.text_color || '#6B7280' }}
          >
            {branding?.completion_message || '응답해 주셔서 감사합니다!'}
          </p>

          {/* Action Button */}
          <button
            onClick={handleButtonClick}
            className="w-full px-6 py-4 text-white rounded-lg hover:opacity-90 transition font-medium flex items-center justify-center gap-2"
            style={{
              backgroundColor: branding?.primary_color || '#7C3AED'
            }}
          >
            {branding?.completion_button_text || '목록으로'}
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Additional Info */}
          <p className="mt-6 text-sm" style={{ color: branding?.text_color || '#9CA3AF' }}>
            설문조사: {form.title}
          </p>
        </div>
      </div>
    </div>
  );
}
