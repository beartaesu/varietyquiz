# varietyquizquiz V2 프로젝트 기획서

## 1. 프로젝트명
varietyquizquiz V2 Rebuild

## 2. 프로젝트 목표
기존 초기 버전을 완전 폐기하지 않고, 유지 가능한 데이터는 이관하면서 참여형 콘텐츠 플랫폼으로 재구축한다. 핵심은 모바일 웹 우선, 빠른 콘텐츠 소비, 데이터 축적, 숏폼 재활용, 관리자 자동화다.

## 3. 제품 원칙
- 로그인 없이 즉시 플레이
- 첫 선택까지 3초 이내
- 모바일 웹 최우선
- 결과를 반드시 공유 가능하게
- 모든 사용자 액션은 익명 이벤트로 집계 가능하게
- 콘텐츠 타입을 늘려도 공통 엔진을 재사용하게
- SEO 가능한 공개 URL 구조
- 관리자 페이지에서 개발자 도움 없이 콘텐츠 발행 가능하게

## 4. MVP 범위
### 필수 P0
1. 홈
2. VS 즉석투표
3. 16/32강 월드컵
4. 결과/랭킹 페이지
5. 카테고리·태그
6. 검색
7. 공유 링크 및 OG 이미지
8. 기본 관리자 CMS
9. 익명 세션 및 투표 중복 제어
10. 이벤트 로그/분석
11. 신고 기능
12. 기존 콘텐츠 이관 도구

### P1
1. 성향 테스트
2. 로그인/내 기록
3. 친구와 결과 비교
4. 상세 통계
5. AI 콘텐츠 초안 생성
6. AI 숏폼 대본 생성
7. 관리자 예약 발행
8. 추천 피드

### P2
1. AI 시뮬레이션
2. 사용자 생성 콘텐츠
3. 브랜드 캠페인
4. 앱/PWA 강화
5. 개인화 추천
6. B2B 통계 대시보드

## 5. 주요 화면
### 홈
- 오늘의 VS
- 인기 월드컵
- 급상승 콘텐츠
- 신규 테스트
- 카테고리 바로가기

### VS 상세
- 후보 A / 후보 B
- 즉시 선택
- 전체 결과
- 다음 VS 자동 진입
- 공유

### 월드컵 플레이
- 진행률
- A/B 후보
- 뒤로가기 제한 정책
- 결승 결과
- 전체 사용자 랭킹과 내 선택 비교

### 결과
- 우승 후보
- 선택 경로
- 전체 이용자 통계
- 공유용 카드
- 관련 콘텐츠 추천

### 관리자
- 콘텐츠 생성/복제
- 후보 일괄 업로드
- AI 문구/이미지 초안
- 카테고리/태그 관리
- 신고 관리
- 노출/예약/비공개
- 기본 KPI 대시보드

## 6. 데이터 모델 초안
### content
id, type, title, slug, description, status, category_id, thumbnail, visibility, published_at, created_at, updated_at

### option
id, content_id, name, image_url, metadata_json, sort_order, active

### matchup
id, content_id, round, option_a_id, option_b_id, seed

### vote
id, content_id, matchup_id, selected_option_id, anonymous_user_id, session_id, created_at

### result_summary
content_id, option_id, votes, wins, win_rate, ranking, updated_at

### category
id, name, slug, sort_order

### tag
id, name, slug

### user
id, provider, nickname, optional_profile_fields, created_at

### report
id, content_id, reason, detail, status, created_at

### ai_generation_log
id, job_type, provider, model, prompt_version, input_ref, output_ref, status, cost, created_at

## 7. 추천 기술구성
### 프론트
- Next.js + TypeScript
- Tailwind CSS 또는 shadcn/ui
- PWA 우선, 네이티브 앱은 검증 후

### 백엔드
- 초기: Next.js API/Server Actions + PostgreSQL
- 인증: Auth.js 또는 Supabase Auth
- DB: PostgreSQL
- 캐시/랭킹: Redis는 트래픽 발생 후 도입
- 스토리지: S3 호환 오브젝트 스토리지

