# 변경 이력

## [1.0.0] - 2024-12-02

### 추가
- Replit 독립 배포 설정
- 환경 변수 설정 파일 (.env.example)
- 배포 가이드 문서 (DEPLOYMENT.md)
- 빠른 시작 가이드 (QUICKSTART.md)
- 배포 전 체크리스트 (CHECKLIST.md)
- Docker 지원 (Dockerfile, .dockerignore)
- CI/CD 워크플로우 (GitHub Actions)
- 다양한 플랫폼 배포 설정
  - Vercel (vercel.json)
  - Railway (railway.json)
  - Render (render.yaml)

### 변경
- Replit 플러그인 의존성 제거
- vite.config.ts 간소화
- README.md 업데이트

### 수정
- .gitignore 파일 추가
- 이미지 에셋 폴더 구조 정리

## [0.9.0] - Replit 버전

### 기능
- K-연예인 퀴즈 게임
- 배드민턴 팀 자동 매칭
- 대진표 작성 기능
- PostgreSQL 데이터베이스 연동
- Google Cloud Storage 이미지 저장
- Naver API 이미지 검색
