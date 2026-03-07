# FormFlow 🚀

<formflow_logo>

<formflow_description>

## ✨ 주요 기능

### 📋 설문조사 관리

- 다양한 질문 타입 지원 (단답, 장문, 단일 선택, 복수 선택, 척도, 날짜, 파일, 이미지 선택, 슬라이더, 순위 매기기)
- 질문 조건부 표시 (로직 기능)
- 질문 순서 변경 및 관리
- 실시간 미리보기
- 임시 저장 및 자동 저장 기능

### 👥 협업 기능

- 소유자, 편집자, 뷰어 권한 관리
- 협업자 초대 및 권한 변경
- 변경 이력 추적
- 실시간 공동 작업

### 🎨 브랜딩 커스터마이징

- **로고 이미지**: 설문조사 상단에 로고 표시 (권장: 200px x 60px, PNG 투명 배경)
- **커스텀 색상 테마**:
  - 기본 색상 (Primary): 주요 버튼, 강조 요소
  - 보조 색상 (Secondary): 보조 버튼, 추가 요소
  - 배경 색상 (Background): 전체 배경
  - 텍스트 색상 (Text): 기본 텍스트
- **배경 이미지**: 배경 이미지 업로드 및 위치/크기 조정
- **완료 페이지 커스터마이징**:
  - 커스텀 완료 메시지
  - 완료 페이지 이미지
  - 버튼 텍스트 및 URL 설정

### 📧 공유 및 알림

- 링크 공유
- 이메일 초대장 발송
- 리마인더 발송 기능
- 응답 알림 설정
- 마감일 알림
- 목표 달성 알림

### 📊 응답 분석

- 실시간 응답 통계
- 지리적 통계 (국가, 도시)
- 응답 시간 분석
- CSV 데이터 내보내기
- 차트 및 그래프 시각화

### 🏷️ 카테고리 및 태그

- 설문조사 카테고리 분류
- 태그 필터링
- 검색 기능

## 🛠️ 설치 및 설정

### 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn 또는 pnpm

### 설치步骤

1. **리포지토리 클론**

```bash
git clone https://github.com/NJ0428/FormFlow.git
cd FormFlow
```

2. **의존성 설치**

```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

3. **환경 변수 설정**
   `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

````env
# 데이터베이스 (SQLite - 기본 설정)
DATABASE_URL=./formflow.db


4. **개발 서버 시작**

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
````

5. **브라우저에서 접속**

```
http://localhost:3000
```

## 📖 사용 방법

### 1. 계정 생성

- 회원가입 페이지에서 계정을 생성합니다
- 이메일 인증 후 로그인합니다

### 2. 설문조사 생성

1. "새 설문조사 만들기" 클릭
2. 템플릿을 선택하거나 처음부터 시작
3. 질문을 추가하고 설정을 구성
4. 브랜딩 설정으로 디자인 커스터마이징
5. 저장 및 게시

### 3. 브랜딩 설정 사용법

1. 설문조사 편집 페이지에서 "브랜딩" 버튼 클릭
2. 각 탭에서 설정을 구성:

#### 색상 탭

- 기본 색상: 주요 버튼, 진행률 바 등
- 보조 색상: 보조 버튼, 추가 요소
- 배경 색상: 전체 배경 색상
- 텍스트 색상: 기본 텍스트 색상

#### 로고 탭

- 로고 이미지 업로드 (최대 5MB)
- 지원 형식: PNG, JPEG, GIF, WebP
- 권장: 200px x 60px, 투명 배경 PNG

#### 배경 탭

- 배경 이미지 업로드
- 이미지 위치 선택 (중앙, 상단, 하단, 좌측, 우측)
- 이미지 크기 선택 (덮기, 맞춤, 원본 크기)

#### 완료 페이지 탭

- 완료 메시지 작성
- 완료 이미지 업로드 (선택)
- 버튼 텍스트 및 URL 설정

### 4. 공유 및 응답 수집

- 링크 공유 또는 이메일 발송
- 응답 현황 실시간 확인
- 리마인더 발송

### 5. 결과 분석

- 응답 통계 확인
- 차트 및 그래프로 시각화
- CSV로 데이터 내보내기

## 🎯 API 문서

### 인증

대부분의 API endpoint는 인증이 필요합니다:

```bash
curl -H "Cookie: auth-token=your-token" http://localhost:3000/api/forms
```

### 주요 API

#### 폼 관리

```bash
# 폼 목록 조회
GET /api/forms

# 폼 상세 조회
GET /api/forms/{id}

# 폼 생성
POST /api/forms
Body: { title, description, questions, ... }

# 폼 수정
PUT /api/forms/{id}

# 폼 삭제
DELETE /api/forms/{id}
```

#### 브랜딩 설정

```bash
# 브랜딩 설정 조회
GET /api/forms/{id}/branding

# 브랜딩 설정 업데이트
PUT /api/forms/{id}/branding
Body: { primary_color, logo_url, completion_message, ... }

# 이미지 업로드
POST /api/forms/{id}/branding/image
Content-Type: multipart/form-data
Body: file, type (logo/background/completion)

# 이미지 삭제
DELETE /api/forms/{id}/branding/image?type=logo
```

#### 응답 제출

```bash
# 응답 제출
POST /api/forms/{id}/submit
Body: { answers, location }
```

## 🏗️ 프로젝트 구조

```
FormFlow/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── forms/
│   │   │   ├── [id]/
│   │   │   │   ├── branding/
│   │   │   │   │   ├── image/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── collaborators/
│   │   │   │   ├── invitations/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── responses/
│   │   └── templates/
│   ├── login/
│   ├── register/
│   ├── survey/
│   │   ├── [id]/
│   │   │   ├── complete/
│   │   │   └── page.tsx
│   │   └── create/
│   └── layout.tsx
├── components/
│   ├── BrandingSettingsModal.tsx
│   ├── ColorPicker.tsx
│   ├── ImageUpload.tsx
│   ├── ShareModal.tsx
│   └── ...
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── permissions.ts
│   └── ThemeContext.tsx
└── public/
    └── uploads/
        └── branding/
```

## 🤝 기여 방법

기여를 환영합니다! 다음 단계를 따라주세요:

1. 리포지토리를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 엽니다

### 개발 가이드라인

- ESLint 규칙을 따르세요
- 커밋 메시지는 명확하게 작성하세요
- 테스트 코드를 작성하세요 (가능한 경우)
- 기존 코드 스타일을 따르세요

## 🐛 버그 신고 및 기능 요청

버그를 발견하거나 새로운 기능을 요청하려면:

1. [Issues](https://github.com/NJ0428/FormFlow/issues) 페이지로 이동
2. "New Issue" 클릭
3. 제목과 상세 내용 작성
4. 라벨 선택 (bug / enhancement)
5. 제출

## 🙏 감사의 말씀

다음 오픈소스 프로젝트와 라이브러리에 감사드립니다:

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
