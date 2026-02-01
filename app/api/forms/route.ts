import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const forms = db.prepare(
      'SELECT * FROM forms WHERE user_id = ? ORDER BY created_at DESC'
    ).all(decoded.id);

    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Get forms error:', error);
    return NextResponse.json({ error: '폼 목록을 가져올 수 없습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { title, description, questions } = await request.json();

    if (!title) {
      return NextResponse.json({ error: '제목은 필수입니다.' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO forms (user_id, title, description) VALUES (?, ?, ?)'
    ).run(decoded.id, title, description || null);

    const formId = result.lastInsertRowid as number;

    if (questions && Array.isArray(questions)) {
      const insertQuestion = db.prepare(
        'INSERT INTO questions (form_id, type, title, description, options, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );

      questions.forEach((q: any, index: number) => {
        insertQuestion.run(
          formId,
          q.type,
          q.title,
          q.description || null,
          q.options ? JSON.stringify(q.options) : null,
          q.required ? 1 : 0,
          index
        );
      });
    }

    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId);

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error('Create form error:', error);
    return NextResponse.json({ error: '폼 생성에 실패했습니다.' }, { status: 500 });
  }
}
