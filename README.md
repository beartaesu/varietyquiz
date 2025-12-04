# K-연예인 퀴즈 & 배드민턴 팀 매칭

한국 연예인 퀴즈 게임과 배드민턴 팀 자동 매칭 서비스를 제공하는 웹 애플리케이션입니다.

## 주요 기능

### 🎮 연예인 퀴즈
- 연예인 사진을 보고 이름 맞히기
- 5초 타이머 제한
- 본명/예명 모두 인정, 오타 허용 (75% 유사도)
- 카테고리별 분류 (가수, 배우, 방송인)
- 상세한 피드백 및 학습 가이드

### 🏸 배드민턴 팀 매칭
- 참가자 등록 (개별/리스트 입력)
- 성별, 실력 레벨 설정 (A~E, 입문)
- 지능형 팀 구성 알고리즘
  - 실력 균형 매칭
  - 혼복/남복/여복 선택
  - 매칭 히스토리 고려
  - 공정한 순환 시스템
- 게임 기록 관리
- 카카오톡 공유 기능

## 기술 스택

**Frontend**
- React 18 + TypeScript
- Vite
- TanStack Query
- Tailwind CSS + shadcn/ui
- Wouter (라우팅)

**Backend**
- Node.js + Express
- PostgreSQL (Neon Database)
- Drizzle ORM
- Google Cloud Storage

## 빠른 시작

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 필요한 값을 입력하세요:

```bash
cp .env.example .env
```

필수 환경 변수:
- `DATABASE_URL`: PostgreSQL 연결 URL

### 3. 데이터베이스 마이그레이션

```bash
npm run db:push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5000` 접속

## 배포

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

### 추천 배포 플랫폼
- **Vercel**: 프론트엔드 + 서버리스
- **Railway**: 풀스택 + 데이터베이스
- **Render**: 무료 티어 제공

## 스크립트

```bash
# 개발 모드
npm run dev

# 타입 체크
npm run check

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# 데이터베이스 마이그레이션
npm run db:push
```

## 프로젝트 구조

```
varietyquiz/
├── client/           # React 프론트엔드
│   ├── src/
│   │   ├── components/  # UI 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   ├── hooks/       # 커스텀 훅
│   │   ├── data/        # 정적 데이터
│   │   └── utils/       # 유틸리티 함수
│   └── index.html
├── server/           # Express 백엔드
│   ├── index.ts      # 서버 진입점
│   ├── routes.ts     # API 라우트
│   └── storage.ts    # 데이터베이스 로직
├── shared/           # 공유 타입 및 스키마
│   ├── schema.ts
│   └── quiz-schema.ts
└── package.json
```

## 라이선스

MIT

## 기여

이슈와 PR은 언제나 환영합니다!
