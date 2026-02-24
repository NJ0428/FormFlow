import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Save draft response
export async function POST(
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

    const { session_id, answers } = await request.json();

    if (!session_id || !answers) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    // Check if draft exists
    const existingDraft = db.prepare(
      'SELECT * FROM draft_responses WHERE form_id = ? AND session_id = ?'
    ).get(formId, session_id) as any;

    const answersJson = JSON.stringify(answers);

    if (existingDraft) {
      // Update existing draft
      db.prepare(`
        UPDATE draft_responses
        SET answers = ?, updated_at = CURRENT_TIMESTAMP
        WHERE form_id = ? AND session_id = ?
      `).run(answersJson, formId, session_id);
    } else {
      // Create new draft
      db.prepare(`
        INSERT INTO draft_responses (form_id, session_id, answers)
        VALUES (?, ?, ?)
      `).run(formId, session_id, answersJson);
    }

    return NextResponse.json({ message: '진행 상황이 저장되었습니다.' }, { status: 200 });
  } catch (error) {
    console.error('Save draft error:', error);
    return NextResponse.json({ error: '진행 상황 저장에 실패했습니다.' }, { status: 500 });
  }
}

// Get draft response
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

    const searchParams = request.nextUrl.searchParams;
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({ error: 'session_id 파라미터가 필요합니다.' }, { status: 400 });
    }

    const draft = db.prepare(
      'SELECT * FROM draft_responses WHERE form_id = ? AND session_id = ?'
    ).get(formId, session_id) as any;

    if (!draft) {
      return NextResponse.json({ answers: {} }, { status: 200 });
    }

    return NextResponse.json(
      {
        answers: JSON.parse(draft.answers),
        updated_at: draft.updated_at
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get draft error:', error);
    return NextResponse.json({ error: '진행 상황 불러오기에 실패했습니다.' }, { status: 500 });
  }
}

// Delete draft response
export async function DELETE(
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

    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'session_id가 필요합니다.' }, { status: 400 });
    }

    db.prepare(
      'DELETE FROM draft_responses WHERE form_id = ? AND session_id = ?'
    ).run(formId, session_id);

    return NextResponse.json({ message: '진행 상황이 삭제되었습니다.' }, { status: 200 });
  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json({ error: '진행 상황 삭제에 실패했습니다.' }, { status: 500 });
  }
}
