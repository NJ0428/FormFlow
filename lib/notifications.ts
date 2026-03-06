import db from './db';
import {
  sendNewResponseEmail,
  sendDeadlineReminderEmail,
  sendGoalAchievementEmail,
} from './email';
import { getFormPermission } from './permissions';

export enum NotificationType {
  NEW_RESPONSE = 'new_response',
  DEADLINE_REMINDER = 'deadline_reminder',
  GOAL_ACHIEVEMENT = 'goal_achievement',
}

interface NotificationRecipient {
  userId: number;
  email: string;
  name?: string;
  permissionLevel: string;
}

interface NotificationSettings {
  notify_on_response: number;
  notify_deadline_reminder: number;
  deadline_reminder_days: string;
  notify_goal_achievement: number;
  response_goal: number | null;
  goal_notification_sent: number;
  last_notification_at: string | null;
}

export class NotificationService {
  /**
   * 폼의 알림 설정을 가져옵니다.
   */
  getNotificationSettings(formId: number): NotificationSettings | null {
    const form = db
      .prepare(
        `
        SELECT notify_on_response, notify_deadline_reminder, deadline_reminder_days,
               notify_goal_achievement, response_goal, goal_notification_sent, last_notification_at
        FROM forms
        WHERE id = ?
      `
      )
      .get(formId) as NotificationSettings | undefined;

    return form || null;
  }

  /**
   * 폼의 알림 수신자 목록을 가져옵니다 (소유자 + 에디터 이상 협업자).
   */
  getNotificationRecipients(formId: number): NotificationRecipient[] {
    // 폼 소유자
    const form = db
      .prepare(
        `
        SELECT f.user_id as userId, u.email, u.name
        FROM forms f
        JOIN users u ON f.user_id = u.id
        WHERE f.id = ?
      `
      )
      .get(formId) as { userId: number; email: string; name?: string } | undefined;

    const recipients: NotificationRecipient[] = [];

    if (form) {
      recipients.push({
        userId: form.userId,
        email: form.email,
        name: form.name,
        permissionLevel: 'owner',
      });
    }

    // 에디터 이상 협업자
    const collaborators = db
      .prepare(
        `
        SELECT fc.user_id as userId, u.email, u.name, fc.permission_level
        FROM form_collaborators fc
        JOIN users u ON fc.user_id = u.id
        WHERE fc.form_id = ? AND fc.permission_level IN ('editor', 'owner')
      `
      )
      .all(formId) as NotificationRecipient[];

    recipients.push(...collaborators);

    return recipients;
  }

