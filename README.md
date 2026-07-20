# Variety Quiz

Variety Quiz는 여러 사람이 함께 즐길 수 있는 웹 기반 게임 모음입니다. 현재 연예인·상식 퀴즈, 취향 월드컵, 배드민턴 복식 대진표를 제공합니다.

## 제공 기능

### 배드민턴 세션 운영

- 설정 화면에서 참가자·등급·코트·휴식 간격 정책 구성
- 기존 세션 계속하기와 확정 라운드 자동 저장
- 운영 화면에서 경기·휴식·단식을 직접 선택
- 부족한 휴식 인원 자동 추천 및 경기 참가자 고정
- 복식 4명과 단식 2명을 한 라운드에 혼합 구성
- 팀 구분 없이 게임 그룹을 드래그 또는 터치로 편집
- 휴식·단식·복식의 중복 및 누락을 포함한 전체 참가자 전수검증
- 세션 고정 또는 라운드별 동적 최소 휴식 간격
- 휴식 편차 예외 승인 기록과 이후 라운드 재검증 지원
- 게임 다시 배치, 카드 이동 실행 취소·재실행, 확정 라운드 취소·복원
- 선택 가능한 자동 배치 후보 3개와 실시간 코트 타이머
- 세션 종료 요약과 향후 로그인·점수 기록 확장을 위한 버전 데이터 구조

### 취향 월드컵

- 항목과 이미지 추가
- 8강, 16강, 32강, 64강 진행
- 공유 링크 생성
- 최종 우승자와 순위 표시

### 퀴즈

- 연예인, 수도, 랜드마크, 사자성어, 속담 카테고리
- 제한 시간과 점수 계산
- 연예인 본명·예명 및 유사 답안 인정
- 결과 분석과 학습 안내

## 로컬 실행

### Windows PowerShell

```powershell
cd C:\dev\varietyquiz
npm.cmd install
$env:NODE_ENV="development"
.\node_modules\.bin\tsx.cmd server\index.ts
```

브라우저에서 `http://localhost:5000`으로 접속합니다.

### macOS 또는 Linux

```bash
npm install
npm run dev
```

## 주요 주소

| 서비스 | 주소 |
| --- | --- |
| 홈 | `/` |
| 퀴즈 선택 | `/sitemap` |
| 배드민턴 복식 대진표 | `/bracket/badminton` |
| 배드민턴 게임 배치 | `/bracket/badminton/board` |
| 취향 월드컵 둘러보기 | `/bracket/worldcup` |
| 취향 월드컵 만들기 | `/bracket/worldcup/create` |
| 취향 월드컵 플레이 | `/bracket/worldcup/play` |

## 기술 구성

- React 18, TypeScript, Vite
- Express
- Tailwind CSS, shadcn/ui
- Wouter
- Vitest

배포 및 운영 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.
