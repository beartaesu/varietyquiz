# Railway 배포 스크립트

## 자동 배포 (GitHub 연동)

### 1단계: GitHub 저장소 생성 및 푸시

```bash
# Git 초기화
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit for Railway deployment"

# GitHub에서 새 저장소 생성 후 (https://github.com/new)
# 저장소 URL을 아래에 입력
git remote add origin https://github.com/YOUR_USERNAME/varietyquiz.git

# 메인 브랜치로 변경
git branch -M main

# 푸시
git push -u origin main
```

### 2단계: Railway 배포

1. **Railway 접속**: https://railway.app
2. **로그인**: GitHub 계정으로 로그인
3. **New Project** 클릭
4. **Deploy from GitHub repo** 선택
5. **varietyquiz** 저장소 선택
6. **Deploy Now** 클릭

### 3단계: PostgreSQL 추가

1. 프로젝트 대시보드에서 **New** 클릭
2. **Database** > **Add PostgreSQL** 선택
3. 자동으로 `DATABASE_URL` 환경 변수 생성됨

### 4단계: 환경 변수 확인

프로젝트 > **Variables** 탭에서 확인:
- `DATABASE_URL` - 자동 생성됨 ✅
- `NODE_ENV=production` - 자동 설정됨 ✅
- `PORT` - 자동 설정됨 ✅

### 5단계: 배포 확인

- **Deployments** 탭에서 빌드 로그 확인
- 성공하면 URL 생성: `https://varietyquiz.up.railway.app`
- URL 클릭하여 앱 확인

## 완료! 🎉

이제 GitHub에 푸시할 때마다 자동으로 배포됩니다.

## 추가 설정 (선택사항)

### 커스텀 도메인 연결
1. Railway 프로젝트 > **Settings** > **Domains**
2. **Custom Domain** 추가
3. DNS 설정 (CNAME 레코드)

### 환경 변수 추가
```
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

## 문제 해결

### 빌드 실패
- **Logs** 탭에서 오류 확인
- `package.json`의 빌드 스크립트 확인

### 데이터베이스 연결 실패
- PostgreSQL 서비스가 실행 중인지 확인
- `DATABASE_URL` 환경 변수 확인

### 재배포
- GitHub에 푸시하면 자동 재배포
- 또는 Railway 대시보드에서 **Redeploy** 클릭
