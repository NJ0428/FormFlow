import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = parseInt(params.id);
    
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId);
    if (!form) {
      return NextResponse.json({ error: '폼을 찾을 수 없습니다.' }, { status: 404 });
    }

    const questions = db.prepare(
      'SELECT * FROM questions WHERE form_id = ? ORDER BY order_index'
    ).all(formId);

    return NextResponse.json({ form: { ...form, questions } });
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json({ error: '폼을 가져올 수 없습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const formId = parseInt(params.id);
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as any;

    if (!form || form.user_id !== decoded.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { title, description, is_open } = await request.json();

    db.prepare(
      'UPDATE forms SET title = ?, description = ?, is_open = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(title, description || null, is_open ? 1 : 0, formId);

    const updatedForm = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId);

    return NextResponse.json({ form: updatedForm });
  } catch (error) {
    console.error('Update form error:', error);
    return NextResponse.json({ error: '폼 수정에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const formId = parseInt(params.id);
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as any;

    if (!form || form.user_id !== decoded.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    db.prepare('DELETE FROM forms WHERE id = ?').run(formId);

    return NextResponse.json({ message: '폼이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete form error:', error);
    return NextResponse.json({ error: '폼 삭제에 실패했습니다.' }, { status: 500 });
  }
}
