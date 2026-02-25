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
    const templateId = parseInt(id);

    // Get template
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId) as any;

    if (!template) {
      return NextResponse.json({ error: '템플릿을 찾을 수 없습니다.' }, { status: 404 });
    }

    // Parse questions from template
    const questions = JSON.parse(template.questions);

    // Create new form with default title
    const result = db.prepare(
      'INSERT INTO forms (user_id, title, description, is_open, deadline) VALUES (?, ?, ?, ?, ?)'
    ).run(
      decoded.id,
      template.name + ' (복제본)',
      template.description || null,
      0, // Start as closed
      null
    );

    const newFormId = result.lastInsertRowid as number;

    // Insert questions from template
    const insertQuestion = db.prepare(
      'INSERT INTO questions (form_id, type, title, description, options, required, order_index, condition_question_id, condition_value, condition_operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    questions.forEach((q: any, index: number) => {
      // Handle condition - convert string IDs to null (will be invalid for new form)
      let conditionQuestionId = null;
      let conditionValue = null;
      let conditionOperator = null;

      if (q.condition) {
        // For template questions, conditions may reference other template questions
        // We'll need to map these to the new question IDs
        // For now, we'll store the condition and let the user reconfigure it
        conditionValue = q.condition.value ? JSON.stringify(q.condition.value) : null;
        conditionOperator = q.condition.operator || 'equals';
      }

      insertQuestion.run(
        newFormId,
        q.type,
        q.title,
        null, // description
        q.options ? JSON.stringify(q.options) : null,
        q.required ? 1 : 0,
        index,
        conditionQuestionId,
        conditionValue,
        conditionOperator
      );
    });

    const newForm = db.prepare('SELECT * FROM forms WHERE id = ?').get(newFormId);

    return NextResponse.json({ form: newForm }, { status: 201 });
  } catch (error) {
    console.error('Duplicate template error:', error);
    return NextResponse.json({ error: '폼 생성에 실패했습니다.' }, { status: 500 });
  }
}
