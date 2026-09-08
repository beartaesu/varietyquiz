# VarietyQuizQuiz V2 — ChatGPT Work Handoff

이 파일을 기존 VarietyQuizQuiz 개발 Work에 첨부하고 아래 지시를 그대로 실행한다.

---

## 작업 목표

현재 Work에 있는 VarietyQuizQuiz V1 코드베이스를 분석하고,
`VARIETYQUIZQUIZ_V2_MASTER_PLAN`,
`VARIETYQUIZQUIZ_V2_PROJECT_PLAN`,
`VARIETYQUIZQUIZ_V2_TASKS`,
`VARIETYQUIZQUIZ_V1_V2_GAP_ANALYSIS`
기준으로 V2 개편 계획을 실제 코드에 맞게 확정한다.

운영 도메인:

`https://varietyquizquiz.com`

중요:
기존 코드를 무시하고 새 프로젝트를 만드는 것이 아니라,
V1의 재사용 가능한 코드/DB/URL/데이터/배포 환경을 최대한 보존한다.

---

# STEP 1. READ-ONLY AUDIT

먼저 코드를 수정하지 말고 전체 프로젝트를 분석한다.

확인:

1. 기술 스택
2. 디렉터리 구조
3. package/dependency
4. routing
5. rendering 방식
6. DB 및 schema
7. ORM
8. API
9. 인증
10. 관리자
11. 이미지/파일 저장
12. Analytics
13. 광고
14. 환경변수
15. 배포
16. CI/CD
17. 테스트
18. robots
19. sitemap
20. metadata
21. 기존 콘텐츠 URL
22. 기존 투표/사용자 데이터

결과를:

`docs/V1_AUDIT.md`

에 작성한다.

---

# STEP 2. GAP TABLE

V1의 모든 주요 기능/구조를 아래 판정으로 분류한다.

- KEEP
- REFACTOR
- MIGRATE
- DELETE
- REPLACE

다음 표를 작성:

| 영역 | V1 구현 | 판정 | V2 목표 | 변경 내용 | 위험 |
|---|---|---|---|---|---|

파일:

`docs/V1_V2_GAP.md`

---

# STEP 3. ARCHITECTURE DECISION

현재 스택을 유지할 수 있으면 유지한다.

새 프레임워크로 전면 재작성은 아래 조건에서만 허용:
- SEO 구현이 구조적으로 어렵거나
- 유지보수 비용이 과도하거나
- 현재 코드 품질 때문에 V2 확장이 더 비싸다고 근거를 제시할 수 있을 때.

작성:

`docs/V2_ARCHITECTURE.md`

포함:
- Frontend
- Backend
- DB
- Storage
- Auth
- Analytics
- Queue/cron
- AI
- Deployment
- SEO

---

# STEP 4. DATA MIGRATION

기존 DB가 있다면 반드시 보존 전략을 세운다.

작성:

`docs/V2_MIGRATION.md`

포함:
- V1 schema
- V2 schema
- mapping
- migration script
- rollback
- validation
- 백업

운영 DB를 바로 수정하지 않는다.

---

# STEP 5. TASK 재작성

기존 `TASKS.md`를 실제 코드베이스에 맞게 업데이트한다.

각 TASK:

```text
ID
Title
Priority
Goal
Files
Dependencies
Implementation
Acceptance Criteria
Test
Rollback
```

첫 구현 범위는 P0만 잡는다.

P0:
1. V2 URL/SEO 기반
2. Content 모델
3. Candidate
4. Vote/Play
5. VS
6. 월드컵
7. 랭킹
8. CMS
9. 공유
10. Analytics

---

# STEP 6. 실행 규칙

한 번에 전체 V2를 만들지 않는다.

순서:

```text
Audit
→ Architecture
→ Migration
→ P0 Foundation
→ VS
→ World Cup
→ Rank
→ CMS
→ SEO
→ Analytics
→ Regression
→ Deploy
```

각 단계 완료 시:
- 테스트
- lint/typecheck
- build
- regression
- 기존 기능 영향 확인

후 다음 TASK로 이동한다.

---

# 절대 하지 말 것

- 기존 DB 삭제
- V1 데이터를 임의 초기화
- 기존 URL 일괄 제거
- 운영 환경변수 커밋
- copyright 불명 이미지 자동 수집
- AI 생성 결과 자동 공개
- 테스트 없이 운영 DB migration
- V1 기능을 확인하지 않고 새 프로젝트로 교체

---

# 첫 응답 형식

코드를 모두 읽은 뒤 다음 형식으로 보고한다.

## 1. 현재 기술 스택

## 2. 현재 구현된 기능

## 3. 현재 DB 구조

## 4. 유지 가능한 자산

## 5. V2와 충돌하는 구조

## 6. SEO 현황

## 7. V1 → V2 GAP

## 8. 권장 아키텍처

## 9. Migration 계획

## 10. 최초 구현할 TASK 5개

분석이 끝나기 전에는 대규모 코드 변경을 시작하지 않는다.
