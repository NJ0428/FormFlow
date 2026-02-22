import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendInvitationEmail, sendReminderEmail } from '@/lib/email';
import { verifyAuth } from '@/lib/auth';

// 초대 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyAuth(authHeader);
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 });
    }

    const formId = parseInt(params.id);

    // 폼의 소유자 확인
    const form = db.prepare('SELECT user_id FROM forms WHERE id = ?').get(formId) as any;
    if (!form) {
      return NextResponse.json({ error: '설문조사를 찾을 수 없습니다' }, { status: 404 });
    }

    if (form.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // 초대 목록 조회
    const invitations = db.prepare(`
      SELECT
        id,
        email,
        name,
        status,
        sent_at,
        responded_at,
        reminder_count,
        last_reminder_at,
        created_at
      FROM survey_invitations
      WHERE form_id = ?
      ORDER BY created_at DESC
    `).all(formId);

    // 상태별 통계
    const stats = db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM survey_invitations
      WHERE form_id = ?
      GROUP BY status
    `).all(formId);

    return NextResponse.json({
      invitations,
      stats: stats.reduce((acc: any, item: any) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
    });
  } catch (error: any) {
    console.error('Failed to fetch invitations:', error);
    return NextResponse.json({ error: '초대 목록을 불러오는데 실패했습니다' }, { status: 500 });
  }
}

// 초대 생성 및 이메일 발송
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyAuth(authHeader);
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 });
    }

    const formId = parseInt(params.id);
    const body = await request.json();
    const { emails, message } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: '이메일 주소를 입력해주세요' }, { status: 400 });
    }

    // 폼 정보 조회
    const form = db.prepare('SELECT id, title, user_id FROM forms WHERE id = ?').get(formId) as any;
    if (!form) {
      return NextResponse.json({ error: '설문조사를 찾을 수 없습니다' }, { status: 404 });
    }

    if (form.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // 설문조사 URL 생성
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const surveyUrl = `${baseUrl}/survey/${formId}`;

    const results = [];
    const errors = [];

    for (const invitation of emails) {
      const { email, name } = invitation;

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ email, error: '유효하지 않은 이메일 형식입니다' });
        continue;
      }

      // 이미 초대된 이메일인지 확인
      const existing = db.prepare(
        'SELECT id, status FROM survey_invitations WHERE form_id = ? AND email = ?'
      ).get(formId, email) as any;

      if (existing) {
        if (existing.status === 'pending') {
          errors.push({ email, error: '이미 대기 중인 초대가 있습니다' });
        } else {
          errors.push({ email, error: '이미 응답한 사용자입니다' });
        }
        continue;
      }

      // 데이터베이스에 초대 저장
      const insert = db.prepare(`
        INSERT INTO survey_invitations (form_id, email, name, status, sent_at)
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `);

      const result = insert.run(formId, email, name || null);

      // 이메일 발송
      const emailResult = await sendInvitationEmail(
        email,
        form.title,
        surveyUrl,
        name || undefined,
        message
      );

      if (emailResult.success) {
        results.push({
          id: result.lastInsertRowid,
          email,
          name,
          status: 'sent',
        });
      } else {
        errors.push({
          email,
          error: '이메일 발송 실패',
          details: emailResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    console.error('Failed to send invitations:', error);
    return NextResponse.json({ error: '초대 발송에 실패했습니다' }, { status: 500 });
  }
}

// 미응답자에게 리마인더 발송
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyAuth(authHeader);
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 });
    }

    const formId = parseInt(params.id);
    const body = await request.json();
    const { invitationIds, allPending } = body;

    // 폼 정보 조회
    const form = db.prepare('SELECT id, title, user_id, deadline FROM forms WHERE id = ?').get(formId) as any;
    if (!form) {
      return NextResponse.json({ error: '설문조사를 찾을 수 없습니다' }, { status: 404 });
    }

    if (form.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // 설문조사 URL 생성
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const surveyUrl = `${baseUrl}/survey/${formId}`;

    // 마감일까지 남은 일수 계산
    let daysUntilDeadline;
    if (form.deadline) {
      const deadline = new Date(form.deadline);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 리마인더 발송 대상 선정
    let targetIds: number[] = [];

    if (allPending) {
      // 모든 미응답자에게 발송
      const pendingInvitations = db.prepare(`
        SELECT id, email, name
        FROM survey_invitations
        WHERE form_id = ? AND status = 'pending'
      `).all(formId) as any[];

      targetIds = pendingInvitations.map((inv) => inv.id);
    } else if (invitationIds && Array.isArray(invitationIds)) {
      // 선택된 초대장에만 발송
      targetIds = invitationIds;
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: '리마인더를 발송할 대상이 없습니다' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const invitationId of targetIds) {
      // 초대 정보 조회
      const invitation = db.prepare(`
        SELECT id, email, name, reminder_count
        FROM survey_invitations
        WHERE id = ? AND form_id = ? AND status = 'pending'
      `).get(invitationId) as any;

      if (!invitation) {
        errors.push({ invitationId, error: '초대를 찾을 수 없거나 이미 응답했습니다' });
        continue;
      }

      // 이메일 발송
      const emailResult = await sendReminderEmail(
        invitation.email,
        form.title,
        surveyUrl,
        invitation.name || undefined,
        daysUntilDeadline
      );

      if (emailResult.success) {
        // 리마인더 정보 업데이트
        db.prepare(`
          UPDATE survey_invitations
          SET reminder_count = reminder_count + 1,
              last_reminder_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(invitationId);

        results.push({
          id: invitation.id,
          email: invitation.email,
          reminderCount: invitation.reminder_count + 1,
        });
      } else {
        errors.push({
          invitationId,
          email: invitation.email,
          error: '이메일 발송 실패',
          details: emailResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    console.error('Failed to send reminders:', error);
    return NextResponse.json({ error: '리마인더 발송에 실패했습니다' }, { status: 500 });
  }
}

// 초대 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyAuth(authHeader);
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다' }, { status: 401 });
    }

    const formId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitation_id');

    if (!invitationId) {
      return NextResponse.json({ error: '초대 ID가 필요합니다' }, { status: 400 });
    }

    // 폼의 소유자 확인
    const form = db.prepare('SELECT user_id FROM forms WHERE id = ?').get(formId) as any;
    if (!form || form.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // 초대 삭제
    const result = db.prepare(`
      DELETE FROM survey_invitations
      WHERE id = ? AND form_id = ?
    `).run(invitationId, formId);

    if (result.changes === 0) {
      return NextResponse.json({ error: '초대를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete invitation:', error);
    return NextResponse.json({ error: '초대 삭제에 실패했습니다' }, { status: 500 });
  }
}
