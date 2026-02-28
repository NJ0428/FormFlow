import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import db from '@/lib/db';

// 공개 목록 - 인증 없이 모든 설문조사 목록 반환
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const myOnly = searchParams.get('my') === 'true';
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    // Build the WHERE clause for filtering
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (myOnly) {
      const token = request.cookies.get('auth-token')?.value;
      if (!token) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
      }

      whereConditions.push('f.user_id = ?');
      params.push(decoded.id);
    } else {
      whereConditions.push('f.is_open = 1');
    }

    if (category && category !== 'all') {
      whereConditions.push('f.category = ?');
      params.push(category);
    }

    if (tag) {
      whereConditions.push(`f.id IN (SELECT form_id FROM form_tags WHERE tag = ?)`);
      params.push(tag);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const forms = db.prepare(
      `SELECT f.*, u.name as author_name,
        (SELECT COUNT(*) FROM responses WHERE form_id = f.id) as response_count
      FROM forms f
      LEFT JOIN users u ON f.user_id = u.id
      ${whereClause}
      ORDER BY f.created_at DESC`
    ).all(...params);

    // Fetch tags for each form
    const formsWithTags = (forms as any[]).map((form) => {
      const tags = db.prepare('SELECT tag FROM form_tags WHERE form_id = ?').all(form.id);
      return {
        ...form,
        tags: tags.map((t: any) => t.tag)
      };
    });

    return NextResponse.json({ forms: formsWithTags });
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

    const { title, description, deadline, questions, category, tags } = await request.json();

    if (!title) {
      return NextResponse.json({ error: '제목은 필수입니다.' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO forms (user_id, title, description, deadline, category) VALUES (?, ?, ?, ?, ?)'
    ).run(decoded.id, title, description || null, deadline || null, category || 'other');

    const formId = result.lastInsertRowid as number;

    // Insert tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO form_tags (form_id, tag) VALUES (?, ?)');
      tags.forEach((tag: string) => {
        if (tag && tag.trim()) {
          insertTag.run(formId, tag.trim());
        }
      });
    }

    if (questions && Array.isArray(questions)) {
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

    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId);

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error('Create form error:', error);
    return NextResponse.json({ error: '폼 생성에 실패했습니다.' }, { status: 500 });
  }
}
