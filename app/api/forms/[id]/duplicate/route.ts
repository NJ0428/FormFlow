import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

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
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as any;

    if (!form || form.user_id !== decoded.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // Create new form with same data
    const result = db.prepare(
      'INSERT INTO forms (user_id, title, description, is_open, deadline) VALUES (?, ?, ?, ?, ?)'
    ).run(
      decoded.id,
      form.title + ' (복제본)',
      form.description,
      0, // Start as closed
      form.deadline
    );

    const newFormId = result.lastInsertRowid as number;

    // Copy all questions
    const questions = db.prepare(
      'SELECT * FROM questions WHERE form_id = ? ORDER BY order_index'
    ).all(formId);

    const insertQuestion = db.prepare(
      'INSERT INTO questions (form_id, type, title, description, options, required, order_index, condition_question_id, condition_value, condition_operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    questions.forEach((q: any) => {
      insertQuestion.run(
        newFormId,
        q.type,
        q.title,
        q.description,
        q.options,
        q.required,
        q.order_index,
        q.condition_question_id,
        q.condition_value,
        q.condition_operator
      );
    });

    const newForm = db.prepare('SELECT * FROM forms WHERE id = ?').get(newFormId);

    return NextResponse.json({ form: newForm }, { status: 201 });
  } catch (error) {
    console.error('Duplicate form error:', error);
    return NextResponse.json({ error: '폼 복제에 실패했습니다.' }, { status: 500 });
  }
}
