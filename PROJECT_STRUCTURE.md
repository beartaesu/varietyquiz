# 프로젝트 구조

```
varietyquiz/
├── .github/                    # GitHub 설정
│   └── workflows/              # CI/CD 워크플로우
│       ├── deploy.yml          # 배포 자동화
│       └── test.yml            # 테스트 자동화
│
├── attached_assets/            # 정적 에셋
│   ├── generated_images/       # 생성된 이미지 파일
│   └── README.md               # 에셋 가이드
│
├── client/                     # React 프론트엔드
│   ├── src/
│   │   ├── components/         # UI 컴포넌트
│   │   │   ├── ui/             # shadcn/ui 컴포넌트
│   │   │   ├── AdSense.tsx     # 광고 컴포넌트
│   │   │   └── Footer.tsx      # 푸터 컴포넌트
│   │   │
│   │   ├── data/               # 정적 데이터
│   │   │   └── celebrity-info.ts  # 연예인 정보
│   │   │
│   │   ├── hooks/              # 커스텀 훅
│   │   │   ├── use-mobile.tsx  # 모바일 감지
│   │   │   ├── use-quiz-timer.ts  # 퀴즈 타이머
│   │   │   ├── use-seo.ts      # SEO 메타데이터
│   │   │   └── use-toast.ts    # 토스트 알림
│   │   │
│   │   ├── lib/                # 유틸리티 라이브러리
│   │   │   ├── queryClient.ts  # React Query 설정
│   │   │   └── utils.ts        # 공통 유틸리티
│   │   │
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── main-home.tsx   # 메인 홈
│   │   │   ├── quiz-game.tsx   # 퀴즈 게임
│   │   │   ├── badminton-matcher.tsx  # 배드민턴 매칭
│   │   │   ├── bracket-categories.tsx # 대진표 카테고리
│   │   │   ├── category-info.tsx      # 카테고리 정보
│   │   │   ├── sitemap.tsx     # 사이트맵
│   │   │   └── not-found.tsx   # 404 페이지
│   │   │
│   │   ├── utils/              # 유틸리티 함수
│   │   ├── App.tsx             # 앱 루트 컴포넌트
│   │   ├── main.tsx            # 앱 진입점
│   │   └── index.css           # 글로벌 스타일
│   │
│   └── index.html              # HTML 템플릿
│
├── server/                     # Express 백엔드
│   ├── index.ts                # 서버 진입점
│   ├── routes.ts               # API 라우트 정의
│   ├── storage.ts              # 데이터베이스 로직
│   ├── objectStorage.ts        # Google Cloud Storage
│   ├── objectAcl.ts            # 스토리지 권한 관리
│   └── vite.ts                 # Vite 개발 서버 설정
│
├── shared/                     # 공유 타입 및 스키마
│   ├── schema.ts               # 데이터베이스 스키마
│   └── quiz-schema.ts          # 퀴즈 스키마
│
├── .env                        # 환경 변수 (Git 제외)
├── .env.example                # 환경 변수 예시
├── .gitignore                  # Git 제외 파일
├── .dockerignore               # Docker 제외 파일
│
├── components.json             # shadcn/ui 설정
├── drizzle.config.ts           # Drizzle ORM 설정
├── package.json                # 프로젝트 의존성
├── postcss.config.js           # PostCSS 설정
├── tailwind.config.ts          # Tailwind CSS 설정
├── tsconfig.json               # TypeScript 설정
├── vite.config.ts              # Vite 빌드 설정
│
├── Dockerfile                  # Docker 이미지 빌드
├── vercel.json                 # Vercel 배포 설정
├── railway.json                # Railway 배포 설정
├── render.yaml                 # Render 배포 설정
│
├── README.md                   # 프로젝트 개요
├── DEPLOYMENT.md               # 배포 가이드
├── QUICKSTART.md               # 빠른 시작 가이드
├── CHECKLIST.md                # 배포 체크리스트
├── CONTRIBUTING.md             # 기여 가이드
├── CHANGELOG.md                # 변경 이력
└── PROJECT_STRUCTURE.md        # 이 파일
```

## 주요 디렉토리 설명

### `/client`
React 기반 프론트엔드 애플리케이션입니다.
- **컴포넌트 기반 아키텍처**: 재사용 가능한 UI 컴포넌트
- **페이지 라우팅**: Wouter를 사용한 클라이언트 사이드 라우팅
- **상태 관리**: TanStack Query로 서버 상태 관리
- **스타일링**: Tailwind CSS + shadcn/ui

### `/server`
Express 기반 백엔드 API 서버입니다.
- **RESTful API**: 퀴즈 및 연예인 데이터 제공
- **데이터베이스**: PostgreSQL + Drizzle ORM
- **이미지 처리**: Google Cloud Storage 연동
- **프록시**: CORS 문제 해결을 위한 이미지 프록시

### `/shared`
프론트엔드와 백엔드가 공유하는 타입 정의입니다.
- **타입 안정성**: TypeScript 타입 공유
- **스키마 검증**: Zod를 사용한 런타임 검증
- **데이터베이스 스키마**: Drizzle ORM 스키마 정의

### `/attached_assets`
정적 에셋 파일들을 저장합니다.
- **이미지**: 배경 이미지, 아이콘 등
- **최적화**: 빌드 시 자동으로 번들링

## 빌드 프로세스

### 개발 모드
```bash
npm run dev
```
1. Vite가 클라이언트 개발 서버 시작
2. tsx가 서버 코드를 실행
3. HMR(Hot Module Replacement) 활성화

### 프로덕션 빌드
```bash
npm run build
```
1. Vite가 클라이언트 코드를 `dist/public`에 빌드
2. esbuild가 서버 코드를 `dist`에 번들링
3. 정적 에셋 복사 및 최적화

### 실행
```bash
npm start
```
- `dist/index.js` 실행
- 정적 파일은 `dist/public`에서 서빙

## 데이터 흐름

```
Client (React)
    ↓ HTTP Request
Server (Express)
    ↓ Query
Database (PostgreSQL)
    ↓ Data
Server (Express)
    ↓ JSON Response
Client (React)
```

## 주요 기술 스택

### Frontend
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구
- **TanStack Query**: 서버 상태 관리
- **Wouter**: 라우팅
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트

### Backend
- **Node.js**: 런타임
- **Express**: 웹 프레임워크
- **TypeScript**: 타입 안정성
- **Drizzle ORM**: 데이터베이스 ORM
- **PostgreSQL**: 데이터베이스
- **Google Cloud Storage**: 이미지 저장

### DevOps
- **Docker**: 컨테이너화
- **GitHub Actions**: CI/CD
- **Vercel/Railway/Render**: 배포 플랫폼

## 환경 변수

필수:
- `DATABASE_URL`: PostgreSQL 연결 URL
- `PORT`: 서버 포트 (기본값: 5000)
- `NODE_ENV`: 환경 (development/production)

선택:
- `NAVER_CLIENT_ID`: Naver API 클라이언트 ID
- `NAVER_CLIENT_SECRET`: Naver API 시크릿
- `GCS_PROJECT_ID`: Google Cloud 프로젝트 ID
- `GCS_BUCKET_NAME`: GCS 버킷 이름
- `GCS_KEY_FILE`: GCS 서비스 계정 키 파일 경로

## 추가 정보

- 모든 API 엔드포인트는 `/api` 접두사 사용
- 클라이언트 라우팅은 SPA 방식
- 이미지는 프록시를 통해 제공되어 CORS 문제 해결
- 로컬 스토리지를 사용한 배드민턴 매칭 히스토리 저장
