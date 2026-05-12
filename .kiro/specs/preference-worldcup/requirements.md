# Requirements Document

## Introduction

취향 월드컵은 사용자가 직접 토너먼트 형식의 월드컵을 만들고 플레이할 수 있는 기능이다. 이상형 월드컵처럼 두 개의 항목 중 하나를 선택하는 방식으로 진행되며, 최종 결과로 전체 순위를 보여준다. 사용자는 항목에 이미지를 붙여넣기(Ctrl+V) 또는 파일 선택으로 추가할 수 있고, 8강/16강/32강/64강 중 원하는 라운드를 선택하여 플레이할 수 있다. 모든 데이터는 localStorage에 저장되어 서버 없이 동작한다.

## Glossary

- **World_Cup_Creator**: 사용자가 월드컵을 생성하는 페이지 컴포넌트 (경로: /bracket/worldcup)
- **World_Cup_Player**: 월드컵을 플레이하는 페이지 컴포넌트 (경로: /bracket/worldcup/play)
- **World_Cup_Item**: 월드컵에 참가하는 개별 항목 (이름과 선택적 이미지로 구성)
- **World_Cup_Data**: 월드컵의 전체 데이터 (제목, 항목 목록, 라운드 수, 생성일시)
- **Round**: 토너먼트 단계 (8강, 16강, 32강, 64강)
- **Match**: 두 항목이 대결하는 단일 경기
- **Image_Handler**: 이미지 붙여넣기 및 파일 선택을 처리하는 로직
- **Ranking_Calculator**: 최종 순위를 계산하는 로직
- **Local_Storage**: 브라우저의 localStorage를 사용한 데이터 저장소

## Requirements

### Requirement 1: 월드컵 생성

**User Story:** As a 사용자, I want 나만의 취향 월드컵을 만들 수 있기를, so that 내 취향에 맞는 토너먼트를 진행할 수 있다.

#### Acceptance Criteria

1. THE World_Cup_Creator SHALL 월드컵 제목 입력 필드를 제공한다 (최대 50자)
2. WHEN 사용자가 항목 이름을 입력하고 추가 버튼을 클릭하거나 Enter 키를 누르면, THE World_Cup_Creator SHALL 해당 항목을 목록에 추가한다
3. WHEN 사용자가 이미 존재하는 항목 이름을 추가하려 하면, THE World_Cup_Creator SHALL 중복 알림을 표시하고 항목을 추가하지 않는다
4. THE World_Cup_Creator SHALL 각 항목에 대해 이름 수정 기능을 제공한다
5. WHEN 사용자가 항목의 삭제 버튼을 클릭하면, THE World_Cup_Creator SHALL 해당 항목을 목록에서 제거한다
6. THE World_Cup_Creator SHALL 현재 유효한 항목 수(이름이 비어있지 않은 항목)를 표시한다

### Requirement 2: 이미지 붙여넣기 추가

**User Story:** As a 사용자, I want 텍스트 입력란에 이미지를 Ctrl+V로 붙여넣어 항목에 이미지를 추가할 수 있기를, so that 빠르고 편리하게 이미지를 등록할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 새 항목 입력란에 클립보드의 이미지를 붙여넣으면, THE Image_Handler SHALL 해당 이미지를 base64로 변환하여 새 항목으로 추가한다
2. WHEN 사용자가 기존 항목의 이름 입력란에 클립보드의 이미지를 붙여넣으면, THE Image_Handler SHALL 해당 이미지를 base64로 변환하여 해당 항목의 이미지로 설정한다
3. WHEN 붙여넣기된 데이터가 이미지 타입이 아닌 경우, THE Image_Handler SHALL 기본 텍스트 붙여넣기 동작을 수행한다

### Requirement 3: 파일 선택으로 이미지 추가

**User Story:** As a 사용자, I want 파일 선택 버튼으로도 이미지를 추가할 수 있기를, so that 로컬 파일에서 이미지를 선택하여 등록할 수 있다.

#### Acceptance Criteria

1. THE World_Cup_Creator SHALL 각 항목에 이미지 파일 선택 영역을 제공한다
2. WHEN 사용자가 이미지 파일을 선택하면, THE Image_Handler SHALL 해당 파일을 base64로 변환하여 항목의 이미지로 설정한다
3. WHEN 사용자가 이미지가 아닌 파일을 선택하면, THE Image_Handler SHALL "이미지 파일만 업로드 가능합니다" 알림을 표시한다
4. WHEN 사용자가 5MB를 초과하는 파일을 선택하면, THE Image_Handler SHALL "5MB 이하의 이미지만 업로드 가능합니다" 알림을 표시한다
5. WHEN 항목에 이미지가 이미 설정되어 있을 때, THE World_Cup_Creator SHALL 이미지 미리보기와 이미지 제거 버튼을 표시한다

### Requirement 4: 라운드 선택 및 월드컵 시작

**User Story:** As a 사용자, I want 8강, 16강, 32강, 64강 중 원하는 라운드를 선택하여 월드컵을 시작할 수 있기를, so that 항목 수에 맞는 적절한 규모의 토너먼트를 진행할 수 있다.

#### Acceptance Criteria

