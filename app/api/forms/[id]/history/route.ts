import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { canViewForm, getFormPermission, PermissionLevel } from '@/lib/permissions';
import { getFormHistory, getFormHistoryCount } from '@/lib/history';
import db from '@/lib/db';

// GET /api/forms/[id]/history - Get form history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formId = parseInt(id);

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // Check if user can view the form
    if (!canViewForm(formId, decoded.id)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get total count
    const totalCount = getFormHistoryCount(formId);

    // Get history entries
    const history = getFormHistory(formId, limit);

    // Apply offset if needed (for pagination)
    const paginatedHistory = offset > 0 ? history.slice(offset) : history;

    return NextResponse.json({
      history: paginatedHistory,
      totalCount,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: '변경 이력을 가져올 수 없습니다.' }, { status: 500 });
  }
}
