# Variety Quiz 배포·운영 가이드

이 문서는 프로젝트를 전달받은 개발자나 운영자가 Variety Quiz를 로컬에서 확인하고 배포할 수 있도록 정리한 인수인계 문서입니다.

## 1. 서비스 구성

Variety Quiz는 하나의 React 웹 앱과 Express 서버로 구성됩니다.

| 기능 | 경로 | 데이터 저장 방식 |
| --- | --- | --- |
| 메인 화면 | `/` | 없음 |
| 퀴즈 | `/sitemap`, `/quiz` | 정적 데이터 및 브라우저 상태 |
| 배드민턴 복식 대진표 | `/bracket/badminton`, `/bracket/badminton/board` | 브라우저 `localStorage` |
| 취향 월드컵 둘러보기·제작 | `/bracket/worldcup`, `/bracket/worldcup/create` | 브라우저 `localStorage`, 공유 URL |
| 상태 확인 API | `/api/health` | 서버 메모리 |

현재 배드민턴 대진표와 취향 월드컵 데이터는 사용자의 브라우저에 저장됩니다. 다른 기기나 브라우저와 자동 동기화되지 않습니다.

## 2. 준비 사항

- Node.js 20 이상 권장
- npm
- 운영 배포 대상 계정
- 선택 사항: PostgreSQL 및 Google Cloud Storage

## 3. 처음 설치

```powershell
cd C:\dev\varietyquiz
npm.cmd install
```

환경 변수가 필요한 경우 `.env.example`을 `.env`로 복사한 뒤 값을 입력합니다. 현재 주요 사용자 기능은 데이터베이스 없이도 실행할 수 있습니다.

## 4. 로컬 개발 서버

### Windows PowerShell

```powershell
cd C:\dev\varietyquiz
$env:NODE_ENV="development"
.\node_modules\.bin\tsx.cmd server\index.ts
```

### macOS 또는 Linux

```bash
npm run dev
```

접속 주소는 `http://localhost:5000`입니다. 종료할 때는 서버를 실행한 터미널에서 `Ctrl+C`를 누릅니다.

## 5. 검증

```powershell
npm.cmd run build
npm.cmd test
```

배포 전 최소 확인 항목:

1. 홈에서 각 서비스로 이동할 수 있는지 확인
2. 배드민턴 페이지에서 참가자·코트·라운드를 입력하고 대진표가 생성되는지 확인
3. 배드민턴 검증 결과에서 필수 조건이 통과되는지 확인
4. 취향 월드컵을 만들고 끝까지 진행할 수 있는지 확인
5. 퀴즈 카테고리를 선택하고 게임을 완료할 수 있는지 확인
6. 모바일 화면에서 표와 버튼이 잘리거나 겹치지 않는지 확인

## 6. 프로덕션 빌드와 실행

```powershell
npm.cmd run build
npm.cmd start
```

프로덕션 서버는 기본적으로 `dist/public`의 정적 파일을 제공합니다. 포트는 `PORT` 환경 변수로 바꿀 수 있으며 기본값은 `5000`입니다.

## 7. 환경 변수

| 이름 | 필수 여부 | 설명 |
| --- | --- | --- |
| `PORT` | 선택 | 서버 포트, 기본값 `5000` |
| `NODE_ENV` | 권장 | 개발은 `development`, 운영은 `production` |
| `DATABASE_URL` | 선택 | PostgreSQL 연결 주소 |
| Google Cloud 관련 값 | 선택 | 이미지 Object Storage 기능 사용 시 필요 |

취향 월드컵 제작 화면에서 네이버 이미지 자동 선택 기능을 사용하려면 다음 두 값을 설정합니다.

```env
NAVER_CLIENT_ID=발급받은_클라이언트_ID
NAVER_CLIENT_SECRET=발급받은_클라이언트_SECRET
```

네이버 개발자 센터에서 애플리케이션을 등록할 때 사용 API에 `검색`을 추가해야 합니다. 키가 없으면 제작 화면은 네이버 이미지 검색 페이지를 새 창으로 여는 대체 기능을 제공합니다.

비밀번호, API 키, 서비스 계정 파일은 Git 저장소에 올리지 않습니다.

## 8. 배포 방법

### Railway 또는 Render

1. GitHub 저장소를 새 서비스에 연결합니다.
2. 빌드 명령을 `npm install && npm run build`로 설정합니다.
3. 시작 명령을 `npm start`로 설정합니다.
4. `NODE_ENV=production`을 등록합니다.
5. 플랫폼이 제공하는 `PORT` 값을 그대로 사용합니다.
6. 배포 후 `/api/health`와 주요 페이지를 확인합니다.

### 자체 서버

1. Node.js와 npm을 설치합니다.
2. 저장소를 내려받고 `npm install`을 실행합니다.
3. `npm run build`를 실행합니다.
4. `NODE_ENV=production` 환경에서 `npm start`를 실행합니다.
5. Nginx 또는 다른 리버스 프록시에서 HTTPS를 설정합니다.

## 9. 배드민턴 대진표 동작 원칙

배드민턴 기능은 다음 순서로 동작합니다.

1. 설정 화면에서 참가자·코트·휴식 간격 정책·시험 기능 선택
2. 새 세션을 버전 데이터로 저장하거나 기존 세션 계속하기
3. 운영 화면에서 경기·휴식·단식 상태 선택
4. 복식은 게임당 4명, 단식은 게임당 2명으로 그룹 배치
5. 휴식·단식·복식의 중복, 누락, 미등록 참가자와 코트 수 전수검사
6. 세션 고정 또는 라운드별 동적 휴식 간격 검사
7. 누적 휴식 편차가 1을 넘으면 해당 라운드에 사용자 승인 예외 기록
8. 승인된 과거 예외는 이후 라운드를 다시 차단하지 않음
9. 사용자가 드래그앤드롭 또는 터치로 참가자 위치 교체
10. 검증을 통과한 라운드만 확정하고 브라우저에 자동 저장

핵심 계산 코드는 `client/src/lib/badminton-scheduler.ts`, 세션 저장 코드는 `client/src/lib/badminton-session.ts`, 화면 코드는 `client/src/pages/badminton-matcher.tsx`와 `client/src/pages/badminton-board.tsx`에 있습니다.

## 10. 운영 시 주의사항

- 브라우저 저장 데이터를 삭제하면 참가자와 월드컵 임시 데이터도 삭제됩니다.
- 여러 사용자가 같은 데이터를 공유해야 한다면 서버 데이터베이스 연동이 추가로 필요합니다.
- 공유 월드컵 이미지가 크면 URL 길이 제한에 걸릴 수 있습니다.
- 연예인 퀴즈 데이터 파일과 문자 인코딩은 배포 전에 별도로 점검해야 합니다.
- 배포 후 HTTPS 환경에서 클립보드 복사 기능을 확인해야 합니다.

## 11. 문제 해결

### 5000번 포트를 이미 사용 중인 경우

```powershell
$env:PORT="5001"
$env:NODE_ENV="development"
.\node_modules\.bin\tsx.cmd server\index.ts
```

이 경우 `http://localhost:5001`로 접속합니다.

### 화면이 이전 버전으로 보이는 경우

브라우저에서 강력 새로고침을 실행하거나 사이트 저장 데이터와 캐시를 삭제합니다.

### 빌드가 실패하는 경우

`node_modules`를 다시 설치하고 Node.js 버전을 확인한 뒤 `npm.cmd run build`를 다시 실행합니다.
