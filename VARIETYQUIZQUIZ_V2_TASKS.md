# varietyquizquiz V2 TASKS

## EPIC 00 - Audit & Migration
- [ ] T0001 기존 V1 코드/DB/스토리지 백업
- [ ] T0002 현재 기능·URL·데이터 구조 목록화
- [ ] T0003 유지/폐기/변환 데이터 분류표 작성
- [ ] T0004 V1 → V2 schema mapping 문서 작성
- [ ] T0005 migration dry-run 스크립트 작성
- [ ] T0006 기존 URL redirect 목록 작성

## EPIC 01 - Foundation
- [ ] T0101 Next.js + TypeScript 프로젝트 초기화
- [ ] T0102 환경변수/secret 규칙 정의
- [ ] T0103 PostgreSQL schema 및 migration 구성
- [ ] T0104 공통 UI layout 구축
- [ ] T0105 로깅/에러 핸들링 구성
- [ ] T0106 CI 빌드/테스트 구성

## EPIC 02 - Content Core
- [ ] T0201 content/category/tag CRUD
- [ ] T0202 option CRUD 및 일괄 업로드
- [ ] T0203 slug 생성 및 중복 검증
- [ ] T0204 발행/예약/비공개 상태
- [ ] T0205 이미지 업로드/썸네일 처리

## EPIC 03 - VS Engine
- [ ] T0301 VS 플레이 화면
- [ ] T0302 vote API
- [ ] T0303 중복투표 완화 로직
- [ ] T0304 실시간/지연 집계 전략
- [ ] T0305 결과 화면
- [ ] T0306 다음 VS 추천

## EPIC 04 - World Cup Engine
- [ ] T0401 8/16/32/64강 bracket 생성기
- [ ] T0402 seed/random 순서 정책
- [ ] T0403 라운드 진행 상태 관리
- [ ] T0404 결승 결과 생성
- [ ] T0405 후보별 승률/우승률 집계
- [ ] T0406 중도 이탈 후 재개 정책

## EPIC 05 - Discovery
- [ ] T0501 홈 피드
- [ ] T0502 카테고리 페이지
- [ ] T0503 검색
- [ ] T0504 인기/급상승 랭킹
- [ ] T0505 관련 콘텐츠 추천

## EPIC 06 - Share & SEO
- [ ] T0601 콘텐츠 meta 생성
- [ ] T0602 OG 이미지 생성
- [ ] T0603 결과 공유 카드
- [ ] T0604 sitemap/robots/canonical
- [ ] T0605 legacy URL redirect

## EPIC 07 - Admin CMS
- [ ] T0701 관리자 인증/권한
- [ ] T0702 콘텐츠 편집기
- [ ] T0703 후보 drag/drop 정렬
- [ ] T0704 CSV/JSON bulk import
- [ ] T0705 예약 발행
- [ ] T0706 신고 관리
- [ ] T0707 KPI 요약

## EPIC 08 - Analytics
- [ ] T0801 이벤트 스키마 정의
- [ ] T0802 page_view/play_start/vote 수집
- [ ] T0803 funnel dashboard
- [ ] T0804 콘텐츠별 CTR/완주율
- [ ] T0805 재방문/세션 분석

## EPIC 09 - AI Content Pipeline
- [ ] T0901 AI provider adapter interface
- [ ] T0902 제목/설명 초안 생성
- [ ] T0903 후보 목록 초안 생성
- [ ] T0904 SEO 키워드 초안
- [ ] T0905 숏폼 hook/대본 생성
- [ ] T0906 prompt versioning
- [ ] T0907 generation cost logging
- [ ] T0908 관리자 승인 workflow

## EPIC 10 - Moderation & Rights
- [ ] T1001 신고 사유 정의
- [ ] T1002 금칙어/민감주제 필터
- [ ] T1003 이미지 권리 출처 필드
- [ ] T1004 콘텐츠별 권리 검토 상태
- [ ] T1005 삭제/비공개 audit log

## EPIC 11 - Test Module (P1)
- [ ] T1101 점수형 테스트 engine
- [ ] T1102 분기형 테스트 engine
- [ ] T1103 결과 template
- [ ] T1104 공유 결과 카드

## EPIC 12 - User Account (P1)
- [ ] T1201 OAuth 로그인
- [ ] T1202 내 플레이 기록
- [ ] T1203 즐겨찾기
- [ ] T1204 친구 결과 비교

## EPIC 13 - Simulation (P2)
- [ ] T1301 simulation schema
- [ ] T1302 rule-based engine MVP
- [ ] T1303 AI narration layer
- [ ] T1304 결과 replay/share

## EPIC 14 - Monetization
- [ ] T1401 광고 placement 정책
- [ ] T1402 affiliate click tracking
- [ ] T1403 sponsored content flag
- [ ] T1404 campaign landing template

## 공통 완료 조건 Definition of Done
- 기능 요구사항 충족
- 모바일 360px 이상에서 UI 정상
- 로딩/에러/빈 상태 구현
- 최소 단위 테스트 또는 통합 테스트 추가
- 이벤트 로그 필요 시 연결
- 관리자/사용자 권한 검증
- 접근성 기본 점검
- 운영 문서 업데이트
- staging 검증 후 merge

## 신규 기능 추가용 TASK 생성 규칙
새 기능을 추가할 때 아래 순서로 TASK를 자동 생성한다.
1. 사용자 목표 1문장
2. 사용자 플로우
3. 데이터 모델 변경
4. API 변경
5. UI 변경
6. 관리자 기능
7. 분석 이벤트
8. 권한/보안
9. 실패/빈 상태
10. 테스트
11. 마이그레이션/호환성
12. 배포/롤백

템플릿:
- [ ] FXXXX-01 요구사항/Acceptance Criteria
- [ ] FXXXX-02 DB/schema
- [ ] FXXXX-03 backend/API
- [ ] FXXXX-04 frontend/UI
- [ ] FXXXX-05 admin/ops
- [ ] FXXXX-06 analytics
- [ ] FXXXX-07 security/moderation
- [ ] FXXXX-08 tests
- [ ] FXXXX-09 migration
- [ ] FXXXX-10 docs/release
