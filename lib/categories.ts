export const CATEGORIES = {
  customer_satisfaction: '고객 만족도',
  event_attendance: '이벤트 참석',
  employee_satisfaction: '직원 만족도',
  product_feedback: '제품 피드백',
  course_evaluation: '강의 평가',
  research: '연구 조사',
  hr: '인사/채용',
  marketing: '마케팅',
  other: '기타'
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export function getCategoryLabel(category: string): string {
  return CATEGORIES[category as CategoryKey] || category;
}

export function getAllCategories(): Array<{ key: string; label: string }> {
  return Object.entries(CATEGORIES).map(([key, label]) => ({ key, label }));
}
