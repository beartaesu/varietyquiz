# 🚀 여기서 시작하세요!

## 현재 상황
- ✅ Git 설치됨
- ❌ Node.js 미설치
- ✅ 프로젝트 파일 준비 완료
- ❌ 데이터베이스 미설정

---

## 🎯 배포 방법 선택

### 추천 순서

#### 1️⃣ Railway (가장 쉽고 빠름!) ⭐⭐⭐⭐⭐
**장점**: 데이터베이스 포함, GitHub 연동만으로 완료
**시간**: 5분
**비용**: 무료 시작 (월 $5 크레딧)

👉 **[Railway 배포 가이드](./scripts/deploy-railway.md)**

```bash
# 1. GitHub에 코드 푸시
git init
git add .
git commit -m "Deploy to Railway"
git remote add origin https://github.com/YOUR_USERNAME/varietyquiz.git
git push -u origin main

# 2. Railway 웹사이트에서 클릭 몇 번으로 완료!
# https://railway.app
```

---

#### 2️⃣ Render (완전 무료!) ⭐⭐⭐⭐
**장점**: 무료, 데이터베이스 포함
**단점**: 15분 비활성 후 슬립 (첫 접속 느림)
**시간**: 10분

👉 **[Render 배포 가이드](./scripts/deploy-render.md)**

---

#### 3️⃣ Vercel (프론트엔드 최적화) ⭐⭐⭐
**장점**: 가장 빠른 속도, 무료
**단점**: 데이터베이스 별도 필요
**시간**: 10분

👉 **[Vercel 배포 가이드](./scripts/deploy-vercel.md)**

---

## 📋 빠른 시작 (Railway 추천)

### 1단계: GitHub 저장소 생성
1. https://github.com/new 접속
2. Repository name: `varietyquiz`
3. Public 선택
4. **Create repository** 클릭

### 2단계: 코드 푸시
```bash
# 프로젝트 폴더에서 실행
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/varietyquiz.git
git branch -M main
git push -u origin main
```

### 3단계: Railway 배포
1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. **New Project** 클릭
4. **Deploy from GitHub repo** 선택
5. `varietyquiz` 저장소 선택
6. **Deploy Now** 클릭
7. **New** > **Database** > **PostgreSQL** 추가

### 완료! 🎉
5분 후 URL 생성: `https://varietyquiz.up.railway.app`

---

## 🔧 로컬 테스트 (선택사항)

배포 전에 로컬에서 테스트하고 싶다면:

### 1단계: Node.js 설치
https://nodejs.org/en 에서 LTS 버전 다운로드

### 2단계: 의존성 설치
```bash
npm install
```

### 3단계: 데이터베이스 설정
https://neon.tech 에서 무료 PostgreSQL 생성

### 4단계: 환경 변수 설정
`.env` 파일 수정:
```env
DATABASE_URL=your_neon_connection_string
```

### 5단계: 실행
```bash
npm run db:push  # 데이터베이스 초기화
npm run dev      # 개발 서버 실행
```

---

## 📚 상세 문서

### 배포 관련
- **[DEPLOYMENT_GUIDE_KR.md](./DEPLOYMENT_GUIDE_KR.md)** - 모든 배포 방법 상세 가이드
- **[scripts/deploy-railway.md](./scripts/deploy-railway.md)** - Railway 배포
- **[scripts/deploy-render.md](./scripts/deploy-render.md)** - Render 배포
- **[scripts/deploy-vercel.md](./scripts/deploy-vercel.md)** - Vercel 배포

### 개발 관련
- **[QUICKSTART.md](./QUICKSTART.md)** - 로컬 개발 환경 설정
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 프로젝트 구조
- **[CHECKLIST.md](./CHECKLIST.md)** - 배포 전 체크리스트

---

## 🆘 도움이 필요하신가요?

### 자주 묻는 질문

**Q: Node.js를 설치해야 하나요?**
A: 로컬 테스트를 원하면 필요하지만, Railway/Render/Vercel로 바로 배포하면 불필요합니다.

**Q: 데이터베이스는 어디서 만드나요?**
A: Railway는 자동 생성, Render는 무료 제공, Vercel은 Neon(무료) 사용

**Q: 비용이 얼마나 드나요?**
A: Railway는 월 $5 크레딧 무료, Render는 완전 무료, Vercel도 무료

**Q: 가장 쉬운 방법은?**
A: **Railway**가 가장 쉽습니다. GitHub 연동만으로 5분 안에 완료!

---

## 🎯 지금 바로 시작하기

### 추천 경로
1. **GitHub 저장소 생성** (2분)
2. **코드 푸시** (1분)
3. **Railway 배포** (2분)
4. **완료!** 🎉

👉 **[Railway 배포 시작하기](./scripts/deploy-railway.md)**

---

**준비되셨나요?** 어떤 방법을 선택하시든 제가 도와드리겠습니다! 🚀
