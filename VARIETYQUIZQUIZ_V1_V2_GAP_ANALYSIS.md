# VarietyQuizQuiz V1 → V2 GAP 분석

## 0. 분석 범위

대상 서비스: `https://varietyquizquiz.com`

현재 외부에서 확인 가능한 상태와 V2 기획안을 비교한 1차 GAP 분석이다.

### 외부 확인 결과
- 도메인은 응답한다.
- 공개 검색엔진에서 `site:varietyquizquiz.com` 기준으로 유의미한 내부 페이지가 검색되지 않는다.
- 외부 웹 분석에서는 메인 HTML 본문이 사실상 비어 있는 형태로 수집된다.
- 따라서 현재 프론트가 CSR 중심이거나, 크롤러가 콘텐츠를 충분히 읽지 못하는 구조일 가능성을 우선 점검해야 한다.
- 연결된 GitHub에서 `varietyquizquiz`라는 이름의 저장소는 발견되지 않았다.
- 실제 코드/DB/배포 구조는 기존 ChatGPT Work 또는 원본 저장소에서 추가 확인이 필요하다.

> 주의: 아래 항목 중 코드·DB에 관한 부분은 현재 공개 사이트만으로 확정한 것이 아니라 V2 전환 시 점검해야 할 기준이다.

---

# 1. V2 목표

VarietyQuizQuiz를 단순 퀴즈 사이트가 아니라 다음 순환 구조를 가진 참여형 콘텐츠 플랫폼으로 전환한다.

`Shorts/Reels → 콘텐츠 랜딩 → VS/월드컵/테스트 참여 → 선택 데이터 축적 → 랭킹/통계 → AI 재가공 콘텐츠 → SNS 재유입`

핵심 콘텐츠 모듈:

1. VS
2. 월드컵
3. 성향/취향 테스트
4. 랭킹·통계
5. AI 시뮬레이션
6. 향후 사용자 제작 콘텐츠(UGC)

---

# 2. V1 → V2 GAP 요약

| 영역 | 현재 외부 관찰 | V2 목표 | 판정 | 우선순위 |
|---|---|---|---|---|
| 검색 노출 | 내부 페이지 검색 노출이 거의 확인되지 않음 | 콘텐츠별 검색 랜딩 | 개선 | P0 |
| SSR/SSG | 크롤러가 본문을 충분히 읽지 못하는 정황 | 주요 페이지 서버 렌더링/정적 생성 | 개선 | P0 |
| 메타데이터 | 공개 분석으로 확인 어려움 | title/description/OG/JSON-LD | 확인 후 개선 | P0 |
| sitemap | 확인 필요 | 콘텐츠 자동 sitemap | 신규/개선 | P0 |
| robots | 확인 필요 | 정상 크롤링 정책 | 확인 | P0 |
| 콘텐츠 구조 | 현재 코드 확인 필요 | 공통 Content 모델 | 재설계 | P0 |
| VS | 확인 필요 | 1:1 즉시 투표 | 핵심 신규 | P0 |
| 월드컵 | 기존 기능 존재 여부 확인 | 8/16/32/64강 | 핵심 | P0 |
| 랭킹 | 확인 필요 | 전체/기간/속성별 집계 | 신규 | P0 |
| 공유 | 확인 필요 | OG 카드 + 결과 공유 | 개선 | P0 |
| Analytics | 확인 필요 | 콘텐츠별 퍼널 이벤트 | 재설계 | P0 |
| CMS | 확인 필요 | 콘텐츠 생성/예약/수정/노출 관리 | 핵심 | P0 |
| 로그인 | 초기에는 필수 아님 | 익명 플레이 + 선택 로그인 | 유지/후순위 | P1 |
| 성향 테스트 | 확인 필요 | 점수/분기형 테스트 | 신규 | P1 |
| AI 생성 | 확인 필요 | 초안 생성 + 운영자 승인 | 신규 | P1 |
| 개인화 | 확인 필요 | 플레이 기록 기반 추천 | 신규 | P2 |
| AI SIM | 없음 가정 금지, 코드 확인 필요 | 시뮬레이션 콘텐츠 | 신규 | P2 |
| UGC | 확인 필요 | 사용자 제작/신고/검수 | 신규 | P2 |

---

# 3. 가장 먼저 고쳐야 할 것: SEO / 콘텐츠 주소 체계

## 문제
콘텐츠 사이트는 각각의 콘텐츠가 독립적인 검색·SNS 랜딩 페이지가 되어야 한다.

