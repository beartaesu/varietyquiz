# 🚀 배포 가이드 - 단계별 실전 가이드

현재 상황에 맞춰 가장 쉬운 방법부터 순서대로 설명합니다.

---

## 📊 배포 방법 비교표

| 방법 | 난이도 | 시간 | 비용 | Node.js 필요 | 추천도 |
|------|--------|------|------|--------------|--------|
| **Vercel** | ⭐ 매우 쉬움 | 5분 | 무료 | ❌ | ⭐⭐⭐⭐⭐ |
| **Railway** | ⭐⭐ 쉬움 | 10분 | 무료 시작 | ❌ | ⭐⭐⭐⭐⭐ |
| **Render** | ⭐⭐ 쉬움 | 10분 | 무료 | ❌ | ⭐⭐⭐⭐ |
| **Netlify** | ⭐ 매우 쉬움 | 5분 | 무료 | ❌ | ⭐⭐⭐ |
| **로컬 테스트** | ⭐⭐⭐ 보통 | 20분 | 무료 | ✅ 필수 | ⭐⭐⭐⭐ |

---

## 🎯 추천 순서

### 1순위: Railway (가장 추천!) 🏆
- **장점**: 데이터베이스 포함, 설정 간단, 무료 시작
- **단점**: 무료 티어 제한 있음 (월 $5 크레딧)
- **적합**: 풀스택 앱, 데이터베이스 필요

### 2순위: Vercel
- **장점**: 가장 쉬움, 빠른 배포, 무료
- **단점**: 서버리스 함수 제한, DB 별도 필요
- **적합**: 프론트엔드 중심, 간단한 API

### 3순위: Render
- **장점**: 무료 티어, DB 포함, 설정 간단
- **단점**: 무료는 느림 (콜드 스타트)
- **적합**: 무료로 시작하고 싶을 때

---

## 방법 1: Railway 배포 (가장 추천!) 🚂

### 준비물
- GitHub 계정
- Railway 계정 (무료)

### 단계별 가이드

#### 1단계: GitHub에 코드 업로드

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit for deployment"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/your-username/varietyquiz.git
git branch -M main
git push -u origin main
```

#### 2단계: Railway 설정

1. **Railway 회원가입**
   - https://railway.app 접속
   - "Start a New Project" 클릭
   - GitHub 계정으로 로그인

2. **프로젝트 생성**
   - "Deploy from GitHub repo" 선택
   - `varietyquiz` 저장소 선택
   - "Deploy Now" 클릭

3. **PostgreSQL 추가**
   - 프로젝트 대시보드에서 "New" 클릭
   - "Database" > "Add PostgreSQL" 선택
   - 자동으로 `DATABASE_URL` 생성됨

4. **환경 변수 설정**
   - 프로젝트 > "Variables" 탭
   - 다음 변수 추가:
   ```
   NODE_ENV=production
   PORT=5000
   ```
   - `DATABASE_URL`은 자동으로 설정됨

5. **배포 확인**
   - "Deployments" 탭에서 빌드 로그 확인
   - 성공하면 URL 생성됨 (예: `varietyquiz.up.railway.app`)

#### 3단계: 데이터베이스 초기화

Railway 대시보드에서:
- PostgreSQL 서비스 클릭
- "Connect" 탭에서 연결 정보 확인
- 또는 자동으로 마이그레이션 실행됨

**완료!** 🎉 URL로 접속하면 앱이 실행됩니다.

---

## 방법 2: Vercel 배포 ⚡

### 준비물
- GitHub 계정
- Vercel 계정 (무료)
- 외부 데이터베이스 (Neon 또는 Supabase)

### 단계별 가이드

#### 1단계: 데이터베이스 준비

**Neon Database (추천)**
1. https://neon.tech 회원가입
2. "Create Project" 클릭
3. Connection String 복사
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb
   ```

#### 2단계: GitHub에 코드 업로드
```bash
git init
git add .
git commit -m "Deploy to Vercel"
git remote add origin https://github.com/your-username/varietyquiz.git
git push -u origin main
```

#### 3단계: Vercel 배포

1. **Vercel 회원가입**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 임포트**
   - "Add New" > "Project" 클릭
   - GitHub 저장소 선택
   - "Import" 클릭

3. **환경 변수 설정**
   - "Environment Variables" 섹션에서:
   ```
   DATABASE_URL=your_neon_connection_string
   NODE_ENV=production
   ```

4. **배포 설정**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy 클릭**

**완료!** 🎉 Vercel이 자동으로 URL 생성 (예: `varietyquiz.vercel.app`)

---

## 방법 3: Render 배포 🎨

### 준비물
- GitHub 계정
- Render 계정 (무료)

### 단계별 가이드

#### 1단계: GitHub에 코드 업로드
```bash
git init
git add .
git commit -m "Deploy to Render"
git remote add origin https://github.com/your-username/varietyquiz.git
git push -u origin main
```

#### 2단계: Render 설정

1. **Render 회원가입**
   - https://render.com 접속
   - GitHub 계정으로 로그인