### 배포
- 프론트/서버: Vercel, Cloudflare, Railway 중 비용/운영성 기준 선택
- DB: Supabase/Neon/Postgres 관리형 서비스
- 이미지: CDN 적용

### AI
- 콘텐츠 텍스트: Qwen 계열 또는 비용 효율 API 우선
- 이미지: 상업 이용 조건이 명확한 생성 모델
- TTS: 언어별 비용 비교 후 공급자 추상화
- 공급자별 Adapter 계층을 둬 모델 교체 가능하게 구성

## 8. 추천 API/서비스 경계
- Content Service: 콘텐츠 CRUD/발행
- Voting Service: 투표, 중복 방지, 집계
- Ranking Service: 기간별/카테고리별 순위
- Recommendation Service: 연관 콘텐츠
- AI Content Service: 제목/설명/문항/숏폼 대본
- Media Service: 이미지/OG/영상 재료
- Moderation Service: 신고/금칙어/검토
- Analytics Service: 이벤트 수집

## 9. 기존 V1 → V2 마이그레이션
1. 기존 DB/파일/콘텐츠 구조 백업
2. 콘텐츠와 사용자 데이터 분류
3. 유지/변환/폐기 세 그룹으로 구분
4. slug 매핑표 작성
5. 기존 URL은 가능하면 301 redirect
6. 기존 콘텐츠를 V2 schema로 변환하는 migration script 작성
7. staging에서 샘플 20건 이관
8. 집계 숫자 검증
9. 전체 이관
10. V1 read-only 전환 후 V2 오픈

## 10. 핵심 사용자 흐름
### 비회원
유입 → 콘텐츠 즉시 플레이 → 결과 → 다음 콘텐츠 → 공유

### 회원
플레이 → 로그인 유도 → 내 기록 저장 → 취향 분석 → 재방문

### 관리자
주제 입력 → AI 초안 → 후보 검수 → 발행 → 데이터 확인 → 숏폼 대본 생성 → SNS 게시

## 11. 콘텐츠 자동화 파이프라인
1. 관리자 주제 입력
2. AI가 후보/문구/SEO 키워드 초안 생성
3. 권리 리스크 체크 플래그
4. 이미지 생성/등록
5. 콘텐츠 validation
6. 관리자 승인
7. 웹 발행
8. 최소 표본 도달 시 통계 인사이트 추출
9. 숏폼 대본 생성
10. TTS/자막/클립 제작 큐
11. 운영자가 최종 검수 후 업로드

## 12. 분석 이벤트
page_view, content_impression, play_start, vote, round_complete, tournament_complete, result_view, share_click, related_click, login_start, login_complete, report_submit, affiliate_click

## 13. SEO
- 콘텐츠별 고유 title/description
- slug 기반 정적 URL
- OG 이미지 자동 생성
- sitemap 자동 갱신
- 카테고리/랭킹 랜딩페이지 구축
- 중복 콘텐츠 canonical 처리
- 이미지 alt 자동 초안 + 관리자 검수

## 14. 성능 목표
- 모바일 LCP 2.5초 이하 목표
- 첫 투표 UI는 이미지 지연 로딩에도 동작
- 콘텐츠 목록 무한스크롤 또는 페이지네이션
- 집계값은 비동기/캐시 사용 가능하게 설계

## 15. 보안/악용방지
- IP 자체를 장기 저장하지 않고 해시/단기 rate-limit 용도로 최소화 검토
- session/device 기반 중복투표 완화
- bot/rate limit
- 관리자 권한 분리
- 이미지 업로드 MIME/용량 검증
- UGC 도입 시 신고/차단/삭제 workflow 필수

## 16. 성공 정의
V2 성공은 “사이트가 예뻐짐”이 아니라 다음 세 가지로 판단한다.
1. 콘텐츠 1개 발행에 드는 시간이 크게 줄어든다.
2. 사용자가 한 번 방문해 여러 개 콘텐츠를 연속 소비한다.
3. 사용자 선택 데이터가 자동으로 다음 숏폼/콘텐츠의 재료가 된다.
