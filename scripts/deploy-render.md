# Render 배포 스크립트

## 1단계: GitHub에 코드 푸시

```bash
# Git 초기화
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Deploy to Render"

# GitHub 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/varietyquiz.git
git branch -M main
git push -u origin main
```

## 2단계: Render 회원가입

1. https://render.com 접속
2. **Get Started** 클릭
3. GitHub 계정으로 로그인
4. 저장소 접근 권한 허용

## 3단계: PostgreSQL 데이터베이스 생성

1. Dashboard > **New** > **PostgreSQL**
2. 설정:
   - Name: `varietyquiz-db`
   - Database: `varietyquiz`
   - User: `varietyquiz`
   - Region: `Oregon (US West)` (가장 가까운 지역)
   - Plan: **Free**
3. **Create Database** 클릭
4. **Internal Database URL** 복사 (나중에 사용)
   ```
   postgresql://varietyquiz:xxx@dpg-xxx.oregon-postgres.render.com/varietyquiz
   ```

## 4단계: Web Service 생성

1. Dashboard > **New** > **Web Service**
2. GitHub 저장소 연결
   - **Connect** 클릭 (varietyquiz 저장소)
3. 설정:
   - **Name**: `varietyquiz`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

## 5단계: 환경 변수 설정

**Environment Variables** 섹션에서 **Add Environment Variable** 클릭:

```
DATABASE_URL=postgresql://varietyquiz:xxx@dpg-xxx.oregon-postgres.render.com/varietyquiz
NODE_ENV=production
PORT=10000
```

**주의**: `DATABASE_URL`은 3단계에서 복사한 Internal Database URL 사용

## 6단계: 배포

1. **Create Web Service** 클릭
2. 빌드 시작 (5-10분 소요)
3. 로그에서 진행 상황 확인
4. 성공하면 URL 생성: `https://varietyquiz.onrender.com`

## 완료! 🎉

## 재배포

### 자동 재배포
GitHub에 푸시하면 자동으로 재배포:
```bash
git add .
git commit -m "Update"
git push
```

### 수동 재배포
Render 대시보드 > **Manual Deploy** > **Deploy latest commit**

## 커스텀 도메인 연결

1. Render 프로젝트 > **Settings** > **Custom Domains**
2. **Add Custom Domain** 클릭
3. 도메인 입력 (예: `varietyquiz.com`)
4. DNS 설정:
   ```
   CNAME: varietyquiz.onrender.com
   ```

## 무료 플랜 제한사항

### 슬립 모드
- 15분 비활성 후 자동 슬립
- 첫 접속 시 30초 대기 (콜드 스타트)

### 해결 방법
1. **Paid Plan** 업그레이드 ($7/월)
2. **Cron Job** 사용 (5분마다 핑)
3. **UptimeRobot** 사용 (무료 모니터링)

## 문제 해결

### 빌드 실패
- **Logs** 탭에서 오류 확인
- `package.json`의 스크립트 확인

### 데이터베이스 연결 실패
- `DATABASE_URL`이 **Internal Database URL**인지 확인
- PostgreSQL 서비스가 실행 중인지 확인

### 느린 응답 속도
- 무료 플랜의 슬립 모드 때문
- Paid Plan으로 업그레이드 고려

## 데이터베이스 관리

### 데이터베이스 접속
1. Render Dashboard > PostgreSQL 서비스
2. **Connect** 탭
3. **External Database URL** 사용하여 접속

### psql 사용
```bash
psql postgresql://varietyquiz:xxx@dpg-xxx.oregon-postgres.render.com/varietyquiz
```

### GUI 도구 사용
- **pgAdmin**: https://www.pgadmin.org/
- **DBeaver**: https://dbeaver.io/
- **TablePlus**: https://tableplus.com/

## 모니터링

### 로그 확인
Render Dashboard > **Logs** 탭

### 메트릭 확인
Render Dashboard > **Metrics** 탭
- CPU 사용량
- 메모리 사용량
- 요청 수

## 비용

### 무료 플랜
- Web Service: 무료 (750시간/월)
- PostgreSQL: 무료 (90일 후 삭제)

### Paid Plan
- Web Service: $7/월
- PostgreSQL: $7/월
- 슬립 모드 없음
- 더 많은 리소스
