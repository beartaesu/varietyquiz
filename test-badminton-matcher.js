// 배드민턴 매칭 알고리즘 테스트 시뮬레이션
// 사용법: node test-badminton-matcher.js

// 매칭 빈도 추적
const matchFrequency = {};
const playerExclusionCount = {};

// 매칭 키 생성
function getMatchKey(name1, name2) {
  return [name1, name2].sort().join("-");
}

// 매칭 횟수 증가
function incrementMatchCount(name1, name2) {
  const key = getMatchKey(name1, name2);
  matchFrequency[key] = (matchFrequency[key] || 0) + 1;
}

// 매칭 횟수 조회
function getMatchCount(name1, name2) {
  return matchFrequency[getMatchKey(name1, name2)] || 0;
}

// 팀 생성 (중복 매칭 방지 로직 포함)
function createTeamsFromPlayers(players) {
  const teams = [];
  const used = new Set();
  
  // 3번 랜덤 셔플
  let shuffled = [...players];
  for (let i = 0; i < 3; i++) {
    shuffled = shuffled.sort(() => Math.random() - 0.5);
  }
  
  // 중복 매칭 방지: 이전에 함께 게임한 적이 적은 플레이어끼리 우선 매칭
  for (let i = 0; i < shuffled.length; i++) {
    if (used.has(i)) continue;
    
    const player1 = shuffled[i];
    let bestPartnerIndex = -1;
    let lowestMatchCount = Infinity;
    
    // player1과 가장 적게 매칭된 플레이어 찾기
    for (let j = i + 1; j < shuffled.length; j++) {
      if (used.has(j)) continue;
      
      const player2 = shuffled[j];
      const matchCount = getMatchCount(player1, player2);
      
      // 새로운 매칭에 3배 가중치 부여
      const adjustedCount = matchCount === 0 ? -3 : matchCount;
      
      if (adjustedCount < lowestMatchCount) {
        lowestMatchCount = adjustedCount;
        bestPartnerIndex = j;
      }
    }
    
    if (bestPartnerIndex !== -1) {
      teams.push({
        players: [player1, shuffled[bestPartnerIndex]]
      });
      used.add(i);
      used.add(bestPartnerIndex);
    }
  }
  
  return teams;
}

// 게임 생성
function generateGames(players, courtCount) {
  // 5번 랜덤 셔플
  let shuffled = [...players];
  for (let i = 0; i < 5; i++) {
    shuffled = shuffled.sort(() => Math.random() - 0.5);
  }
  
  // 코트 수에 맞춰 참가자 제한
  const maxParticipants = courtCount * 4;
  const excludeCount = players.length - maxParticipants;
  
  // 제외할 플레이어 선택 (공평하게)
  let excludedPlayers = [];
  if (excludeCount > 0) {
    const groupedByCount = {};
    shuffled.forEach(p => {
      const count = playerExclusionCount[p] || 0;
      if (!groupedByCount[count]) {
        groupedByCount[count] = [];
      }
      groupedByCount[count].push(p);
    });
    
    const sortedCounts = Object.keys(groupedByCount).map(Number).sort((a, b) => a - b);
    
    for (const count of sortedCounts) {
      if (excludedPlayers.length >= excludeCount) break;
      
      const candidates = groupedByCount[count];
      let candidatesShuffled = [...candidates];
      for (let i = 0; i < 3; i++) {
        candidatesShuffled = candidatesShuffled.sort(() => Math.random() - 0.5);
      }
      
      const needed = excludeCount - excludedPlayers.length;
      excludedPlayers.push(...candidatesShuffled.slice(0, needed));
    }
  }
  
  // 제외 횟수 증가
  excludedPlayers.forEach(p => {
    playerExclusionCount[p] = (playerExclusionCount[p] || 0) + 1;
  });
  
  // 참여 플레이어
  const excludedSet = new Set(excludedPlayers);
  const availablePlayers = shuffled.filter(p => !excludedSet.has(p));
  
  // 팀 생성
  const teams = createTeamsFromPlayers(availablePlayers);
  
  // 게임 생성 (2팀씩 매칭)
  const games = [];
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      games.push({
        team1: teams[i],
        team2: teams[i + 1]
      });
    }
  }
  
  return { games, excludedPlayers };
}

