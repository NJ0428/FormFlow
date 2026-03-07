import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { canEditForm } from '@/lib/permissions';
import db from '@/lib/db';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'branding');

export async function POST(
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('type') as string; // 'logo', 'background', 'completion'

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: '지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP만 가능합니다.'
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: '파일 크기가 5MB를 초과할 수 없습니다.'
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${formId}_${imageType}_${timestamp}_${randomString}.${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate URL
    const fileUrl = `/uploads/branding/${filename}`;

    // Update form with image URL based on type
    let updateColumn = '';
    switch (imageType) {
      case 'logo':
        updateColumn = 'logo_url';
        break;
      case 'background':
        updateColumn = 'background_image_url';
        break;
      case 'completion':
        updateColumn = 'completion_image_url';
        break;
      default:
        return NextResponse.json({ error: '잘못된 이미지 타입입니다.' }, { status: 400 });
    }

    db.prepare(`UPDATE forms SET ${updateColumn} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(fileUrl, formId);

    return NextResponse.json({
      url: fileUrl,
      type: imageType
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('type');

    if (!imageType || !['logo', 'background', 'completion'].includes(imageType)) {
      return NextResponse.json({ error: '잘못된 이미지 타입입니다.' }, { status: 400 });
    }

    // Get current image URL to delete file
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as any;
    if (!form) {
      return NextResponse.json({ error: '폼을 찾을 수 없습니다.' }, { status: 404 });
    }

    let imageUrl = '';
    let updateColumn = '';
    switch (imageType) {
      case 'logo':
        imageUrl = form.logo_url;
        updateColumn = 'logo_url';
        break;
      case 'background':
        imageUrl = form.background_image_url;
        updateColumn = 'background_image_url';
        break;
      case 'completion':
        imageUrl = form.completion_image_url;
        updateColumn = 'completion_image_url';
        break;
    }

    // Update database to remove image URL
    db.prepare(`UPDATE forms SET ${updateColumn} = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(formId);

    // Note: File deletion from filesystem could be added here if needed
    // For now, we just clear the reference

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json({ error: '이미지 삭제에 실패했습니다.' }, { status: 500 });
  }
}
