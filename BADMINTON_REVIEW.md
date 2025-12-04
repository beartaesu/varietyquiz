# 🏸 배드민턴 대진표 프로그램 리뷰

## 📊 전체 평가

**현재 상태**: 기능적으로 잘 작동하는 복잡한 매칭 알고리즘
**코드 품질**: 양호 (1293줄)
**개선 필요도**: 중간 (몇 가지 버그와 UX 개선 필요)

---

## 🐛 발견된 문제점

### 1. 심각한 버그 🔴

#### 1-1. 미참여 횟수 계산 오류
**위치**: `getPlayerExcludedCount` 함수
**문제**: 현재 게임 구성에서 제외된 플레이어의 미참여 횟수가 실시간으로 반영되지 않음

```typescript
// 현재 코드 (문제)
const getPlayerExcludedCount = (playerName: string): number => {
  let excludedCount = 0;
  history.forEach(entry => {
    if (entry.excludedPlayers && entry.excludedPlayers.some(p => p.name === playerName)) {
      excludedCount++;
    }
  });
  return excludedCount;
};
```

**문제점**: 
- `history`에 저장된 기록만 확인
- 현재 게임 구성의 미참여는 포함되지 않음
- "기록 저장" 버튼을 누르기 전까지는 미참여 횟수가 0으로 표시됨

**해결 방법**:
```typescript
const getPlayerExcludedCount = (playerName: string): number => {
  let excludedCount = 0;
  
  // 히스토리에서 미참여 횟수 계산
  history.forEach(entry => {
    if (entry.excludedPlayers && entry.excludedPlayers.some(p => p.name === playerName)) {
      excludedCount++;
    }
  });
  
  // 현재 게임 구성에서도 제외되었는지 확인
  if (games.length > 0) {
    const participatingPlayerIds = new Set<number>();
    games.forEach(game => {
      [...game.team1.players, ...game.team2.players].forEach(p => {
        participatingPlayerIds.add(p.id);
      });
    });
    
    const player = players.find(p => p.name === playerName);
    if (player && !participatingPlayerIds.has(player.id) && !player.isResting) {
      excludedCount++;
    }
  }
  
  return excludedCount;
};
```

---

#### 1-2. 제외 횟수 추적 중복 문제
**위치**: `generateTeams` 함수 끝부분
**문제**: `playerExclusionCount`와 `history`에서 중복으로 미참여 횟수를 추적

```typescript
// 현재 코드에서 두 가지 방식으로 추적
// 1. playerExclusionCount (state)
// 2. history의 excludedPlayers

// 문제: 두 데이터가 동기화되지 않을 수 있음
```

**해결 방법**: 하나의 소스만 사용하도록 통일

---

### 2. 중간 버그 🟡

#### 2-1. 혼복 모드에서 남녀 비율 불균형 처리 미흡
**위치**: `createMixedTeams` 함수
**문제**: 남성 10명, 여성 2명인 경우 2팀만 혼복으로 구성되고 나머지 8명은 남복으로 구성됨

**현재 동작**:
- 남성 10명, 여성 2명
- 혼복 2팀 (남2, 여2)
- 남복 4팀 (남8)

**개선 방안**:
- 사용자에게 경고 메시지 표시
- 또는 자동으로 "성별 무관" 모드로 전환 제안

---

#### 2-2. 코트 수 제한 시 미참여자 선택 로직 개선 필요
**위치**: `generateTeams` 함수의 미참여자 선택 부분
**문제**: 미참여 횟수가 같은 사람들 중에서 랜덤 선택

**개선 방안**:
- 최근 게임 참여 여부 고려
- 연속 미참여 방지
- 실력 분산 고려 (고수들만 제외되지 않도록)

---

### 3. UX 개선 필요 🟢

#### 3-1. 게임 구성 전 검증 부족
**문제**: 혼복 모드인데 남성 또는 여성이 없는 경우 에러 메시지 없음

**개선**:
```typescript
if (gameType === "mixed") {
  const males = activePlayers.filter(p => p.gender === "male");
  const females = activePlayers.filter(p => p.gender === "female");
  
  if (males.length === 0 || females.length === 0) {
    alert("혼복 모드는 남성과 여성이 각각 최소 1명 이상 필요합니다.");
    return;
  }
  
  if (males.length < 2 || females.length < 2) {
    if (!confirm("남성 또는 여성이 부족하여 일부 팀은 혼복이 아닐 수 있습니다. 계속하시겠습니까?")) {
      return;
    }
  }
}
```

---

#### 3-2. 미참여자 정보 표시 개선
**현재**: "미참여 0회" (저장 전)
**개선**: "미참여 0회 (이번 게임 포함 1회)"

---

#### 3-3. 실력 균형 표시 개선
**현재**: "실력차: 0.5"
**개선**: 
- "실력차: 0.5 (매우 균형)"
- "실력차: 1.5 (균형)"
- "실력차: 2.5 (불균형)"

---

### 4. 성능 이슈 ⚡

#### 4-1. 로컬 스토리지 과다 사용
**문제**: 매 상태 변경마다 로컬 스토리지에 저장

```typescript
// 6개의 useEffect가 각각 로컬 스토리지에 저장
useEffect(() => {
  localStorage.setItem("badminton_players", JSON.stringify(players));
}, [players]);
```

**개선**: 디바운싱 적용
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem("badminton_players", JSON.stringify(players));
  }, 500); // 500ms 디바운스
  
  return () => clearTimeout(timer);
}, [players]);
```

---

## ✅ 잘된 점

1. **복잡한 매칭 알고리즘**: 실력, 성별, 히스토리를 모두 고려한 정교한 로직
2. **로컬 스토리지 활용**: 데이터 영속성 확보
3. **다양한 옵션**: 혼복/남복/여복, 실력 고려/무시 등
4. **히스토리 관리**: 과거 게임 기록 저장 및 조회
5. **코트 수 제한**: 실제 사용 환경 고려
6. **휴식 기능**: 참가자 관리 편의성

---

## 🔧 권장 수정사항

### 우선순위 1 (필수)

1. **미참여 횟수 계산 버그 수정**
2. **혼복 모드 검증 추가**
3. **에러 메시지 개선**

### 우선순위 2 (권장)

4. **로컬 스토리지 디바운싱**
5. **실력 균형 표시 개선**
6. **미참여자 정보 표시 개선**

### 우선순위 3 (선택)

7. **코드 리팩토링** (함수 분리, 파일 분리)
8. **테스트 코드 추가**
9. **애니메이션 추가**

---

## 📝 수정 파일 생성

다음 명령으로 수정된 파일을 생성하시겠습니까?

1. **버그 수정만** (우선순위 1)
2. **버그 + UX 개선** (우선순위 1+2)
3. **전체 개선** (우선순위 1+2+3)

어떤 수정을 원하시나요?
