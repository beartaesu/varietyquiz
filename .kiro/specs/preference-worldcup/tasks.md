# Implementation Plan: 취향 월드컵 (Preference World Cup)

## Overview

기존 초안 코드(`worldcup-create.tsx`, `worldcup-play.tsx`)를 리팩토링하여 순수 함수를 분리하고, 속성 기반 테스트(PBT)를 작성할 수 있는 구조로 개선한다. 핵심 토너먼트 로직과 데이터 처리 로직을 순수 함수로 추출하여 테스트 가능성을 높이고, fast-check를 활용한 속성 기반 테스트로 정확성을 검증한다.

## Tasks

- [x] 1. 순수 함수 모듈 생성 및 핵심 로직 추출
  - [x] 1.1 `client/src/lib/worldcup-logic.ts` 파일 생성 및 타입 정의
    - `WorldCupItem`, `WorldCupData`, `RankEntry`, `TournamentState` 인터페이스 정의
    - 기존 페이지 컴포넌트에서 인라인으로 정의된 타입을 공유 모듈로 이동
    - _Requirements: 7.2_

  - [x] 1.2 항목 관리 순수 함수 구현
    - `addItem(items, name)`: 중복 검사 포함, 성공 시 새 배열 반환, 실패 시 null 반환
    - `removeItem(items, id)`: 해당 ID 항목 제거한 새 배열 반환
    - `getValidItems(items)`: 이름이 비어있지 않은 항목만 필터링
    - `getRoundOptions(validCount)`: 유효 항목 수에 따라 활성화 가능한 라운드 배열 반환
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 4.2_

  - [x] 1.3 토너먼트 진행 순수 함수 구현
    - `getRoundName(count)`: 라운드 수에 따른 한국어 라운드 이름 반환
    - `initializeRound(items, roundSize)`: 셔플 후 roundSize만큼 선택한 배열 반환
    - `handleSelection(state, selectedId)`: 현재 상태에서 선택 처리 후 새 TournamentState 반환
    - `calculateRankings(entries)`: 탈락 라운드 + 승수 기반 순위 계산
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 6.1, 6.2_

  - [x] 1.4 데이터 직렬화 순수 함수 구현
    - `serializeWorldCupData(data)`: WorldCupData를 JSON 문자열로 변환
    - `deserializeWorldCupData(json)`: JSON 문자열을 WorldCupData로 파싱 (실패 시 null)
    - `validateImageFile(file)`: 파일 타입/크기 유효성 검사 결과 반환
    - _Requirements: 7.1, 7.2, 7.3, 3.3, 3.4_

- [ ]* 1.5 항목 관리 함수 속성 기반 테스트 작성
    - **Property 1: Adding a valid item grows the list**
    - **Property 2: Duplicate items are rejected**
    - **Property 3: Removing an item shrinks the list**
    - **Property 4: Valid item count equals non-empty named items**
    - **Validates: Requirements 1.2, 1.3, 1.5, 1.6**

- [ ]* 1.6 라운드 및 직렬화 함수 속성 기반 테스트 작성
    - **Property 5: Round button availability matches item count**
    - **Property 6: Data serialization round trip**
    - **Property 8: getRoundName mapping correctness**
    - **Validates: Requirements 4.2, 4.3, 5.2, 7.1, 7.2, 7.3**

- [x] 2. 생성 페이지 리팩토링 (`worldcup-create.tsx`)
  - [x] 2.1 공유 타입 및 순수 함수 임포트로 전환
    - 인라인 `WorldCupItem` 인터페이스를 `worldcup-logic.ts`에서 임포트로 교체
    - `addItem`, `removeItem`, `getValidItems`, `getRoundOptions` 함수를 임포트하여 사용
    - 컴포넌트 내부 로직을 순수 함수 호출로 대체
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [x] 2.2 이미지 처리 로직 개선
    - `validateImageFile` 순수 함수를 활용한 파일 유효성 검사
    - 클립보드 붙여넣기 핸들러에서 이미지 타입 판별 로직 유지
    - 이미지 미리보기 및 제거 기능 정상 동작 확인
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.3 월드컵 시작 로직 개선
    - `serializeWorldCupData` 함수를 사용하여 localStorage 저장
    - `getValidItems`로 유효 항목만 필터링하여 저장
    - 제목 빈값 검사, 항목 수 부족 검사 유지
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.3_

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 플레이 페이지 리팩토링 (`worldcup-play.tsx`)
  - [x] 4.1 공유 타입 및 순수 함수 임포트로 전환
    - 인라인 인터페이스를 `worldcup-logic.ts`에서 임포트로 교체
    - `getRoundName`, `initializeRound`, `calculateRankings` 함수를 임포트하여 사용
    - _Requirements: 5.1, 5.2, 6.1, 6.2_

  - [x] 4.2 토너먼트 진행 로직을 순수 함수 기반으로 리팩토링
    - `handleSelection` 순수 함수를 활용하여 상태 전이 처리
    - 컴포넌트 상태를 `TournamentState` 기반으로 단순화
    - 애니메이션 로직은 컴포넌트에 유지 (부수효과)
    - _Requirements: 5.5, 5.6_

  - [x] 4.3 데이터 로드 및 에러 처리 개선
    - `deserializeWorldCupData` 함수를 사용하여 localStorage 데이터 파싱
    - JSON 파싱 실패 시 alert 후 생성 페이지로 리다이렉트
    - 데이터 없음 시 alert 후 생성 페이지로 리다이렉트
    - _Requirements: 5.7, 7.1_

  - [x] 4.4 결과 화면 및 순위 표시 개선
    - `calculateRankings` 순수 함수로 최종 순위 계산
    - 메달 아이콘(🥇🥈🥉) 표시 유지
    - "다시하기", "새로 만들기" 버튼 동작 유지
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ]* 4.5 토너먼트 진행 속성 기반 테스트 작성
    - **Property 7: Tournament initialization produces valid permutation**
    - **Property 9: Tournament round progression preserves winners**
    - **Property 10: Ranking calculation completeness and ordering**
    - **Validates: Requirements 5.1, 5.5, 5.6, 6.1, 6.2**

- [x] 5. 테스트 환경 설정 및 통합 검증
  - [x] 5.1 Vitest + fast-check 테스트 환경 설정
    - `vitest` 및 `fast-check` 패키지 설치 (devDependencies)
    - `vitest.config.ts` 생성 (path alias 설정 포함)
    - `package.json`에 `test` 스크립트 추가
    - _Requirements: (테스트 인프라)_

  - [ ]* 5.2 단위 테스트 작성
    - 이미지 파일 유효성 검사 (타입 체크, 크기 체크) 예제 기반 테스트
    - `getRoundName` 경계값 테스트
    - `deserializeWorldCupData` 잘못된 입력 처리 테스트
    - _Requirements: 3.3, 3.4, 5.2_

- [x] 6. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 기존 초안 코드의 UI/스타일링은 유지하고, 로직만 순수 함수로 분리하는 방향
- 순수 함수 분리가 핵심 목표이므로 UI 변경은 최소화
- Property tests validate universal correctness properties using fast-check
- Vitest는 Vite 프로젝트에 최적화된 테스트 러너
- 모든 속성 기반 테스트는 최소 100회 반복 실행
