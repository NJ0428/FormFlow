import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(
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

    const responses = db.prepare(
      'SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC'
    ).all(formId);

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Get responses error:', error);
    return NextResponse.json({ error: '응답 목록을 가져올 수 없습니다.' }, { status: 500 });
  }
}
