# 🚀 Render 배포 가이드 (완전 무료)

## 📋 개요

Render는 Express 서버를 완벽하게 지원하는 플랫폼입니다.
- ✅ 완전 무료
- ✅ PostgreSQL 포함
- ✅ GitHub 자동 배포
- ✅ Express 서버 완벽 지원

---

## 🗄️ 1단계: Neon DB 연결 정보 준비

이미 Neon DB를 만들었으니 연결 정보만 준비하세요:

```
postgresql://neondb_owner:npg_TwqeAc8I7zGL@ep-crimson-butterfly-a12xbgkd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 🌐 2단계: Render 회원가입 및 프로젝트 생성

### 2-1. Render 접속
1. **https://render.com** 접속
2. **"Get Started"** 또는 **"Sign Up"** 클릭
3. **"GitHub"** 선택
4. GitHub 계정으로 로그인

### 2-2. Web Service 생성
1. 대시보드에서 **"New +"** 버튼 클릭
2. **"Web Service"** 선택

### 2-3. GitHub 저장소 연결
1. **"Connect a repository"** 섹션에서
2. **`beartaesu/varietyquiz`** 찾기
3. **"Connect"** 클릭

---

## ⚙️ 3단계: 서비스 설정

### 3-1. 기본 정보
```
Name: varietyquiz
Region: Singapore (한국과 가장 가까움)
Branch: main
```

### 3-2. 빌드 설정
```
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 3-3. 인스턴스 타입
```
Instance Type: Free
```

---

## 🔐 4단계: 환경 변수 설정

**Environment Variables** 섹션에서 **"Add Environment Variable"** 클릭:

### 첫 번째 변수
```
Key: DATABASE_URL
Value: postgresql://neondb_owner:npg_TwqeAc8I7zGL@ep-crimson-butterfly-a12xbgkd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 두 번째 변수
```
Key: NODE_ENV
Value: production
```

### 세 번째 변수
```
Key: PORT
Value: 10000
```

---

## 🚀 5단계: 배포 시작

1. 모든 설정 확인
2. **"Create Web Service"** 버튼 클릭
3. 자동으로 빌드 시작 (3-5분 소요)

---

## ⏱️ 배포 진행 상황

### 빌드 로그 확인
- **Logs** 탭에서 실시간 확인
- 진행 단계:
  1. Installing dependencies...
  2. Building...
  3. Starting server...
  4. ✅ Live!

### 예상 시간
- 빌드: 3-5분
- 총 소요 시간: 약 5-7분

---

## 🎉 6단계: 배포 완료 확인

### URL 확인
배포 완료 후 생성되는 URL:
```
https://varietyquiz.onrender.com
```

### 기능 테스트
1. 홈페이지 접속
2. 퀴즈 게임 테스트
3. 배드민턴 매칭 테스트

---

## 🔧 문제 해결

### 빌드 실패
**증상**: Build failed

**해결**:
1. **Logs** 탭에서 오류 확인
2. Build Command 확인: `npm install && npm run build`
3. Start Command 확인: `npm start`

### 서버 시작 실패
**증상**: Deploy succeeded but service not starting

**해결**:
1. **Logs** 탭에서 런타임 로그 확인
2. PORT 환경 변수 확인 (10000)
3. DATABASE_URL 확인

### 데이터베이스 연결 실패
**증상**: 앱은 실행되지만 데이터 없음

**해결**:
1. DATABASE_URL 환경 변수 재확인
2. Neon DB가 활성 상태인지 확인
3. 연결 문자열에 `?sslmode=require` 포함 확인

---

## ⚠️ 무료 플랜 제한사항

### Render 무료 플랜
```
✅ 750시간/월 무료
✅ 512MB RAM
✅ 0.1 CPU
⚠️ 15분 비활성시 슬립 모드
⚠️ 슬립 후 첫 접속시 30초 대기
```

### 슬립 모드란?
- 15분간 접속이 없으면 서버 일시 정지
- 다음 접속시 자동으로 재시작 (30초 소요)
- 개인 프로젝트에는 문제없음

---

## 🔄 재배포 방법

### 자동 재배포 (추천)
```bash
# 코드 수정 후
git add .
git commit -m "Update feature"
git push

# Render가 자동으로 감지하고 재배포
```

### 수동 재배포
1. Render 대시보드
2. **"Manual Deploy"** > **"Deploy latest commit"**

---

## 📊 모니터링

### Render 대시보드에서 확인 가능
- **Metrics**: CPU, 메모리 사용량
- **Logs**: 실시간 서버 로그
- **Events**: 배포 히스토리

---

## 🎯 배포 완료 체크리스트

- [ ] Render 계정 생성 완료
- [ ] Web Service 생성 완료
- [ ] GitHub 저장소 연결 완료
- [ ] 빌드 설정 완료
- [ ] 환경 변수 3개 설정 완료
- [ ] 배포 성공 (Live 상태)
- [ ] URL 생성 완료
- [ ] 홈페이지 접속 가능
- [ ] 퀴즈 게임 작동 확인
- [ ] 배드민턴 매칭 작동 확인

---

## 💡 유용한 팁

### 1. 슬립 모드 방지 (선택사항)
무료 서비스를 계속 깨어있게 하려면:
- UptimeRobot 같은 모니터링 서비스 사용
- 5분마다 자동으로 접속

### 2. 로그 확인
문제 발생 시 **Logs** 탭에서:
- Build logs: 빌드 과정
- Runtime logs: 서버 실행 로그

### 3. 환경 변수 수정
- Dashboard > Environment
- 변수 수정 후 자동 재배포

---

## 🆘 도움이 필요할 때

### 공식 문서
- **Render 문서**: https://render.com/docs
- **Neon 문서**: https://neon.tech/docs

### 커뮤니티
- **Render Community**: https://community.render.com
- **GitHub Issues**: https://github.com/beartaesu/varietyquiz/issues

---

## 🎉 완료!

Render 배포가 완료되면:
- ✅ 완전 무료로 운영
- ✅ 자동 HTTPS
- ✅ 자동 재배포
- ✅ 글로벌 CDN

**생성된 URL을 저장하고 공유하세요!**

---

## 📝 요약

### Render가 Vercel보다 나은 이유
1. **Express 서버 완벽 지원** - 서버리스 아님
2. **간단한 설정** - 복잡한 설정 불필요
3. **완전 무료** - 영구적
4. **PostgreSQL 지원** - 별도 설정 불필요

### 다음 단계
1. 배포 완료 후 URL 저장
2. 배드민턴 매칭 개선사항 테스트
3. 필요시 이미지 파일 추가
