# 🚂 Railway 배포 - 실시간 가이드

## ✅ 1단계 완료: GitHub 푸시 성공!

코드가 성공적으로 GitHub에 업로드되었습니다:
- 저장소: https://github.com/beartaesu/varietyquiz
- 브랜치: main
- 커밋: "Prepare for Railway deployment"

---

## 📋 2단계: Railway 배포 (지금 진행!)

### 2-1. Railway 웹사이트 접속

1. **브라우저에서 열기**: https://railway.app

2. **회원가입/로그인**
   - 우측 상단 **"Login"** 클릭
   - **"Login with GitHub"** 선택
   - GitHub 계정으로 로그인
   - Railway 권한 승인

### 2-2. 새 프로젝트 생성

1. **"New Project"** 버튼 클릭 (대시보드 중앙 또는 우측 상단)

2. **"Deploy from GitHub repo"** 선택

3. **저장소 선택**
   - `beartaesu/varietyquiz` 찾기
   - **"Deploy Now"** 클릭

4. **배포 시작**
   - Railway가 자동으로 빌드 시작
   - 로그에서 진행 상황 확인 가능
   - 약 3-5분 소요

### 2-3. PostgreSQL 데이터베이스 추가

배포가 진행되는 동안 데이터베이스를 추가합니다:

1. **프로젝트 대시보드**에서 **"New"** 버튼 클릭

2. **"Database"** 선택

3. **"Add PostgreSQL"** 클릭

4. **자동 설정 완료**
   - `DATABASE_URL` 환경 변수 자동 생성
   - 앱과 자동 연결됨
   - 재배포 자동 시작

### 2-4. 환경 변수 확인 (선택사항)

1. 프로젝트 > **"Variables"** 탭 클릭

2. 자동 생성된 변수 확인:
   ```
   DATABASE_URL=postgresql://postgres:xxx@containers-us-west-xxx.railway.app:xxxx/railway
   RAILWAY_ENVIRONMENT=production
   ```

3. 추가 변수 설정 (필요시):
   - **"New Variable"** 클릭
   - 예: `NODE_ENV=production`

### 2-5. 배포 완료 확인

1. **"Deployments"** 탭에서 상태 확인
   - ✅ 초록색 체크: 배포 성공
   - ❌ 빨간색 X: 배포 실패 (로그 확인)

2. **URL 확인**
   - **"Settings"** 탭 > **"Domains"** 섹션
   - 자동 생성된 URL 확인
   - 예: `varietyquiz.up.railway.app`

3. **앱 접속**
   - URL 클릭하여 브라우저에서 열기
   - 앱이 정상 작동하는지 확인

---

## 🎉 배포 완료!

### 생성된 URL
```
https://varietyquiz.up.railway.app
```

### 다음 단계

#### 1. 이미지 파일 추가
현재 이미지 파일이 없어서 일부 페이지에서 이미지가 표시되지 않을 수 있습니다.

**해결 방법:**
1. `attached_assets/generated_images/` 폴더에 이미지 추가
2. Git 커밋 및 푸시
3. Railway가 자동으로 재배포

**필요한 이미지:**
- `Colorful_board_game_collection_b62010fc.png`
- `Board_game_pieces_variety_5429783a.png`
- `Quiz_show_board_game_227373d9.png`

#### 2. 커스텀 도메인 연결 (선택사항)
Railway 프로젝트 > **Settings** > **Domains** > **Custom Domain**

#### 3. 환경 변수 추가 (선택사항)
Naver API, Google Cloud Storage 등

---

## 🔧 문제 해결

### 빌드 실패
**증상**: 배포가 빨간색 X로 표시됨

**해결:**
1. **Logs** 탭에서 오류 메시지 확인
2. 일반적인 원인:
   - `package.json`의 스크립트 오류
   - 의존성 설치 실패
   - 빌드 명령어 오류

**해결 방법:**
```bash
# 로컬에서 빌드 테스트
npm install
npm run build

# 성공하면 다시 푸시
git add .
git commit -m "Fix build issues"
git push
```

### 데이터베이스 연결 실패
**증상**: 앱이 실행되지만 데이터베이스 오류 발생

**해결:**
1. PostgreSQL 서비스가 실행 중인지 확인
2. `DATABASE_URL` 환경 변수 확인
3. Railway 대시보드에서 PostgreSQL 재시작

### 앱이 시작되지 않음
**증상**: 배포는 성공했지만 URL 접속 시 오류

**해결:**
1. **Logs** 탭에서 런타임 로그 확인
2. `PORT` 환경 변수 확인 (Railway가 자동 설정)
3. `server/index.ts`의 포트 설정 확인

---

## 📊 Railway 대시보드 활용

### Metrics (메트릭)
- CPU 사용량
- 메모리 사용량
- 네트워크 트래픽

### Logs (로그)
- 실시간 애플리케이션 로그
- 빌드 로그
- 데이터베이스 로그

### Deployments (배포)
- 배포 히스토리
- 롤백 기능
- 재배포

---

## 💰 비용 안내

### 무료 크레딧
- 월 $5 크레딧 제공
- 소규모 프로젝트는 충분

### 사용량 확인
Railway 대시보드 > **Usage** 탭

### 비용 절감 팁
1. 사용하지 않는 서비스 삭제
2. 개발 환경은 로컬에서 실행
3. 필요시 Hobby Plan ($5/월) 고려

---

## 🔄 재배포 방법

### 자동 재배포 (추천)
```bash
# 코드 수정 후
git add .
git commit -m "Update feature"
git push

# Railway가 자동으로 감지하고 재배포
```

### 수동 재배포
Railway 대시보드 > **Deployments** > **Redeploy**

---

## 🎯 체크리스트

배포 완료 후 확인:

- [ ] Railway 프로젝트 생성 완료
- [ ] GitHub 저장소 연결 완료
- [ ] PostgreSQL 데이터베이스 추가 완료
- [ ] 배포 성공 (초록색 체크)
- [ ] URL 생성 완료
- [ ] 앱 접속 가능
- [ ] 퀴즈 게임 작동 확인
- [ ] 배드민턴 매칭 작동 확인

---

## 📞 추가 도움

### Railway 문서
- https://docs.railway.app

### 커뮤니티
- Discord: https://discord.gg/railway

### 이슈 리포트
- GitHub Issues: https://github.com/beartaesu/varietyquiz/issues

---

**축하합니다! 🎉**
Railway 배포가 완료되었습니다!
