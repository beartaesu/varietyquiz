# 배포 가이드

이 문서는 K-연예인 퀴즈 애플리케이션을 Replit 없이 독립적으로 배포하는 방법을 설명합니다.

## 목차
1. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
2. [환경 변수 설정](#환경-변수-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [배포 옵션](#배포-옵션)

---

## 로컬 개발 환경 설정

### 1. 필수 요구사항
- Node.js 18 이상
- npm 또는 yarn
- PostgreSQL 데이터베이스

### 2. 프로젝트 설치

```bash
# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env
```

### 3. 환경 변수 설정

`.env` 파일을 열어 다음 값들을 설정하세요:

```env
# 필수: PostgreSQL 데이터베이스 URL
DATABASE_URL=postgresql://user:password@localhost:5432/varietyquiz

# 선택: Naver 이미지 검색 API (없어도 작동)
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret

# 선택: Google Cloud Storage (없어도 작동)
GCS_PROJECT_ID=your_project_id
GCS_BUCKET_NAME=your_bucket_name
GCS_KEY_FILE=./service-account-key.json

# 서버 포트
PORT=5000
NODE_ENV=development
```

### 4. 데이터베이스 마이그레이션

```bash
# 데이터베이스 스키마 생성
npm run db:push
```

### 5. 개발 서버 실행

```bash
# 개발 모드 실행
npm run dev
```

브라우저에서 `http://localhost:5000` 접속

---

## 환경 변수 설정

### 필수 환경 변수

#### DATABASE_URL
PostgreSQL 데이터베이스 연결 URL입니다.

**로컬 개발:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/varietyquiz
```

**클라우드 데이터베이스 (Neon, Supabase 등):**
```
DATABASE_URL=postgresql://user:password@host.region.provider.com:5432/database?sslmode=require
```

### 선택 환경 변수

#### Naver API (이미지 검색)
Naver Developers에서 발급받을 수 있습니다.
- https://developers.naver.com/apps/#/register

```
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

#### Google Cloud Storage (이미지 저장)
Google Cloud Console에서 설정할 수 있습니다.
- https://console.cloud.google.com/

```
GCS_PROJECT_ID=your_project_id
GCS_BUCKET_NAME=your_bucket_name
GCS_KEY_FILE=./service-account-key.json
```

---

## 데이터베이스 설정

### 옵션 1: 로컬 PostgreSQL

```bash
# PostgreSQL 설치 (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# PostgreSQL 시작
sudo service postgresql start

# 데이터베이스 생성
sudo -u postgres createdb varietyquiz

# 사용자 생성 및 권한 부여
sudo -u postgres psql
CREATE USER varietyuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE varietyquiz TO varietyuser;
\q
```

### 옵션 2: 클라우드 데이터베이스 (추천)

#### Neon (무료 티어 제공)
1. https://neon.tech 회원가입
2. 새 프로젝트 생성
3. Connection String 복사
4. `.env` 파일에 `DATABASE_URL` 설정

#### Supabase (무료 티어 제공)
1. https://supabase.com 회원가입
2. 새 프로젝트 생성
3. Settings > Database > Connection String 복사
4. `.env` 파일에 `DATABASE_URL` 설정

---

## 배포 옵션

### 옵션 1: Vercel (추천 - 가장 쉬움)

#### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

#### 2. 프로젝트 배포
```bash
# 빌드
npm run build

# Vercel 로그인
vercel login

# 배포
vercel --prod
```

#### 3. 환경 변수 설정
Vercel 대시보드에서:
- Settings > Environment Variables
- `.env` 파일의 모든 변수 추가

#### 4. 빌드 설정
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

---

### 옵션 2: Railway (추천 - 백엔드 포함)

#### 1. Railway 회원가입
https://railway.app

#### 2. GitHub 연동
- GitHub 저장소 연결
- 자동 배포 설정

#### 3. 환경 변수 설정
Railway 대시보드에서:
- Variables 탭
- `.env` 파일의 모든 변수 추가

#### 4. PostgreSQL 추가
- New > Database > PostgreSQL
- 자동으로 `DATABASE_URL` 생성됨

---

### 옵션 3: Render (무료 티어 제공)

#### 1. Render 회원가입
https://render.com

#### 2. 새 Web Service 생성
- GitHub 저장소 연결
- Build Command: `npm run build`
- Start Command: `npm start`

#### 3. 환경 변수 설정
- Environment 탭에서 변수 추가

#### 4. PostgreSQL 추가
- New > PostgreSQL
- Internal Database URL 복사하여 `DATABASE_URL`에 설정

---

### 옵션 4: 직접 서버 (VPS)

#### 1. 서버 준비 (Ubuntu 예시)
```bash
# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 설치
sudo apt-get install postgresql postgresql-contrib

# Nginx 설치 (리버스 프록시)
sudo apt-get install nginx
```

#### 2. 프로젝트 배포
```bash
# 프로젝트 클론
git clone <your-repo-url>
cd varietyquiz

# 의존성 설치
npm install

# 빌드
npm run build

# PM2로 프로세스 관리
npm install -g pm2
pm2 start npm --name "varietyquiz" -- start
pm2 save
pm2 startup
```

#### 3. Nginx 설정
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. SSL 인증서 (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 빌드 및 실행 명령어

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

---

## 문제 해결

### 데이터베이스 연결 오류
- `DATABASE_URL`이 올바른지 확인
- 데이터베이스가 실행 중인지 확인
- 방화벽 설정 확인

### 빌드 오류
- Node.js 버전 확인 (18 이상)
- `node_modules` 삭제 후 재설치: `rm -rf node_modules && npm install`

### 포트 충돌
- `.env` 파일에서 `PORT` 변경
- 또는 실행 시: `PORT=3000 npm start`

---

## 추가 리소스

- [Vite 문서](https://vitejs.dev/)
- [Express 문서](https://expressjs.com/)
- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

---

## 지원

문제가 발생하면 GitHub Issues에 등록해주세요.
