import nodemailer from 'nodemailer';

// 이메일 전송을 위한 트랜스포터 생성 (개발용)
// 실제 환경에서는 환경 변수로 설정해야 합니다
const createTransporter = () => {
  // 개발용: 테스트 계정 설정
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'test@example.com',
      pass: process.env.EMAIL_PASS || 'password',
    },
  });
};

// 설문조사 초대 이메일 템플릿
export const generateInvitationEmail = (
  surveyTitle: string,
  surveyUrl: string,
  recipientName?: string,
  message?: string
) => {
  const greeting = recipientName ? `${recipientName}님,` : '안녕하세요,';

  return {
    subject: `[설문조사] ${surveyTitle}에 초대됩니다`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>설문조사 초대</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #9333ea;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 20px 0;
          }
          .content {
            margin: 20px 0;
          }
          .message {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-style: italic;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
          .link {
            color: #9333ea;
            text-decoration: none;
          }
          .info-box {
            background-color: #ede9fe;
            border-left: 4px solid #9333ea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📋 FormFlow</div>
          </div>

          <p>${greeting}</p>

          <div class="content">
            <p>아래 설문조사에 참여해 주셔서 감사합니다.</p>

            <h2 class="title">📊 ${surveyTitle}</h2>

            ${message ? `<div class="message">${message}</div>` : ''}

            <div class="info-box">
              <p><strong>⏰ 예상 소요 시간:</strong> 약 5-10분</p>
              <p><strong>📝 설문 기간:</strong> 마감일까지 참여 가능</p>
            </div>

            <div class="button-container">
              <a href="${surveyUrl}" class="button">설문조사 시작하기 →</a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              또는 아래 링크를 클릭하세요:<br>
              <a href="${surveyUrl}" class="link">${surveyUrl}</a>
            </p>
          </div>

          <div class="footer">
            <p>이 이메일은 FormFlow 플랫폼을 통해 발송되었습니다.</p>
            <p>설문조사와 관련하여 문의가 있으시면 발신자에게 직접 연락해 주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// 리마인더 이메일 템플릿
export const generateReminderEmail = (
  surveyTitle: string,
  surveyUrl: string,
  recipientName?: string,
  daysUntilDeadline?: number
) => {
  const greeting = recipientName ? `${recipientName}님,` : '안녕하세요,';
  const deadlineMessage = daysUntilDeadline
    ? `마감일까지 <strong>${daysUntilDeadline}일</strong> 남았습니다.`
    : '마감이 다가오고 있습니다.';

  return {
    subject: `[리마인더] ${surveyTitle}에 아직 응답하지 않으셨습니다`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>설문조사 리마인더</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fef3c7;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-top: 4px solid #f59e0b;
          }
          .alert {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .alert-icon {
            font-size: 24px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #9333ea;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 20px 0;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📋 FormFlow</div>
          </div>

          <p>${greeting}</p>

          <div class="alert">
            <span class="alert-icon">⏰</span>
            <div>
              <strong>아직 응답하지 않으셨습니다!</strong><br>
              ${deadlineMessage}
            </div>
          </div>

          <div class="title">📊 ${surveyTitle}</div>

          <p>소중한 의견을 아직 전달받지 못했습니다. 잠시 시간을 내어 설문조사에 참여해 주시면 대단히 감사하겠습니다.</p>

          <div class="button-container">
            <a href="${surveyUrl}" class="button">지금 응답하기 →</a>
          </div>

          <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
            <a href="${surveyUrl}" style="color: #9333ea;">${surveyUrl}</a>
          </p>

          <div class="footer">
            <p>이 이메일은 FormFlow 플랫폼을 통해 발송되었습니다.</p>
            <p>이미 설문조사에 참여하셨다면 이 이메일을 무시하셔도 됩니다.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// 이메일 발송 함수
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 개발 환경에서는 실제 이메일을 발송하지 않고 로그만 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [개발 모드] 이메일 발송 시뮬레이션:');
      console.log(`받는 사람: ${to}`);
      console.log(`제목: ${subject}`);
      console.log('---');
      return { success: true };
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'FormFlow <noreply@formflow.com>',
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// 초대 이메일 발송
export const sendInvitationEmail = async (
  to: string,
  surveyTitle: string,
  surveyUrl: string,
  recipientName?: string,
  message?: string
) => {
  const email = generateInvitationEmail(surveyTitle, surveyUrl, recipientName, message);
  return sendEmail(to, email.subject, email.html);
};

// 리마인더 이메일 발송
export const sendReminderEmail = async (
  to: string,
  surveyTitle: string,
  surveyUrl: string,
  recipientName?: string,
  daysUntilDeadline?: number
) => {
  const email = generateReminderEmail(surveyTitle, surveyUrl, recipientName, daysUntilDeadline);
  return sendEmail(to, email.subject, email.html);
};

// 새 응답 도착 알림 이메일 템플릿
export const generateNewResponseEmail = (
  formTitle: string,
  resultsUrl: string,
  responseCount: number,
  recipientName?: string
) => {
  const greeting = recipientName ? `${recipientName}님,` : '안녕하세요,';

  return {
    subject: `[새 응답] ${formTitle}에 새로운 응답이 도착했습니다`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>새 응답 알림</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f0fdf4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-top: 4px solid #22c55e;
          }
          .alert {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .alert-icon {
            font-size: 24px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #9333ea;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 20px 0;
          }
          .stats {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .stats-number {
            font-size: 36px;
            font-weight: bold;
            color: #9333ea;
          }
          .stats-label {
            color: #6b7280;
            font-size: 14px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📋 FormFlow</div>
          </div>

          <p>${greeting}</p>

          <div class="alert">
            <span class="alert-icon">📬</span>
            <div>
              <strong>새로운 응답이 도착했습니다!</strong>
            </div>
          </div>

          <h2 class="title">📊 ${formTitle}</h2>

          <div class="stats">
            <div class="stats-number">${responseCount}</div>
            <div class="stats-label">총 응답 수</div>
          </div>

          <p>설문조사에 새로운 응답이 제출되었습니다. 지금 결과를 확인해보세요!</p>

          <div class="button-container">
            <a href="${resultsUrl}" class="button">결과 확인하기 →</a>
          </div>

          <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
            <a href="${resultsUrl}" style="color: #9333ea;">${resultsUrl}</a>
          </p>

          <div class="footer">
            <p>이 이메일은 FormFlow 플랫폼을 통해 발송되었습니다.</p>
            <p>알림 설정은 설문조사 편집 페이지에서 변경할 수 있습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// 마감 기한 임박 알림 이메일 템플릿 (소유자용)
export const generateDeadlineReminderEmail = (
  formTitle: string,
  formUrl: string,
  daysUntilDeadline: number,
  responseCount: number,
  recipientName?: string
) => {
  const greeting = recipientName ? `${recipientName}님,` : '안녕하세요,';

  return {
    subject: `[마감 임박] ${formTitle} 마감일이 ${daysUntilDeadline}일 남았습니다`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>마감 임박 알림</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fef3c7;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-top: 4px solid #f59e0b;
          }
          .alert {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .alert-icon {
            font-size: 24px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #9333ea;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 20px 0;
          }
          .info-box {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-item:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #6b7280;
          }
          .info-value {
            font-weight: 600;
            color: #1f2937;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          }
          .button-secondary {
            display: inline-block;
            padding: 12px 24px;
            background-color: #f3f4f6;
            color: #374151;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-left: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📋 FormFlow</div>
          </div>

          <p>${greeting}</p>

          <div class="alert">
            <span class="alert-icon">⏰</span>
            <div>
              <strong>마감일이 임박했습니다!</strong><br>
              ${daysUntilDeadline}일 남았습니다.
            </div>
          </div>

          <h2 class="title">📊 ${formTitle}</h2>

          <div class="info-box">
            <div class="info-item">
              <span class="info-label">현재 응답 수</span>
              <span class="info-value">${responseCount}개</span>
            </div>
            <div class="info-item">
              <span class="info-label">마감까지 남은 시간</span>
              <span class="info-value">${daysUntilDeadline}일</span>
            </div>
          </div>

          <p>마감일이 다가오고 있습니다. 더 많은 응답을 얻을 수 있도록 설문조사를 공유해보세요!</p>

          <div class="button-container">
            <a href="${formUrl}" class="button">설문조사 공유하기 →</a>
          </div>

          <div class="footer">
            <p>이 이메일은 FormFlow 플랫폼을 통해 발송되었습니다.</p>
            <p>알림 설정은 설문조사 편집 페이지에서 변경할 수 있습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// 목표 달성 알림 이메일 템플릿
export const generateGoalAchievementEmail = (
  formTitle: string,
  resultsUrl: string,
  goalCount: number,
  currentCount: number,
  recipientName?: string
) => {
  const greeting = recipientName ? `${recipientName}님,` : '안녕하세요,';

  return {
    subject: `[🎉 목표 달성] ${formTitle}이 목표 응답 수를 달성했습니다!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>목표 달성 알림</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ede9fe;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-top: 4px solid #9333ea;
          }
          .celebration {
            text-align: center;
            font-size: 64px;
            margin: 20px 0;
            animation: bounce 1s ease infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #9333ea;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 20px 0;
          }
          .stats {
            background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 20px 0;
            text-align: center;
          }
          .stats-number {
            font-size: 48px;
            font-weight: bold;
            color: #9333ea;
          }
          .stats-label {
            color: #6b7280;
            font-size: 16px;
            margin-top: 5px;
          }
          .goal-info {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .goal-progress {
            font-size: 18px;
            color: #22c55e;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📋 FormFlow</div>
          </div>

          <div class="celebration">🎉</div>

          <h2 class="title" style="text-align: center;">목표 달성을 축하합니다!</h2>

          <p style="text-align: center;">${greeting}</p>

          <h3 class="title" style="text-align: center;">📊 ${formTitle}</h3>

          <div class="stats">
            <div class="stats-number">${currentCount}</div>
            <div class="stats-label">현재 총 응답 수</div>
          </div>

          <div class="goal-info">
            <div class="goal-progress">✅ 목표 ${goalCount}개 달성!</div>
            <p style="color: #6b7280; margin: 0;">설문조사에 많은 관심을 가져주셔서 감사합니다.</p>
          </div>

          <p style="text-align: center;">지금 응답 결과를 확인하고 더 자세한 통계를 보세요!</p>

          <div class="button-container">
            <a href="${resultsUrl}" class="button">결과 확인하기 →</a>
          </div>

          <div class="footer">
            <p>이 이메일은 FormFlow 플랫폼을 통해 발송되었습니다.</p>
            <p>알림 설정은 설문조사 편집 페이지에서 변경할 수 있습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// 새 응답 알림 이메일 발송
export const sendNewResponseEmail = async (
  to: string,
  formTitle: string,
  resultsUrl: string,
  responseCount: number,
  recipientName?: string
) => {
  const email = generateNewResponseEmail(formTitle, resultsUrl, responseCount, recipientName);
  return sendEmail(to, email.subject, email.html);
};

// 마감 기한 임박 알림 이메일 발송
export const sendDeadlineReminderEmail = async (
  to: string,
  formTitle: string,
  formUrl: string,
  daysUntilDeadline: number,
  responseCount: number,
  recipientName?: string
) => {
  const email = generateDeadlineReminderEmail(formTitle, formUrl, daysUntilDeadline, responseCount, recipientName);
  return sendEmail(to, email.subject, email.html);
};

// 목표 달성 알림 이메일 발송
export const sendGoalAchievementEmail = async (
  to: string,
  formTitle: string,
  resultsUrl: string,
  goalCount: number,
  currentCount: number,
  recipientName?: string
) => {
  const email = generateGoalAchievementEmail(formTitle, resultsUrl, goalCount, currentCount, recipientName);
  return sendEmail(to, email.subject, email.html);
};
