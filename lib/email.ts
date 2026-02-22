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
