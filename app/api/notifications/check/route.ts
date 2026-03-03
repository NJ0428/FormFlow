import { NextRequest, NextResponse } from 'next/server';
import { getNotificationService } from '@/lib/notifications';

// 이 API 엔드포인트는 주기적으로 호출되어야 합니다.
// 예: 크론 작업, GitHub Actions, 또는 외부 스케줄링 서비스
// 권장: 매시간 실행

export async function POST(request: NextRequest) {
  try {
    // 간단한 API 키 인증 (선택 사항)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.NOTIFICATION_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationService = getNotificationService();

    // 마감 기한 리마인더 체크
    await notificationService.checkDeadlineReminders();

    // 목표 달성 알림 체크
    await notificationService.checkGoalAchievements();

    return NextResponse.json({
      success: true,
      message: 'Notification check completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Notification check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET 요청도 허용 (테스트용)
export async function GET(request: NextRequest) {
  return POST(request);
}