메인 화면만 JS로 렌더링되고 각 콘텐츠가 검색엔진에서 독립적으로 인식되지 않으면:
- Google/Naver 검색 유입을 얻기 어렵다.
- SNS 공유 미리보기가 불안정해진다.
- 오래 쌓인 콘텐츠가 자산으로 남지 않는다.
- AdSense 심사 및 페이지 가치 측면에서도 불리할 수 있다.

## V2 권장 URL

```text
/
 /vs
 /vs/{slug}
 /worldcup
 /worldcup/{slug}
 /test
 /test/{slug}
 /rank
 /rank/{slug}
 /sim
 /sim/{slug}
 /category/{slug}
```

숫자 ID만 노출하기보다 사람이 읽을 수 있는 slug를 사용한다.

예:

```text
/worldcup/best-korean-ramyeon-2026
/vs/jjajang-vs-jjamppong
/test/my-spending-type
```

## 페이지별 필수 SEO

- 고유 `<title>`
- meta description
- canonical URL
- Open Graph
- Twitter Card
- JSON-LD
- 콘텐츠 대표 이미지
- indexable 본문 텍스트
- sitemap 자동 반영
- 404/410 처리

---

# 4. 콘텐츠 데이터 모델 통합

V2에서는 콘텐츠 종류별로 완전히 별도 시스템을 만드는 것보다 공통 엔티티를 두는 것이 좋다.

## Content

```text
id
type: VS | WORLDCUP | TEST | RANK | SIM
title
slug
description
thumbnail
category_id
status
visibility
published_at
created_at
updated_at
seo_title
seo_description
share_title
```

## Candidate

```text
id
content_id
name
image
description
metadata
sort_order
```

## Vote / Play

```text
id
content_id
session_id
user_id nullable
candidate_a
candidate_b
selected_candidate
round
created_at
```

개인정보 없이도 통계가 가능한 범위에서 익명 session_id 중심으로 시작한다.

---

# 5. V2 P0 기능

## P0-1 홈

목표: 3초 안에 플레이할 콘텐츠를 선택하게 한다.

섹션:
- 지금 인기
- 새 콘텐츠
- VS
- 월드컵
- 실시간 랭킹
- 카테고리
- 에디터 추천

## P0-2 VS

화면:
- 질문
- A 이미지/텍스트
- B 이미지/텍스트
- 선택
- 즉시 결과
- 다음 VS

결과 예:
- A 63.2%
- B 36.8%
- 총 12,481표

중요:
선택 전에는 결과를 노출하지 않는다.

## P0-3 월드컵

지원:
- 8강
- 16강
- 32강
- 64강

필수:
- 대진 생성
- 라운드 진행
- 우승 결과
- 이탈 후 복구 선택적
- 전체 우승률 집계
- 공유

## P0-4 랭킹

단순 콘텐츠 페이지와 별개로 데이터 자체를 콘텐츠화한다.

예:
- 오늘 가장 많이 선택된 후보
- 이번 주 월드컵 우승률
- 가장 접전이었던 VS
- 가장 많은 참여를 받은 콘텐츠

## P0-5 관리자 CMS

관리자가 코드 수정 없이 콘텐츠를 등록할 수 있어야 한다.

필수:
- 콘텐츠 생성
- 후보 일괄 등록
- 이미지 업로드
- draft/published
- 예약 발행
- 카테고리
- SEO 설정
- 미리보기
- 통계
- 숨김/삭제

목표:
`콘텐츠 하나 생성 → 발행` 10~15분 이내.

---

# 6. 숏폼과 웹의 연결

VarietyQuizQuiz의 Shorts/Reels는 독립적인 수익원이 아니라 고객 획득 채널로 우선 설계한다.

## 자동화 흐름

```text
웹 투표 데이터
↓
흥미로운 패턴 탐지
↓
AI 스크립트 생성
↓
영상 템플릿
↓
TTS / 자막 / 이미지
↓
Shorts/Reels
↓
CTA
↓
varietyquizquiz.com
```

콘텐츠 예:

- “한국인이 가장 많이 고른 야식 TOP 5”
- “결승에서 51:49로 갈린 월드컵”
- “20대와 30대 선택이 정반대였던 항목”
- “오늘 1만 명이 선택한 VS”

---

# 7. AI 도입 원칙

AI가 곧바로 발행하지 않는다.

```text
AI 생성
→ 초안
→ 정책/권리 체크
→ 관리자 검토
→ 발행
```

AI 사용처:
- 제목 후보
- 설명문
- 후보 아이디어
- VS 조합
- 테스트 문항 초안
- SNS 카피
- Shorts 스크립트
- 통계 요약

---

# 8. 연예인/외모 콘텐츠 정책

연예인 사진을 무단 수집하는 구조는 V2 핵심으로 두지 않는다.

