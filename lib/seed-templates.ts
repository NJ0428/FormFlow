import db from './db';

export function seedTemplates() {
  // Check if templates already exist
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM templates WHERE is_preset = 1').get() as { count: number };

  if (existingCount.count > 0) {
    console.log('Preset templates already exist');
    return;
  }

  const templates = [
    {
      name: '고객 만족도 조사',
      description: '제품 또는 서비스에 대한 고객 만족도를 조사하는 템플릿입니다.',
      category: 'customer_satisfaction',
      questions: [
        {
          id: '1',
          type: 'rating',
          title: '전반적으로 우리 서비스에 만족하시나요?',
          required: true,
        },
        {
          id: '2',
          type: 'single',
          title: '우리 서비스를 어떻게 알게 되셨나요?',
          options: ['지인 추천', '검색 엔진', '소셜 미디어', '광고', '기타'],
          required: true,
        },
        {
          id: '3',
          type: 'multiple',
          title: '가장 마음에 드는 점을 모두 선택해주세요.',
          options: ['친절한 응대', '빠른 처리 속도', '합리적인 가격', '다양한 서비스', '편리한 이용 방법'],
          required: false,
        },
        {
          id: '4',
          type: 'short_text',
          title: '추가로 개선이 필요한 부분이 있다면 알려주세요.',
          required: false,
        },
        {
          id: '5',
          type: 'long_text',
          title: '서비스 이용 경험에 대한 자유로운 의견을 남겨주세요.',
          required: false,
        },
      ],
    },
    {
      name: '이벤트 참석 여부 조사',
      description: '행사나 이벤트 참석 의사를 확인하는 템플릿입니다.',
      category: 'event_attendance',
      questions: [
        {
          id: '1',
          type: 'single',
          title: '이번 이벤트에 참석하시겠습니까?',
          options: ['참석함', '불참함', '미정'],
          required: true,
        },
        {
          id: '2',
          type: 'single',
          title: '선호하는 참석 시간대를 선택해주세요.',
          options: ['오전 (9시-12시)', '오후 (12시-6시)', '저녁 (6시-9시)'],
          required: false,
          condition: {
            questionId: '1',
            value: '참석함',
            operator: 'equals',
          },
        },
        {
          id: '3',
          type: 'multiple',
          title: '참석 시 함께 오시는 인원을 선택해주세요.',
          options: ['1인', '2인', '3인', '4인 이상'],
          required: false,
          condition: {
            questionId: '1',
            value: '참석함',
            operator: 'equals',
          },
        },
        {
          id: '4',
          type: 'short_text',
          title: '식사 제한 사항이 있다면 알려주세요.',
          required: false,
          condition: {
            questionId: '1',
            value: '참석함',
            operator: 'equals',
          },
        },
      ],
    },
    {
      name: '직원 만족도 조사',
      description: '직원들의 업무 만족도와 의견을 수집하는 템플릿입니다.',
      category: 'employee_satisfaction',
      questions: [
        {
          id: '1',
          type: 'rating',
          title: '전반적인 업무 환경에 만족하시나요?',
          required: true,
        },
        {
          id: '2',
          type: 'rating',
          title: '연봉 및 복리후생에 만족하시나요?',
          required: true,
        },
        {
          id: '3',
          type: 'rating',
          title: '업무와 삶의 균형(WLB)에 만족하시나요?',
          required: true,
        },
        {
          id: '4',
          type: 'rating',
          title: '경영진의 리더십에 만족하시나요?',
          required: true,
        },
        {
          id: '5',
          type: 'multiple',
          title: '현재 회사에서 가장 개선이 필요하다고 생각하는 부분을 모두 선택해주세요.',
          options: ['커뮤니케이션', '업무 프로세스', '복리후생', '경력 개발 기회', '워라밸', '급여'],
          required: false,
        },
        {
          id: '6',
          type: 'long_text',
          title: '회사 개선을 위한 제안이 있다면 자유롭게 작성해주세요.',
          required: false,
        },
      ],
    },
    {
      name: '제품 피드백 조사',
      description: '제품 사용 경험과 피드백을 수집하는 템플릿입니다.',
      category: 'product_feedback',
      questions: [
        {
          id: '1',
          type: 'single',
          title: '이 제품을 얼마나 자주 사용하시나요?',
          options: ['매일', '주 1-2회', '월 1-2회', '드물게'],
          required: true,
        },
        {
          id: '2',
          type: 'rating',
          title: '제품의 전반적인 품질에 만족하시나요?',
          required: true,
        },
        {
          id: '3',
          type: 'multiple',
          title: '가장 마음에 드는 기능을 모두 선택해주세요.',
          options: ['사용 편의성', '디자인', '성능', '가격', '고객 지원', '내구성'],
          required: false,
        },
        {
          id: '4',
          type: 'single',
          title: '이 제품을 타인에게 추천하시겠습니까?',
          options: ['확실히 추천함', '추천함', '보통', '추천하지 않음', '추천하지 않을 것임'],
          required: true,
        },
        {
          id: '5',
          type: 'short_text',
          title: '가장 개선하고 싶은 기능이 있다면 알려주세요.',
          required: false,
        },
      ],
    },
    {
      name: '강의 평가 설문',
      description: '수업이나 강의에 대한 학생 만족도를 조사하는 템플릿입니다.',
      category: 'course_evaluation',
      questions: [
        {
          id: '1',
          type: 'rating',
          title: '강의 내용에 만족하시나요?',
          required: true,
        },
        {
          id: '2',
          type: 'rating',
          title: '강사의 설명 방식에 만족하시나요?',
          required: true,
        },
        {
          id: '3',
          type: 'rating',
          title: '강의 자료와 교재의 질에 만족하시나요?',
          required: true,
        },
        {
          id: '4',
          type: 'rating',
          title: '강의 난이도는 적절했나요?',
          required: true,
        },
        {
          id: '5',
          type: 'multiple',
          title: '강의에서 가장 도움이 되었던 부분을 모두 선택해주세요.',
          options: ['이론 설명', '실습 예제', 'Q&A 시간', '과제', '추가 자료'],
          required: false,
        },
        {
          id: '6',
          type: 'long_text',
          title: '강의 개선을 위한 의견이 있다면 자유롭게 작성해주세요.',
          required: false,
        },
      ],
    },
    {
      name: '웨딩 참석 여부 확인',
      description: '웨딩 초대 장소에 대한 참석 의사를 확인하는 템플릿입니다.',
      category: 'wedding_rsvp',
      questions: [
        {
          id: '1',
          type: 'single',
          title: '웨딩에 참석하시겠습니까?',
          options: ['참석합니다', '불참입니다'],
          required: true,
        },
        {
          id: '2',
          type: 'short_text',
          title: '성함을 입력해주세요.',
          required: true,
        },
        {
          id: '3',
          type: 'short_text',
          title: '연락처를 입력해주세요.',
          required: true,
        },
        {
          id: '4',
          type: 'multiple',
          title: '참석하시는 분의 인원을 선택해주세요.',
          options: ['1인', '2인', '3인', '4인 이상'],
          required: true,
          condition: {
            questionId: '1',
            value: '참석합니다',
            operator: 'equals',
          },
        },
        {
          id: '5',
          type: 'multiple',
          title: '식사 제한 사항이 있다면 선택해주세요.',
          options: ['없음', '채식', '무글루텐', '견과류 알레르기', '해산물 알레르기', '기타'],
          required: false,
          condition: {
            questionId: '1',
            value: '참석합니다',
            operator: 'equals',
          },
        },
        {
          id: '6',
          type: 'long_text',
          title: '신랑 & 신부에게 전하고 싶은 축하 메시지를 적어주세요.',
          required: false,
          condition: {
            questionId: '1',
            value: '참석합니다',
            operator: 'equals',
          },
        },
      ],
    },
  ];

  const insert = db.prepare(`
    INSERT INTO templates (user_id, name, description, category, questions, is_preset)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  templates.forEach(template => {
    insert.run(null, template.name, template.description, template.category, JSON.stringify(template.questions));
  });

  console.log('Preset templates seeded successfully');
}

// Run seed function
seedTemplates();
