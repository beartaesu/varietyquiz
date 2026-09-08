# Variety Quiz v2

검색과 공유로 발견하고, VS와 월드컵에 참여한 결과가 랭킹으로 이어지는 콘텐츠 플랫폼입니다. 기존 서비스와 분리된 `codex/v2` 브랜치에서 Next.js App Router로 새로 구축합니다.

배드민턴 대진표 v1은 `codex/badminton-v1` 브랜치에 보존되어 있습니다.

## 요구 환경

- Node.js 20.9 이상
- npm 10 이상 권장

## 로컬 실행

```powershell
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 품질 검사

```powershell
npm run check
npm run lint
npm test
npm run build
```

네 검사는 CI에서도 동일하게 실행됩니다.

## 데이터베이스

PostgreSQL 연결 주소를 설정한 뒤 다음 명령을 사용합니다.

```powershell
npm run db:check
npm run db:migrate
npm run db:seed
```

스키마를 변경했다면 `npm run db:generate -- --name=<변경명>`으로 새 순방향 마이그레이션을 생성합니다. 운영 DB에는 `drizzle-kit push`를 사용하지 않습니다. 자세한 절차는 `docs/DATABASE_OPERATIONS.md`에 있습니다.

## 환경 변수

`.env.example`을 `.env.local`로 복사해 사용합니다. 현재 기반 단계에서는 외부 서비스 비밀값이 필요하지 않습니다.

## 문서

- `docs/V1_AUDIT.md`: V1 코드 감사
- `docs/V2_ARCHITECTURE.md`: V2 기술 구조
- `docs/V2_MIGRATION.md`: 단계별 이관 계획
- `docs/P0_TASKS.md`: P0 실행 작업과 완료 조건
- `docs/DATABASE_OPERATIONS.md`: DB 변경·백업·복원 원칙