2. **PostgreSQL 생성**
   - Dashboard > "New" > "PostgreSQL"
   - Name: `varietyquiz-db`
   - Free 플랜 선택
   - "Create Database" 클릭
   - Internal Database URL 복사

3. **Web Service 생성**
   - Dashboard > "New" > "Web Service"
   - GitHub 저장소 연결
   - 설정:
     - Name: `varietyquiz`
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Plan: `Free`

4. **환경 변수 설정**
   - "Environment" 탭에서:
   ```
   DATABASE_URL=your_render_postgres_url
   NODE_ENV=production
   PORT=10000
   ```

5. **Create Web Service 클릭**

**완료!** 🎉 Render가 자동으로 URL 생성 (예: `varietyquiz.onrender.com`)

**주의**: 무료 플랜은 15분 비활성 후 슬립 모드 (첫 접속 시 느림)

---

## 방법 4: Netlify 배포 (프론트엔드만) 🌐

### 준비물
- GitHub 계정
- Netlify 계정 (무료)
- 외부 API 서버 (Railway 또는 Render)

### 단계별 가이드

#### 1단계: 백엔드 먼저 배포
- Railway 또는 Render로 백엔드 배포
- API URL 확인 (예: `https://api.varietyquiz.com`)

#### 2단계: 프론트엔드 설정 수정
```typescript
// client/src/lib/queryClient.ts 수정
const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.com';
```

#### 3단계: GitHub에 코드 업로드
```bash
git add .
git commit -m "Deploy to Netlify"
git push
```

#### 4단계: Netlify 배포

1. https://netlify.com 접속
2. "Add new site" > "Import an existing project"
3. GitHub 저장소 선택
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `dist/public`
5. 환경 변수:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```
6. "Deploy site" 클릭

**완료!** 🎉

---

## 방법 5: 로컬 테스트 (배포 전 필수!) 💻

### 준비물
- Node.js 18 이상

### 단계별 가이드

#### 1단계: Node.js 설치

**Windows:**
1. https://nodejs.org/en 접속
2. "LTS" 버전 다운로드 (예: 20.11.0)
3. 설치 프로그램 실행
4. 모든 옵션 기본값으로 설치
5. 터미널 재시작 후 확인:
```bash
node --version
npm --version
```

#### 2단계: 의존성 설치
```bash
cd C:\varietyquiz
npm install
```

#### 3단계: 데이터베이스 설정

**옵션 A: Neon (추천)**
1. https://neon.tech 회원가입
2. 프로젝트 생성
3. Connection String 복사
4. `.env` 파일 수정:
```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb
```

**옵션 B: 로컬 PostgreSQL**
```bash
# Docker 사용
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# .env 파일
DATABASE_URL=postgresql://postgres:password@localhost:5432/varietyquiz
```

#### 4단계: 데이터베이스 초기화
```bash
npm run db:push
```

#### 5단계: 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:5000 접속

**완료!** 🎉

---

## 🎯 상황별 추천

### 상황 1: 빠르게 배포하고 싶다
→ **Railway** (데이터베이스 포함, 5분 완료)

### 상황 2: 완전 무료로 시작하고 싶다
→ **Render** (무료 티어, 느리지만 무료)

### 상황 3: 프론트엔드만 배포하고 싶다
→ **Vercel** 또는 **Netlify** (백엔드는 별도)

### 상황 4: 로컬에서 먼저 테스트하고 싶다
→ **로컬 개발 환경** (Node.js 설치 필요)

### 상황 5: 최고의 성능이 필요하다
→ **Railway** 또는 **Render Paid Plan**

---

## 📋 배포 전 체크리스트

### 필수
- [ ] GitHub 저장소 생성
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 데이터베이스 준비 (Neon, Supabase, 또는 Railway)
- [ ] 이미지 파일 추가 (`attached_assets/generated_images/`)

### 선택
- [ ] 도메인 연결 (나중에 가능)
- [ ] Naver API 키 설정
- [ ] Google Cloud Storage 설정

---

## 🆘 문제 해결

### "npm: command not found"
→ Node.js 설치 필요: https://nodejs.org

### "Database connection failed"
→ `.env`의 `DATABASE_URL` 확인

### "Build failed"
→ `node_modules` 삭제 후 재설치:
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port already in use"
→ `.env`에서 포트 변경:
```env
PORT=3000
```

---

## 🎉 다음 단계

배포 후:
1. 도메인 연결 (선택)
2. SSL 인증서 자동 적용됨
3. 환경 변수 추가 설정
4. 모니터링 설정

---

## 💡 팁

### Railway 무료 크레딧
- 월 $5 크레딧 제공
- 소규모 프로젝트는 충분

### Vercel 무료 제한
- 서버리스 함수 실행 시간 제한
- 대역폭 제한 있음

### Render 무료 제한
- 15분 비활성 후 슬립
- 첫 접속 시 30초 대기

---

**어떤 방법을 선택하시겠어요?** 선택하시면 그 방법으로 함께 배포해드리겠습니다! 🚀
