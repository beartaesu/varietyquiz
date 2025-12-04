# 빠른 시작 가이드 🚀

이 가이드는 5분 안에 프로젝트를 로컬에서 실행하는 방법을 설명합니다.

## 1단계: 프로젝트 클론 및 설치

```bash
# 프로젝트 클론 (또는 이미 다운로드한 경우 생략)
git clone <your-repo-url>
cd varietyquiz

# 의존성 설치
npm install
```

## 2단계: 환경 변수 설정

```bash
# .env 파일이 이미 있으면 수정, 없으면 생성
# 최소한 DATABASE_URL만 설정하면 됩니다
```

`.env` 파일 내용:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/varietyquiz
PORT=5000
NODE_ENV=development
```

### 데이터베이스 옵션

#### 옵션 A: 무료 클라우드 DB (추천 - 가장 쉬움)

**Neon Database (무료)**
1. https://neon.tech 회원가입
2. 새 프로젝트 생성
3. Connection String 복사
4. `.env`에 붙여넣기

```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Supabase (무료)**
1. https://supabase.com 회원가입
2. 새 프로젝트 생성
3. Settings > Database > Connection String (URI) 복사
4. `.env`에 붙여넣기

#### 옵션 B: 로컬 PostgreSQL

```bash
# PostgreSQL 설치 (Windows)
# https://www.postgresql.org/download/windows/
# 설치 후 pgAdmin으로 데이터베이스 생성

# 또는 Docker 사용
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# .env 설정
DATABASE_URL=postgresql://postgres:password@localhost:5432/varietyquiz
```

## 3단계: 데이터베이스 초기화

```bash
npm run db:push
```

성공 메시지가 나오면 완료!

## 4단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5000 접속

## 문제 해결

### "DATABASE_URL is not defined" 오류
- `.env` 파일이 프로젝트 루트에 있는지 확인
- `DATABASE_URL` 값이 올바른지 확인

### "Cannot connect to database" 오류
- 데이터베이스가 실행 중인지 확인
- 연결 URL이 올바른지 확인
- 방화벽 설정 확인

### "Port 5000 is already in use" 오류
```bash
# .env 파일에서 포트 변경
PORT=3000
```

### Replit 플러그인 오류
```bash
# package.json에서 Replit 의존성 제거 후 재설치
npm install
```

## 다음 단계

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 가이드
- [README.md](./README.md) - 프로젝트 개요
- 이미지 추가: `attached_assets/generated_images/` 폴더에 이미지 파일 추가

## 도움이 필요하신가요?

GitHub Issues에 질문을 남겨주세요!
