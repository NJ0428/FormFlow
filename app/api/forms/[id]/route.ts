import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formId = parseInt(id);

    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId);
    if (!form) {
      return NextResponse.json({ error: '폼을 찾을 수 없습니다.' }, { status: 404 });
    }

    const questions = db.prepare(
      'SELECT * FROM questions WHERE form_id = ? ORDER BY order_index'
    ).all(formId);

    // Parse options from JSON string to array and condition data
    const parsedQuestions = questions.map((q: any) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : undefined,
      condition: q.condition_question_id ? {
        questionId: q.condition_question_id,
        value: q.condition_value ? JSON.parse(q.condition_value) : undefined,
        operator: q.condition_operator || 'equals'
      } : undefined
    }));

    // Fetch tags for the form
    const tags = db.prepare('SELECT tag FROM form_tags WHERE form_id = ?').all(formId);
    const tagArray = tags.map((t: any) => t.tag);

    // Check if current user is the owner
    let isOwner = false;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && (form as any).user_id === decoded.id) {
        isOwner = true;
      }
    }

    return NextResponse.json({ form: { ...form, questions: parsedQuestions, tags: tagArray }, isOwner });
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json({ error: '폼을 가져올 수 없습니다.' }, { status: 500 });
  }
}

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
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as any;

    if (!form || form.user_id !== decoded.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { title, description, is_open, deadline, questions, category, tags } = await request.json();

    db.prepare(
      'UPDATE forms SET title = ?, description = ?, deadline = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(title, description || null, deadline || null, category || 'other', formId);

    // If is_open is provided, update it (for toggle functionality)
    if (is_open !== undefined) {
      db.prepare('UPDATE forms SET is_open = ? WHERE id = ?').run(is_open ? 1 : 0, formId);
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      db.prepare('DELETE FROM form_tags WHERE form_id = ?').run(formId);

      // Insert new tags
      if (Array.isArray(tags) && tags.length > 0) {
        const insertTag = db.prepare('INSERT INTO form_tags (form_id, tag) VALUES (?, ?)');
        tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            insertTag.run(formId, tag.trim());
          }
        });
      }
    }

    // If questions are provided, update them
    if (questions && Array.isArray(questions)) {
      // Delete existing questions
      db.prepare('DELETE FROM questions WHERE form_id = ?').run(formId);

      // Insert new questions
      const insertQuestion = db.prepare(
        'INSERT INTO questions (form_id, type, title, description, options, required, order_index, condition_question_id, condition_value, condition_operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      questions.forEach((q: any, index: number) => {
        insertQuestion.run(
          formId,
          q.type,
          q.title,
          q.description || null,
          q.options ? JSON.stringify(q.options) : null,
          q.required ? 1 : 0,
          index,
          q.condition?.questionId ? parseInt(q.condition.questionId as string) : null,
          q.condition?.value ? JSON.stringify(q.condition.value) : null,
          q.condition?.operator || 'equals'
        );
      });
    }

    // Get updated form with questions
    const updatedForm = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as any;
    const updatedQuestions = db.prepare(
      'SELECT * FROM questions WHERE form_id = ? ORDER BY order_index'
    ).all(formId);

    // Get updated tags
    const updatedTags = db.prepare('SELECT tag FROM form_tags WHERE form_id = ?').all(formId);
    const tagArray = updatedTags.map((t: any) => t.tag);

    // Parse options and conditions
    const parsedQuestions = updatedQuestions.map((q: any) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : undefined,
      condition: q.condition_question_id ? {
        questionId: q.condition_question_id,
        value: q.condition_value ? JSON.parse(q.condition_value) : undefined,
        operator: q.condition_operator || 'equals'
      } : undefined
    }));

    return NextResponse.json({ form: { ...updatedForm, questions: parsedQuestions, tags: tagArray } });
  } catch (error) {
    console.error('Update form error:', error);
    return NextResponse.json({ error: '폼 수정에 실패했습니다.' }, { status: 500 });
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
