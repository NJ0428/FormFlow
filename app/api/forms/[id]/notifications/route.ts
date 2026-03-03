import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { getFormPermission } from '@/lib/permissions';

// GET - 알림 설정 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formId = parseInt(params.id);
    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    // 권한 체크
    const permission = getFormPermission(formId, user.id);
    if (!permission.canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 알림 설정 조회
    const settings = db
      .prepare(
        `
        SELECT
          notify_on_response,
          notify_deadline_reminder,
          deadline_reminder_days,
          notify_goal_achievement,
          response_goal,
          goal_notification_sent
        FROM forms
        WHERE id = ?
      `
      )
      .get(formId);

    if (!settings) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // deadline_reminder_days를 배열로 변환
    const settingsWithArray = {
      ...settings,
      deadline_reminder_days: settings.deadline_reminder_days
        ? settings.deadline_reminder_days.split(',').map((d: string) => parseInt(d.trim()))
        : [1, 3],
    };

    return NextResponse.json(settingsWithArray);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - 알림 설정 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formId = parseInt(params.id);
    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    // 권한 체크
    const permission = getFormPermission(formId, user.id);
    if (!permission.canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      notify_on_response,
      notify_deadline_reminder,
      deadline_reminder_days,
      notify_goal_achievement,
      response_goal,
    } = body;

    // deadline_reminder_days 배열을 문자열로 변환
    const deadlineDaysStr = Array.isArray(deadline_reminder_days)
      ? deadline_reminder_days.join(',')
      : deadline_reminder_days || '1,3';

    // 목표 응답 수가 변경되면 알림 발송 상태 초기화
    const currentForm = db
      .prepare('SELECT response_goal FROM forms WHERE id = ?')
      .get(formId) as { response_goal: number | null } | undefined;

    const resetGoalNotification =
      currentForm && response_goal !== currentForm.response_goal ? 1 : undefined;

    // 알림 설정 업데이트
    db.prepare(
      `
      UPDATE forms SET
        notify_on_response = ?,
        notify_deadline_reminder = ?,
        deadline_reminder_days = ?,
        notify_goal_achievement = ?,
        response_goal = ?
        ${resetGoalNotification !== undefined ? ', goal_notification_sent = 0' : ''}
      WHERE id = ?
    `
    ).run(
      notify_on_response !== undefined ? (notify_on_response ? 1 : 0) : undefined,
      notify_deadline_reminder !== undefined ? (notify_deadline_reminder ? 1 : 0) : undefined,
      deadlineDaysStr,
      notify_goal_achievement !== undefined ? (notify_goal_achievement ? 1 : 0) : undefined,
      response_goal !== undefined ? (response_goal || null) : null,
      formId
    );

    // 업데이트된 설정 조회
    const updatedSettings = db
      .prepare(
        `
        SELECT
          notify_on_response,
          notify_deadline_reminder,
          deadline_reminder_days,
          notify_goal_achievement,
          response_goal,
          goal_notification_sent
        FROM forms
        WHERE id = ?
      `
      )
      .get(formId);

    const settingsWithArray = {
      ...updatedSettings,
      deadline_reminder_days: (updatedSettings as any).deadline_reminder_days
        .split(',')
        .map((d: string) => parseInt(d.trim())),
    };

    return NextResponse.json(settingsWithArray);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
