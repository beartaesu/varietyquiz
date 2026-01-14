# 🚀 Vercel + Neon DB 배포 가이드

## 📋 개요

이 가이드는 K-연예인 퀴즈 애플리케이션을 **Vercel (프론트엔드/백엔드) + Neon (PostgreSQL 데이터베이스)**로 배포하는 방법을 설명합니다.

### ✅ 장점
- **완전 무료** (영구적)
- **빠른 속도** (글로벌 CDN)
- **자동 배포** (GitHub 연동)
- **무제한 트래픽**

### ⚠️ 주의사항
- 데이터베이스를 별도로 설정해야 함
- 서버리스 환경 (콜드 스타트 가능)

---

## 🗄️ 1단계: Neon DB 설정 (5분)

### 1-1. Neon 회원가입
1. **https://neon.tech** 접속
2. **"Sign Up"** 클릭
3. **"Continue with GitHub"** 선택
4. GitHub 계정으로 로그인

### 1-2. 프로젝트 생성
1. **"Create a project"** 클릭
2. **프로젝트 설정**:
   ```
   Project name: varietyquiz
   Database name: neondb (기본값)
   Region: Asia Pacific (Singapore) - 한국과 가장 가까움
   ```
3. **"Create project"** 클릭

### 1-3. 연결 정보 복사
1. 프로젝트 대시보드에서 **"Connection string"** 섹션 찾기
2. **"Pooled connection"** 탭 선택 (중요!)
3. **연결 문자열 복사** (전체 선택해서 복사)

```
postgresql://username:password@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**⚠️ 중요**: 이 연결 문자열을 안전한 곳에 저장해두세요!

---

## 🌐 2단계: Vercel 배포 (5분)

### 2-1. Vercel 회원가입
1. **https://vercel.com** 접속
2. **"Sign Up"** 클릭
3. **"Continue with GitHub"** 선택
4. GitHub 계정으로 로그인
5. Vercel 권한 승인

### 2-2. 새 프로젝트 생성
1. Vercel 대시보드에서 **"New Project"** 클릭
2. **GitHub 저장소 선택**:
   - `beartaesu/varietyquiz` 찾기
   - **"Import"** 클릭

### 2-3. 프로젝트 설정
**Configure Project** 화면에서:

#### Framework Preset
```
Framework Preset: Vite (자동 감지됨)
```

#### Build and Output Settings
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### Environment Variables (중요!)
**"Environment Variables"** 섹션에서 **"Add"** 클릭:

1. **첫 번째 변수**:
   ```
   Name: DATABASE_URL
   Value: [Neon에서 복사한 연결 문자열]
   ```

2. **두 번째 변수**:
   ```
   Name: NODE_ENV
   Value: production
   ```

### 2-4. 배포 시작
1. **"Deploy"** 클릭
2. 빌드 진행 상황 확인 (2-3분 소요)
3. ✅ 성공 시 URL 생성됨

---

## 🎯 3단계: 배포 완료 확인

### 3-1. URL 확인
배포 완료 후 생성되는 URL:
```
https://varietyquiz-xxx.vercel.app
```

### 3-2. 기능 테스트
1. **홈페이지 접속**
2. **퀴즈 게임 테스트**
3. **배드민턴 매칭 테스트**

### 3-3. 데이터베이스 연결 확인
- 퀴즈 데이터가 로딩되는지 확인
- 배드민턴 참가자 저장이 되는지 확인

---

## 🔧 4단계: 문제 해결

### 빌드 실패
**증상**: 빌드 중 오류 발생

**해결**:
1. Vercel 대시보드 > **Functions** 탭 > **View Logs**
2. 오류 메시지 확인
3. 일반적인 원인:
   - 환경 변수 누락
   - 의존성 설치 실패

### 데이터베이스 연결 실패
**증상**: 앱은 로딩되지만 데이터가 없음

**해결**:
1. **DATABASE_URL** 환경 변수 확인
2. Neon 대시보드에서 연결 문자열 재확인
3. **"Pooled connection"** 사용했는지 확인

### 서버리스 함수 오류
**증상**: API 호출 시 500 오류

**해결**:
1. Vercel 대시보드 > **Functions** 탭
2. 함수 로그 확인
3. 환경 변수 재설정

---

## ⚡ 5단계: 성능 최적화

### 5-1. 커스텀 도메인 (선택사항)
1. Vercel 프로젝트 > **Settings** > **Domains**
2. 도메인 추가 및 DNS 설정

### 5-2. 환경 변수 추가 (선택사항)
**Naver API** (이미지 검색 개선):
```
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### 5-3. 분석 설정
1. Vercel 대시보드 > **Analytics**
2. 트래픽 및 성능 모니터링

---

## 🔄 6단계: 재배포 방법

### 자동 재배포 (추천)
```bash
# 코드 수정 후
git add .
git commit -m "Update feature"
git push

# Vercel이 자동으로 감지하고 재배포
```

### 수동 재배포
1. Vercel 대시보드 > **Deployments**
2. **"Redeploy"** 클릭

---

## 📊 비용 및 제한사항

### Vercel 무료 플랜
```
✅ 100GB 대역폭/월
✅ 무제한 사이트
✅ 자동 HTTPS
✅ 글로벌 CDN
```

### Neon 무료 플랜
```
✅ 0.5GB 스토리지
✅ 1개 프로젝트
✅ 무제한 쿼리
⚠️ 7일 비활성시 일시 정지 (자동 재시작)
```

---

## 🎉 배포 완료 체크리스트

- [ ] Neon DB 프로젝트 생성 완료
- [ ] 연결 문자열 복사 완료
- [ ] Vercel 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 빌드 성공 (초록색 체크)
- [ ] URL 생성 완료
- [ ] 홈페이지 접속 가능
- [ ] 퀴즈 게임 작동 확인
- [ ] 배드민턴 매칭 작동 확인
- [ ] 데이터베이스 연결 확인

---

## 🆘 도움이 필요할 때

### 공식 문서
- **Vercel 문서**: https://vercel.com/docs
- **Neon 문서**: https://neon.tech/docs

### 커뮤니티
- **Vercel Discord**: https://discord.gg/vercel
- **GitHub Issues**: https://github.com/beartaesu/varietyquiz/issues

### 일반적인 문제
1. **빌드 실패**: 로그 확인 후 환경 변수 재설정
2. **DB 연결 실패**: Pooled connection 사용 확인
3. **느린 로딩**: 콜드 스타트 (첫 접속시 정상)

---

## 🎯 다음 단계

### 1. 이미지 파일 추가 (선택사항)
`attached_assets/generated_images/` 폴더에 배경 이미지 3개 추가

### 2. 도메인 연결 (선택사항)
커스텀 도메인으로 브랜딩

### 3. 모니터링 설정
Vercel Analytics로 사용량 추적

---

**축하합니다! 🎉**

Vercel + Neon DB 배포가 완료되었습니다!
완전 무료로 고성능 웹 애플리케이션을 운영할 수 있어요.

**생성된 URL을 저장하고 공유하세요!**