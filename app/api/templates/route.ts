import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/templates - 모든 템플릿 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    let query = 'SELECT * FROM templates WHERE 1=1';
    const params: any[] = [];

    if (userId) {
      query += ' AND (user_id = ? OR user_id IS NULL OR is_preset = 1)';
      params.push(userId);
    } else {
      query += ' AND (user_id IS NULL OR is_preset = 1)';
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY is_preset DESC, created_at DESC';

    const templates = db.prepare(query).all(...params);

    // Parse questions JSON for each template
    const templatesWithParsedQuestions = templates.map((template: any) => ({
      ...template,
      questions: JSON.parse(template.questions),
      is_preset: template.is_preset === 1,
    }));

    return NextResponse.json({ templates: templatesWithParsedQuestions });
  } catch (error) {
    console.error('Fetch templates error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/templates - 새 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, category, questions } = body;

    if (!name || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Name and questions are required' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO templates (user_id, name, description, category, questions)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId || null, name, description || null, category || 'custom', JSON.stringify(questions));

    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      template: {
        ...template,
        questions: JSON.parse((template as any).questions),
        is_preset: (template as any).is_preset === 1,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
