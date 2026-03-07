import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { canEditForm } from '@/lib/permissions';
import { recordFormChange } from '@/lib/history';
import db from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { id } = await params;
    const formId = parseInt(id);

    if (!canEditForm(formId, decoded.id)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      primary_color,
      secondary_color,
      background_color,
      text_color,
      background_image_url,
      background_image_position,
      background_image_size,
      completion_message,
      completion_image_url,
      completion_button_text,
      completion_button_url,
      show_completion_image,
      logo_url
    } = body;

    // Update branding settings
    const updateFields = [];
    const updateValues = [];

    if (primary_color !== undefined) {
      updateFields.push('primary_color = ?');
      updateValues.push(primary_color);
    }
    if (secondary_color !== undefined) {
      updateFields.push('secondary_color = ?');
      updateValues.push(secondary_color);
    }
    if (background_color !== undefined) {
      updateFields.push('background_color = ?');
      updateValues.push(background_color);
    }
    if (text_color !== undefined) {
      updateFields.push('text_color = ?');
      updateValues.push(text_color);
    }
    if (background_image_position !== undefined) {
      updateFields.push('background_image_position = ?');
      updateValues.push(background_image_position);
    }
    if (background_image_size !== undefined) {
      updateFields.push('background_image_size = ?');
      updateValues.push(background_image_size);
    }
    if (completion_message !== undefined) {
      updateFields.push('completion_message = ?');
      updateValues.push(completion_message);
    }
    if (completion_button_text !== undefined) {
      updateFields.push('completion_button_text = ?');
      updateValues.push(completion_button_text);
    }
    if (completion_button_url !== undefined) {
      updateFields.push('completion_button_url = ?');
      updateValues.push(completion_button_url);
    }
    if (show_completion_image !== undefined) {
      updateFields.push('show_completion_image = ?');
      updateValues.push(show_completion_image ? 1 : 0);
    }
    if (logo_url !== undefined) {
      updateFields.push('logo_url = ?');
      updateValues.push(logo_url);
    }
    if (background_image_url !== undefined) {
      updateFields.push('background_image_url = ?');
      updateValues.push(background_image_url);
    }
    if (completion_image_url !== undefined) {
      updateFields.push('completion_image_url = ?');
      updateValues.push(completion_image_url);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: '업데이트할 필드가 없습니다.' }, { status: 400 });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(formId);

    db.prepare(
      `UPDATE forms SET ${updateFields.join(', ')} WHERE id = ?`
    ).run(...updateValues);

    // Get updated form
    const updatedForm = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as any;

    // Record the change
    recordFormChange(formId, decoded.id, 'branding_updated', {
      fields: updateFields
    });

    // Return branding data
    const branding = {
      logo_url: updatedForm.logo_url,
      primary_color: updatedForm.primary_color,
      secondary_color: updatedForm.secondary_color,
      background_color: updatedForm.background_color,
      text_color: updatedForm.text_color,
      background_image_url: updatedForm.background_image_url,
      background_image_position: updatedForm.background_image_position,
      background_image_size: updatedForm.background_image_size,
      completion_message: updatedForm.completion_message,
      completion_image_url: updatedForm.completion_image_url,
      completion_button_text: updatedForm.completion_button_text,
      completion_button_url: updatedForm.completion_button_url,
      show_completion_image: updatedForm.show_completion_image === 1
    };

    return NextResponse.json({ branding });
  } catch (error) {
    console.error('Update branding error:', error);
    return NextResponse.json({ error: '브랜딩 설정 업데이트에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formId = parseInt(id);

    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as any;
    if (!form) {
      return NextResponse.json({ error: '폼을 찾을 수 없습니다.' }, { status: 404 });
    }

    // Return branding data with defaults if not set
    const branding = {
      logo_url: form.logo_url || null,
      primary_color: form.primary_color || '#7C3AED',
      secondary_color: form.secondary_color || '#4F46E5',
      background_color: form.background_color || '#FFFFFF',
      text_color: form.text_color || '#1F2937',
      background_image_url: form.background_image_url || null,
      background_image_position: form.background_image_position || 'center',
      background_image_size: form.background_image_size || 'cover',
      completion_message: form.completion_message || '응답해 주셔서 감사합니다!',
      completion_image_url: form.completion_image_url || null,
      completion_button_text: form.completion_button_text || '목록으로',
      completion_button_url: form.completion_button_url || null,
      show_completion_image: form.show_completion_image === 1
    };

    return NextResponse.json({ branding });
  } catch (error) {
    console.error('Get branding error:', error);
    return NextResponse.json({ error: '브랜딩 설정을 가져올 수 없습니다.' }, { status: 500 });
  }
}
