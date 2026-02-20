import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/templates/[id] - 특정 템플릿 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(params.id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      template: {
        ...template,
        questions: JSON.parse((template as any).questions),
        is_preset: (template as any).is_preset === 1,
      }
    });
  } catch (error) {
    console.error('Fetch template error:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Check if template exists and belongs to user (or is preset)
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(params.id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if ((template as any).is_preset === 1) {
      return NextResponse.json({ error: 'Cannot delete preset templates' }, { status: 403 });
    }

    if ((template as any).user_id !== parseInt(userId || '0')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    db.prepare('DELETE FROM templates WHERE id = ?').run(params.id);

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
