import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { canManageCollaborators, updateCollaboratorPermission, removeCollaborator, getFormCollaborators, PermissionLevel } from '@/lib/permissions';

// PUT /api/forms/[id]/collaborators/[userId] - Update collaborator permission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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

    const { id, userId } = await params;
    const formId = parseInt(id);
    const targetUserId = parseInt(userId);

    // Check if user can manage collaborators
    if (!canManageCollaborators(formId, decoded.id)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { permission_level } = await request.json();

    if (!permission_level) {
      return NextResponse.json({ error: '권한 레벨을 입력해주세요.' }, { status: 400 });
    }

    if (!['editor', 'viewer'].includes(permission_level)) {
      return NextResponse.json({ error: '잘못된 권한 레벨입니다.' }, { status: 400 });
    }

    // Update collaborator permission
    const success = updateCollaboratorPermission(formId, targetUserId, permission_level as PermissionLevel);
    if (!success) {
      return NextResponse.json({ error: '협업자 권한 수정에 실패했습니다.' }, { status: 500 });
    }

    // Get the updated list of collaborators
    const collaborators = getFormCollaborators(formId);

    return NextResponse.json({
      message: '협업자 권한이 수정되었습니다.',
      collaborators
    });
  } catch (error) {
    console.error('Update collaborator error:', error);
    return NextResponse.json({ error: '협업자 권한 수정에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE /api/forms/[id]/collaborators/[userId] - Remove a collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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

    const { id, userId } = await params;
    const formId = parseInt(id);
    const targetUserId = parseInt(userId);

    // Check if user can manage collaborators
    if (!canManageCollaborators(formId, decoded.id)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // Remove collaborator
    const success = removeCollaborator(formId, targetUserId);
    if (!success) {
      return NextResponse.json({ error: '협업자 제거에 실패했습니다.' }, { status: 500 });
    }

    // Get the updated list of collaborators
    const collaborators = getFormCollaborators(formId);

    return NextResponse.json({
      message: '협업자가 제거되었습니다.',
      collaborators
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return NextResponse.json({ error: '협업자 제거에 실패했습니다.' }, { status: 500 });
  }
}
