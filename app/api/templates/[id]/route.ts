import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/templates/[id] - 특정 템플릿 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(params.id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      template: {
        ...template,
        questions: JSON.parse((template as any).questions),
        is_preset: (template as any).is_preset === 1,
      }
    });
  } catch (error) {
    console.error('Fetch template error:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { id } = await params;

    // Check if template exists and belongs to user (or is preset)
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if ((template as any).is_preset === 1) {
      return NextResponse.json({ error: '프리셋 템플릿은 삭제할 수 없습니다.' }, { status: 403 });
    }

    if ((template as any).user_id !== decoded.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    db.prepare('DELETE FROM templates WHERE id = ?').run(id);

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