1. THE World_Cup_Creator SHALL 8강, 16강, 32강, 64강 시작 버튼을 표시한다
2. WHILE 유효한 항목 수가 해당 라운드 수보다 적은 경우, THE World_Cup_Creator SHALL 해당 라운드 버튼을 비활성화 상태로 표시한다
3. WHEN 사용자가 라운드 버튼을 클릭하면, THE World_Cup_Creator SHALL 월드컵 데이터를 localStorage에 저장하고 플레이 페이지로 이동한다
4. IF 월드컵 제목이 비어있는 상태에서 시작 버튼을 클릭하면, THEN THE World_Cup_Creator SHALL "월드컵 제목을 입력해주세요" 알림을 표시한다
5. IF 유효한 항목 수가 선택한 라운드 수보다 적은 상태에서 시작을 시도하면, THEN THE World_Cup_Creator SHALL 필요한 항목 수와 현재 항목 수를 포함한 알림을 표시한다

### Requirement 5: 월드컵 플레이

**User Story:** As a 사용자, I want 두 항목 중 하나를 선택하며 토너먼트를 진행할 수 있기를, so that 나의 취향 순위를 결정할 수 있다.

#### Acceptance Criteria

1. WHEN 플레이 페이지가 로드되면, THE World_Cup_Player SHALL localStorage에서 월드컵 데이터를 불러와 항목을 랜덤으로 섞은 후 첫 번째 매치를 표시한다
2. THE World_Cup_Player SHALL 현재 라운드 이름(예: 16강, 8강, 4강, 결승)을 표시한다
3. THE World_Cup_Player SHALL 현재 라운드 내 매치 진행 상황(예: 1/8)을 표시한다
4. THE World_Cup_Player SHALL 전체 진행률을 프로그레스 바로 표시한다
5. WHEN 사용자가 한 항목을 선택하면, THE World_Cup_Player SHALL 선택된 항목에 강조 애니메이션을 적용하고 탈락 항목을 흐리게 표시한 후 다음 매치로 진행한다
6. WHEN 현재 라운드의 모든 매치가 완료되면, THE World_Cup_Player SHALL 승리한 항목들로 다음 라운드를 구성한다
7. IF localStorage에 월드컵 데이터가 없는 상태에서 플레이 페이지에 접근하면, THEN THE World_Cup_Player SHALL 알림을 표시하고 생성 페이지로 리다이렉트한다

### Requirement 6: 결과 및 순위 표시

**User Story:** As a 사용자, I want 월드컵 완료 후 전체 순위를 확인할 수 있기를, so that 나의 취향 순위를 한눈에 볼 수 있다.

#### Acceptance Criteria

1. WHEN 결승전이 완료되면, THE Ranking_Calculator SHALL 우승자를 포함한 전체 순위를 계산한다
2. THE Ranking_Calculator SHALL 탈락 라운드가 높은 항목을 상위로, 같은 라운드에서 탈락한 항목은 승수가 많은 항목을 상위로 정렬한다
3. THE World_Cup_Player SHALL 우승자를 이미지(있는 경우)와 이름으로 강조 표시한다
4. THE World_Cup_Player SHALL 전체 순위를 순위, 이미지 썸네일(있는 경우), 이름, 탈락 라운드, 승수와 함께 스크롤 가능한 목록으로 표시한다
5. THE World_Cup_Player SHALL 1위에 금메달(🥇), 2위에 은메달(🥈), 3위에 동메달(🥉) 아이콘을 표시한다
6. THE World_Cup_Player SHALL "다시하기" 버튼과 "새로 만들기" 버튼을 제공한다
7. WHEN 사용자가 "다시하기" 버튼을 클릭하면, THE World_Cup_Player SHALL 같은 월드컵 데이터로 새로운 게임을 시작한다
8. WHEN 사용자가 "새로 만들기" 버튼을 클릭하면, THE World_Cup_Player SHALL 생성 페이지로 이동한다

### Requirement 7: 데이터 저장

**User Story:** As a 사용자, I want 월드컵 데이터가 브라우저에 저장되기를, so that 서버 없이도 월드컵을 만들고 플레이할 수 있다.

#### Acceptance Criteria

1. THE World_Cup_Creator SHALL 월드컵 시작 시 World_Cup_Data를 localStorage의 "worldcup_current" 키에 JSON 형식으로 저장한다
2. THE World_Cup_Data SHALL 제목(title), 항목 목록(items), 라운드 수(round), 생성일시(createdAt) 필드를 포함한다
3. WHEN World_Cup_Data를 저장할 때, THE World_Cup_Creator SHALL 이름이 비어있는 항목을 제외하고 유효한 항목만 저장한다

### Requirement 8: 네비게이션 및 접근성

**User Story:** As a 사용자, I want 대진표 카테고리 페이지에서 취향 월드컵에 접근할 수 있기를, so that 쉽게 기능을 찾아 사용할 수 있다.

#### Acceptance Criteria

1. THE World_Cup_Creator SHALL /bracket/worldcup 경로에서 접근 가능하다
2. THE World_Cup_Player SHALL /bracket/worldcup/play 경로에서 접근 가능하다
3. THE World_Cup_Creator SHALL 대진표 카테고리 페이지(/bracket)로 돌아가는 뒤로가기 버튼을 제공한다
4. WHEN 항목에 이미지가 없는 경우, THE World_Cup_Player SHALL 기본 플레이스홀더 아이콘을 표시한다
