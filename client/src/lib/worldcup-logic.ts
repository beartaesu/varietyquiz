// ============================================================
// 취향 월드컵 (Preference World Cup) - Pure Logic Module
// ============================================================

// --- Type Definitions (Task 1.1) ---

export interface WorldCupItem {
  id: number;
  name: string;
  imageUrl: string;
}

export interface WorldCupData {
  title: string;
  items: WorldCupItem[];
  round: number;
  createdAt: string;
}

export interface RankEntry {
  item: WorldCupItem;
  rank: number;
  eliminatedRound: string;
  wins: number;
}

export interface TournamentState {
  currentRound: WorldCupItem[];
  nextRound: WorldCupItem[];
  currentPair: [WorldCupItem, WorldCupItem] | null;
  matchIndex: number;
  currentMatchInRound: number;
  roundName: string;
  isFinished: boolean;
  winner: WorldCupItem | null;
  rankings: RankEntry[];
  winCounts: Record<number, number>;
}

// --- Item Management Pure Functions (Task 1.2) ---

/**
 * 항목 추가 (중복 검사 포함)
 * 성공 시 새 배열 반환, 중복이거나 빈 이름이면 null 반환
 */
export function addItem(items: WorldCupItem[], name: string): WorldCupItem[] | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const isDuplicate = items.some((item) => item.name === trimmed);
  if (isDuplicate) return null;

  const newItem: WorldCupItem = {
    id: Date.now() + Math.random(),
    name: trimmed,
    imageUrl: "",
  };

  return [...items, newItem];
}

/**
 * 항목 제거 - 해당 ID의 항목을 제거한 새 배열 반환
 */
export function removeItem(items: WorldCupItem[], id: number): WorldCupItem[] {
  return items.filter((item) => item.id !== id);
}

/**
 * 유효한 항목 필터링 - 이름이 비어있지 않은 항목만 반환
 */
export function getValidItems(items: WorldCupItem[]): WorldCupItem[] {
  return items.filter((item) => item.name.trim() !== "");
}

/**
 * 유효 항목 수에 따라 활성화 가능한 라운드 배열 반환
 */
export function getRoundOptions(validCount: number): number[] {
  const options: number[] = [];
  if (validCount >= 8) options.push(8);
  if (validCount >= 16) options.push(16);
  if (validCount >= 32) options.push(32);
  if (validCount >= 64) options.push(64);
  return options;
}

// --- Tournament Pure Functions (Task 1.3) ---

/**
 * 라운드 수에 따른 한국어 라운드 이름 반환
 */
export function getRoundName(count: number): string {
  if (count === 2) return "결승";
  if (count === 4) return "4강";
  if (count === 8) return "8강";
  if (count === 16) return "16강";
  if (count === 32) return "32강";
  if (count === 64) return "64강";
  return `${count}강`;
}

/**
 * 셔플 후 roundSize만큼 선택한 배열 반환
 * Fisher-Yates 셔플 알고리즘 사용
 */
export function initializeRound(items: WorldCupItem[], roundSize: number): WorldCupItem[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, roundSize);
}

/**
 * 현재 상태에서 선택 처리 후 새 TournamentState 반환
 */
export function handleSelection(
  state: TournamentState,
  selectedId: number
): TournamentState {
  const { currentRound, nextRound, currentPair, matchIndex, currentMatchInRound, winCounts, rankings } = state;

  if (!currentPair) return state;

  const selected = currentPair[0].id === selectedId ? currentPair[0] : currentPair[1];
  const loser = currentPair[0].id === selectedId ? currentPair[1] : currentPair[0];

  // 승리 횟수 업데이트
  const newWinCounts = { ...winCounts };
  newWinCounts[selected.id] = (newWinCounts[selected.id] || 0) + 1;

  // 탈락자 기록
  const roundName = getRoundName(currentRound.length);
  const newRankings = [...rankings, {
    item: loser,
    rank: 0,
    eliminatedRound: roundName,
    wins: newWinCounts[loser.id] || 0,
  }];

  const newNextRound = [...nextRound, selected];
  const pairIndex = (currentMatchInRound + 1) * 2;

  if (pairIndex < currentRound.length) {
    // 같은 라운드에서 다음 매치
    return {
      currentRound,
      nextRound: newNextRound,
      currentPair: [currentRound[pairIndex], currentRound[pairIndex + 1]],
      matchIndex: matchIndex + 1,
      currentMatchInRound: currentMatchInRound + 1,
      roundName,
      isFinished: false,
      winner: null,
      rankings: newRankings,
      winCounts: newWinCounts,
    };
  }

  // 라운드 종료
  if (newNextRound.length === 1) {
    // 최종 우승자
    const finalRankings = [...newRankings, {
      item: newNextRound[0],
      rank: 1,
      eliminatedRound: "우승",
      wins: newWinCounts[newNextRound[0].id] || 0,
    }];

    const sortedRankings = calculateRankings(finalRankings);

    return {
      currentRound,
      nextRound: newNextRound,
      currentPair: null,
      matchIndex: matchIndex + 1,
      currentMatchInRound: currentMatchInRound + 1,
      roundName,
      isFinished: true,
      winner: newNextRound[0],
      rankings: sortedRankings,
      winCounts: newWinCounts,
    };
  }

  // 다음 라운드로
  const nextRoundName = getRoundName(newNextRound.length);
  return {
    currentRound: newNextRound,
    nextRound: [],
    currentPair: [newNextRound[0], newNextRound[1]],
    matchIndex: matchIndex + 1,
    currentMatchInRound: 0,
    roundName: nextRoundName,
    isFinished: false,
    winner: null,
    rankings: newRankings,
    winCounts: newWinCounts,
  };
}

/**
 * 탈락 라운드 + 승수 기반 순위 계산
 * 탈락 라운드가 높은(나중에 탈락한) 항목이 상위, 같은 라운드면 승수가 많은 항목이 상위
 */
export function calculateRankings(entries: RankEntry[]): RankEntry[] {
  const roundOrder: Record<string, number> = {
    "우승": 100,
    "결승": 90,
    "4강": 80,
    "8강": 70,
    "16강": 60,
    "32강": 50,
    "64강": 40,
  };

  const sorted = [...entries].sort((a, b) => {
    const roundDiff = (roundOrder[b.eliminatedRound] || 0) - (roundOrder[a.eliminatedRound] || 0);
    if (roundDiff !== 0) return roundDiff;
    return b.wins - a.wins;
  });

  return sorted.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

// --- Serialization Pure Functions (Task 1.4) ---

/**
 * WorldCupData를 JSON 문자열로 변환 (유효한 항목만 포함)
 */
export function serializeWorldCupData(data: WorldCupData): string {
  const validItems = getValidItems(data.items);
  const serializable: WorldCupData = {
    ...data,
    items: validItems,
  };
  return JSON.stringify(serializable);
}

/**
 * JSON 문자열을 WorldCupData로 파싱 (실패 시 null)
 */
export function deserializeWorldCupData(json: string): WorldCupData | null {
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed.title !== "string" ||
      !Array.isArray(parsed.items) ||
      typeof parsed.round !== "number" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }
    return parsed as WorldCupData;
  } catch {
    return null;
  }
}

/**
 * 파일 타입/크기 유효성 검사 결과 반환
 */
export function validateImageFile(file: { type: string; size: number }): { valid: boolean; error?: string } {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "이미지 파일만 업로드 가능합니다." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "5MB 이하의 이미지만 업로드 가능합니다." };
  }
  return { valid: true };
}