  /**
   * 알림 기록을 저장합니다.
   */
  logNotification(
    formId: number,
    type: NotificationType,
    email: string,
    name: string | undefined,
    status: 'sent' | 'failed',
    errorMessage?: string
  ): void {
    try {
      db.prepare(
        `
        INSERT INTO notification_history (form_id, notification_type, recipient_email, recipient_name, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      ).run(formId, type, email, name || null, status, errorMessage || null);
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * 새 응답 알림을 발송합니다.
   */
  async notifyNewResponse(formId: number, responseId: number): Promise<void> {
    try {
      const settings = this.getNotificationSettings(formId);
      if (!settings || !settings.notify_on_response) {
        return;
      }

      // 알림 쿨다운 체크 (1시간)
      if (settings.last_notification_at) {
        const lastNotif = new Date(settings.last_notification_at);
        const now = new Date();
        const hoursSinceLast = (now.getTime() - lastNotif.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 1) {
          console.log(`[Notification] Cooldown active for form ${formId}`);
          return;
        }
      }

      const form = db
        .prepare('SELECT title, deadline FROM forms WHERE id = ?')
        .get(formId) as { title: string; deadline?: string } | undefined;

      if (!form) return;

      const responseCount = db
        .prepare('SELECT COUNT(*) as count FROM responses WHERE form_id = ?')
        .get(formId) as { count: number };

      const recipients = this.getNotificationRecipients(formId);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const resultsUrl = `${baseUrl}/survey/${formId}/results`;

      for (const recipient of recipients) {
        try {
          await sendNewResponseEmail(
            recipient.email,
            form.title,
            resultsUrl,
            responseCount.count,
            recipient.name
          );
          this.logNotification(formId, NotificationType.NEW_RESPONSE, recipient.email, recipient.name, 'sent');
        } catch (error: any) {
          console.error(`Failed to send notification to ${recipient.email}:`, error);
          this.logNotification(
            formId,
            NotificationType.NEW_RESPONSE,
            recipient.email,
            recipient.name,
            'failed',
            error.message
          );
        }
      }

      // 마지막 알림 시간 업데이트
      db.prepare('UPDATE forms SET last_notification_at = CURRENT_TIMESTAMP WHERE id = ?').run(formId);
    } catch (error) {
      console.error('Error in notifyNewResponse:', error);
    }
  }

  /**
   * 마감 기한 임박 알림을 체크하고 발송합니다.
   */
  async checkDeadlineReminders(): Promise<void> {
    try {
      // 마감 기한이 있는 열린 폼 찾기
      const forms = db
        .prepare(
          `
          SELECT id, title, deadline, deadline_reminder_days
          FROM forms
          WHERE is_open = 1
            AND deadline IS NOT NULL
            AND notify_deadline_reminder = 1
            AND datetime(deadline) > datetime('now')
        `
        )
        .all() as Array<{
          id: number;
          title: string;
          deadline: string;
          deadline_reminder_days: string;
        }>;

      const now = new Date();

      for (const form of forms) {
        try {
          const deadline = new Date(form.deadline);
          const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // 설정된 리마인더 일자 확인 (예: "1,3" → 1일 전, 3일 전)
          const reminderDays = form.deadline_reminder_days.split(',').map((d) => parseInt(d.trim()));

          if (reminderDays.includes(daysUntil)) {
            // 이미 오늘 알림을 보냈는지 확인
            const todayNotif = db
              .prepare(
                `
                SELECT COUNT(*) as count
                FROM notification_history
                WHERE form_id = ?
                  AND notification_type = ?
                  AND date(sent_at) = date('now')
              `
              )
              .get(form.id, NotificationType.DEADLINE_REMINDER) as { count: number };

            if (todayNotif.count > 0) {
              continue; // 이미 오늘 알림을 보냈음
            }

            const responseCount = db
              .prepare('SELECT COUNT(*) as count FROM responses WHERE form_id = ?')
              .get(form.id) as { count: number };

            const recipients = this.getNotificationRecipients(form.id);
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const formUrl = `${baseUrl}/survey/${form.id}`;

            for (const recipient of recipients) {
              try {
                await sendDeadlineReminderEmail(
                  recipient.email,
                  form.title,
                  formUrl,
                  daysUntil,
                  responseCount.count,
                  recipient.name
                );
                this.logNotification(
                  form.id,
                  NotificationType.DEADLINE_REMINDER,
                  recipient.email,
                  recipient.name,
                  'sent'
                );
              } catch (error: any) {
                console.error(`Failed to send deadline reminder to ${recipient.email}:`, error);
                this.logNotification(
                  form.id,
                  NotificationType.DEADLINE_REMINDER,
                  recipient.email,
                  recipient.name,
                  'failed',
                  error.message
                );
              }
            }
          }
        } catch (error) {
          console.error(`Error processing form ${form.id} for deadline reminder:`, error);
        }
      }
    } catch (error) {
      console.error('Error in checkDeadlineReminders:', error);
    }
  }

  /**
   * 목표 달성 알림을 체크하고 발송합니다.
   */
  async checkGoalAchievements(): Promise<void> {
    try {
      // 목표가 설정된 폼 찾기
      const forms = db
        .prepare(
          `
          SELECT id, title, response_goal, goal_notification_sent
          FROM forms
          WHERE is_open = 1
            AND response_goal IS NOT NULL
            AND notify_goal_achievement = 1
            AND goal_notification_sent = 0
        `
        )
        .all() as Array<{ id: number; title: string; response_goal: number; goal_notification_sent: number }>;

      for (const form of forms) {
        try {
          const responseCount = db
            .prepare('SELECT COUNT(*) as count FROM responses WHERE form_id = ?')
            .get(form.id) as { count: number };

          if (responseCount.count >= form.response_goal) {
            const recipients = this.getNotificationRecipients(form.id);
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const resultsUrl = `${baseUrl}/survey/${form.id}/results`;

            for (const recipient of recipients) {
              try {
                await sendGoalAchievementEmail(
                  recipient.email,
                  form.title,
                  resultsUrl,
                  form.response_goal,
                  responseCount.count,
                  recipient.name
                );
                this.logNotification(
                  form.id,
                  NotificationType.GOAL_ACHIEVEMENT,
                  recipient.email,
                  recipient.name,
                  'sent'
                );
              } catch (error: any) {
                console.error(`Failed to send goal achievement to ${recipient.email}:`, error);
                this.logNotification(
                  form.id,
                  NotificationType.GOAL_ACHIEVEMENT,
                  recipient.email,
                  recipient.name,
                  'failed',
                  error.message
                );
              }
            }

            // 알림 발송 완료 표시
            db.prepare('UPDATE forms SET goal_notification_sent = 1 WHERE id = ?').run(form.id);
          }
        } catch (error) {
          console.error(`Error processing form ${form.id} for goal achievement:`, error);
        }
      }
    } catch (error) {
      console.error('Error in checkGoalAchievements:', error);
    }
  }
}

// 싱글톤 인스턴스
let notificationServiceInstance: NotificationService | null = null;

export const getNotificationService = (): NotificationService => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
};
