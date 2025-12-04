# Vercel 배포 스크립트

## 준비: 데이터베이스 설정

### Neon Database 생성
1. https://neon.tech 접속
2. **Sign Up** (GitHub 계정 사용)
3. **Create a project** 클릭
4. 프로젝트 이름: `varietyquiz`
5. **Connection String** 복사:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb
   ```

## 배포 방법 1: Vercel CLI (추천)

### 1단계: Vercel CLI 설치

```bash
npm install -g vercel
```

### 2단계: 로그인

```bash
vercel login
```

이메일 또는 GitHub 계정으로 로그인

### 3단계: 배포

```bash
# 프로젝트 디렉토리에서
vercel

# 질문에 답변:
# Set up and deploy? Y
# Which scope? (본인 계정 선택)
# Link to existing project? N
# Project name? varietyquiz
# In which directory is your code located? ./
```

### 4단계: 환경 변수 설정

```bash
# DATABASE_URL 설정
vercel env add DATABASE_URL

# 값 입력: (Neon에서 복사한 Connection String)
# 환경 선택: Production, Preview, Development 모두 선택

# NODE_ENV 설정
vercel env add NODE_ENV
# 값: production
```

### 5단계: 프로덕션 배포

```bash
vercel --prod
```

## 배포 방법 2: Vercel 웹 대시보드

### 1단계: GitHub에 코드 푸시

```bash
git init
git add .
git commit -m "Deploy to Vercel"
git remote add origin https://github.com/YOUR_USERNAME/varietyquiz.git
git branch -M main
git push -u origin main
```

### 2단계: Vercel 프로젝트 생성

1. https://vercel.com 접속
2. **Add New** > **Project** 클릭
3. GitHub 저장소 **Import**
4. 프로젝트 설정:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 3단계: 환경 변수 설정

**Environment Variables** 섹션에서:
```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb
NODE_ENV=production
```

### 4단계: Deploy 클릭

빌드 완료 후 URL 생성: `https://varietyquiz.vercel.app`

## 완료! 🎉

## 재배포

### CLI 사용
```bash
vercel --prod
```

### GitHub 푸시
```bash
git add .
git commit -m "Update"
git push
```
자동으로 재배포됨

## 커스텀 도메인 연결

1. Vercel 프로젝트 > **Settings** > **Domains**
2. 도메인 입력 (예: `varietyquiz.com`)
3. DNS 설정 (A 레코드 또는 CNAME)

## 문제 해결

### "Command not found: vercel"
```bash
npm install -g vercel
```

### 빌드 실패
- Vercel 대시보드 > **Deployments** > 로그 확인
- `vercel logs` 명령어로 로그 확인

### 환경 변수 확인
```bash
vercel env ls
```

### 환경 변수 제거
```bash
vercel env rm DATABASE_URL
```