// 기록 저장 (매칭 빈도 업데이트)
function saveRecord(games) {
  games.forEach(game => {
    const allPlayers = [...game.team1.players, ...game.team2.players];
    
    // 같은 게임에 참여한 모든 플레이어 쌍의 매칭 횟수 증가
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        incrementMatchCount(allPlayers[i], allPlayers[j]);
      }
    }
  });
}

// 시뮬레이션 실행
function runSimulation(playerCount, courtCount, rounds) {
  console.log("=".repeat(60));
  console.log(`🏸 배드민턴 매칭 시뮬레이션`);
  console.log(`참가자: ${playerCount}명 (1~${playerCount})`);
  console.log(`코트 수: ${courtCount}개`);
  console.log(`시뮬레이션 횟수: ${rounds}회`);
  console.log("=".repeat(60));
  console.log("");
  
  // 플레이어 생성
  const players = [];
  for (let i = 1; i <= playerCount; i++) {
    players.push(`${i}`);
  }
  
  // 라운드 실행
  for (let round = 1; round <= rounds; round++) {
    console.log(`\n📍 라운드 ${round}`);
    
    const { games, excludedPlayers } = generateGames(players, courtCount);
    
    console.log(`  휴식: ${excludedPlayers.length > 0 ? excludedPlayers.join(", ") : "없음"}`);
    
    games.forEach((game, idx) => {
      const team1 = game.team1.players.join(", ");
      const team2 = game.team2.players.join(", ");
      console.log(`  코트 ${idx + 1}: [${team1}] vs [${team2}]`);
    });
    
    // ⭐ 중요: 기록 저장 (매칭 빈도 업데이트)
    saveRecord(games);
  }
  
  // 결과 분석
  console.log("\n" + "=".repeat(60));
  console.log("📊 매칭 빈도 분석");
  console.log("=".repeat(60));
  
  // 모든 매칭 쌍의 빈도 수집
  const frequencies = [];
  for (let i = 1; i <= playerCount; i++) {
    for (let j = i + 1; j <= playerCount; j++) {
      const count = getMatchCount(`${i}`, `${j}`);
      frequencies.push({
        pair: `${i}-${j}`,
        count: count
      });
    }
  }
  
  // 빈도별로 정렬
  frequencies.sort((a, b) => b.count - a.count);
  
  // 통계
  const counts = frequencies.map(f => f.count);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const zero = counts.filter(c => c === 0).length;
  
  console.log(`\n📈 통계:`);
  console.log(`  최대 매칭 횟수: ${max}회`);
  console.log(`  최소 매칭 횟수: ${min}회`);
  console.log(`  평균 매칭 횟수: ${avg.toFixed(2)}회`);
  console.log(`  한 번도 매칭 안 된 쌍: ${zero}개`);
  
  // 상위 10개 (가장 많이 매칭된 쌍)
  console.log(`\n🔥 가장 많이 매칭된 쌍 (Top 10):`);
  frequencies.slice(0, 10).forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.pair}: ${f.count}회`);
  });
  
  // 하위 10개 (가장 적게 매칭된 쌍)
  console.log(`\n❄️  가장 적게 매칭된 쌍 (Bottom 10):`);
  frequencies.slice(-10).reverse().forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.pair}: ${f.count}회`);
  });
  
  // 휴식 횟수
  console.log(`\n😴 휴식 횟수:`);
  players.forEach(p => {
    const count = playerExclusionCount[p] || 0;
    console.log(`  ${p}: ${count}회`);
  });
  
  console.log("\n" + "=".repeat(60));
}

// 실행
runSimulation(12, 3, 20);
