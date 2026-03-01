import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { canManageCollaborators, getFormCollaborators, addCollaborator, PermissionLevel } from '@/lib/permissions';
import { getUserByEmail } from '@/lib/auth';
import db from '@/lib/db';

// GET /api/forms/[id]/collaborators - Get all collaborators for a form
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

    // Check if user can view collaborators (must have at least viewer access)
    const form = db.prepare('SELECT user_id FROM forms WHERE id = ?').get(formId) as { user_id: number } | undefined;
    if (!form) {
      return NextResponse.json({ error: '폼을 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check if user is owner or collaborator
    const collaborators = getFormCollaborators(formId);
    const isOwner = form.user_id === decoded.id;
    const isCollaborator = collaborators.some((c: any) => c.user_id === decoded.id);

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // Add owner info to the response
    const owner = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(form.user_id);

    return NextResponse.json({
      owner,
      collaborators
    });
  } catch (error) {
    console.error('Get collaborators error:', error);
    return NextResponse.json({ error: '협업자 목록을 가져올 수 없습니다.' }, { status: 500 });
  }
}

// POST /api/forms/[id]/collaborators - Add a new collaborator
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

    // Check if user can manage collaborators
    if (!canManageCollaborators(formId, decoded.id)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { email, permission_level } = await request.json();

    if (!email || !permission_level) {
      return NextResponse.json({ error: '이메일과 권한 레벨을 모두 입력해주세요.' }, { status: 400 });
    }

    if (!['owner', 'editor', 'viewer'].includes(permission_level)) {
      return NextResponse.json({ error: '잘못된 권한 레벨입니다.' }, { status: 400 });
    }

    // Find user by email
    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check if the form owner (can't add owner as collaborator, they're already owner)
    const form = db.prepare('SELECT user_id FROM forms WHERE id = ?').get(formId) as { user_id: number } | undefined;
    if (form && form.user_id === user.id) {
      return NextResponse.json({ error: '이미 소유자인 사용자입니다.' }, { status: 400 });
    }

    // Add collaborator
    const success = addCollaborator(formId, user.id, permission_level as PermissionLevel);
    if (!success) {
      return NextResponse.json({ error: '협업자 추가에 실패했습니다.' }, { status: 500 });
    }

    // Get the updated list of collaborators
    const collaborators = getFormCollaborators(formId);

    return NextResponse.json({
      message: '협업자가 추가되었습니다.',
      collaborators
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    return NextResponse.json({ error: '협업자 추가에 실패했습니다.' }, { status: 500 });
  }
}
