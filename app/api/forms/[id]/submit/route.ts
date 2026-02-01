import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = parseInt(params.id);
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId);

    if (!form) {
      return NextResponse.json({ error: '폼을 찾을 수 없습니다.' }, { status: 404 });
    }

    const { answers } = await request.json();

    const result = db.prepare(
      'INSERT INTO responses (form_id) VALUES (?)'
    ).run(formId);

    const responseId = result.lastInsertRowid as number;

    const insertAnswer = db.prepare(
      'INSERT INTO answers (response_id, question_id, answer) VALUES (?, ?, ?)'
    );

    if (answers && Array.isArray(answers)) {
      answers.forEach((a: any) => {
        insertAnswer.run(responseId, a.questionId, a.answer);
      });
    }

    return NextResponse.json({ message: '응답이 제출되었습니다.' }, { status: 201 });
  } catch (error) {
    console.error('Submit response error:', error);
    return NextResponse.json({ error: '응답 제출에 실패했습니다.' }, { status: 500 });
  }
}