우선순위:
1. 자체 제작 소재
2. 라이선스 확보 소재
3. 상업 이용 가능한 소재
4. AI 가상 캐릭터

관리자 데이터에 권리 정보 필드 추가 권장:

```text
asset_source
license_type
license_reference
commercial_use_allowed
person_rights_status
```

---

# 9. Analytics 이벤트

페이지뷰만 보면 안 된다.

필수 이벤트:

```text
content_impression
content_open
game_start
vote_cast
round_complete
game_complete
result_share
next_content_click
signup
ad_impression
affiliate_click
```

주요 KPI:

- 방문자 → 플레이 시작률
- 플레이 완주율
- 세션당 플레이 수
- 결과 공유율
- 7일 재방문율
- 콘텐츠당 참여 수
- Shorts 유입 → 플레이 전환율
- 콘텐츠별 수익/RPM

---

# 10. V1 Migration 원칙

기존 서비스의 URL과 데이터는 가능한 한 버리지 않는다.

## 코드 확인 후 분류

각 기존 기능을 다음 중 하나로 표시한다.

```text
KEEP
REFACTOR
MIGRATE
DELETE
REPLACE
UNKNOWN
```

## DB

기존 데이터가 있다면 새 스키마로 바로 덮어쓰지 않는다.

```text
V1 DB
↓
migration script
↓
validation
↓
V2 DB
```

## URL

기존 공개 URL이 있다면:
- 동일 URL 유지 또는
- 신규 URL로 301 Redirect

---

# 11. Work에서 반드시 실제 코드로 확인할 항목

1. Framework / runtime
2. Router
3. 렌더링 방식 CSR/SSR/SSG
4. DB 종류
5. ORM
6. 인증
7. 이미지 저장소
8. API 구조
9. 현재 콘텐츠 데이터 모델
10. 관리자 기능
11. 배포 플랫폼
12. 도메인 연결
13. Analytics
14. 광고 코드
15. robots.txt
16. sitemap.xml
17. metadata
18. 기존 URL
19. 기존 사용자/투표 데이터
20. 테스트/CI

---

# 12. 코드 확인 직후 TASK 재분류

## Phase 0 — Audit

- [ ] 프로젝트 전체 구조 분석
- [ ] 기술스택 문서화
- [ ] 현재 기능 목록 생성
- [ ] DB schema 분석
- [ ] API 목록 생성
- [ ] URL 목록 생성
- [ ] V1 데이터 보존 대상 지정
- [ ] 보안/환경변수 확인
- [ ] 배포 구조 확인
- [ ] SEO 상태 확인

## Phase 1 — Foundation

- [ ] V2 라우팅 확정
- [ ] 공통 Content 모델
- [ ] Candidate 모델
- [ ] Play/Vote 모델
- [ ] Category 모델
- [ ] 관리자 권한
- [ ] Analytics schema

## Phase 2 — P0

- [ ] 홈 V2
- [ ] VS
- [ ] 월드컵
- [ ] 랭킹
- [ ] CMS
- [ ] 공유
- [ ] SEO
- [ ] sitemap
- [ ] Analytics

## Phase 3 — P1

- [ ] 성향 테스트
- [ ] 사용자 계정
- [ ] 플레이 기록
- [ ] AI 작성 보조
- [ ] 상세 통계

## Phase 4 — P2

- [ ] 개인화 추천
- [ ] AI SIM
- [ ] UGC
- [ ] 브랜드 캠페인
- [ ] Shorts 자동화

---

# 13. V2 출시 기준

다음이 모두 충족되어야 V2 정식 출시로 본다.

- 모바일 우선 UI
- 로그인 없이 플레이 가능
- VS/월드컵 정상 완주
- 중복/비정상 투표 기본 방어
- CMS에서 콘텐츠 등록 가능
- 콘텐츠별 URL
- 메타데이터 정상
- sitemap 정상
- Analytics 정상
- OG 공유 정상
- V1 데이터 보존 검증
- 기존 주요 URL redirect 검증
- 오류 로깅
- 개인정보/이용약관/콘텐츠 정책 페이지

---

# 14. 결론

V2의 핵심 경쟁력은 퀴즈의 개수가 아니다.

`사용자 선택 → 데이터 → 랭킹/통계 → 새로운 콘텐츠 → SNS → 다시 사용자 선택`

이 루프를 만들어야 한다.

VarietyQuizQuiz는 “퀴즈 사이트”가 아니라 **선택과 취향 데이터를 기반으로 콘텐츠가 계속 생성되는 플랫폼**으로 재정의하는 것이 적합하다.
