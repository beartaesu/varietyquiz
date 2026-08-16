export interface SchedulePlayer {
  id: number;
  name: string;
  skill: number;
  profileId?: string;
}

export type MatchType = "doubles" | "singles";
export type RestGapMode = "fixed" | "dynamic";

export interface CourtMatch {
  players: SchedulePlayer[];
  type: MatchType;
  result?: {
    sideAIds: number[];
    sideBIds: number[];
    sideAScore: number;
    sideBScore: number;
  };
}

export interface RestRuleSnapshot {
  mode: RestGapMode;
  participantCount: number;
  restCount: number;
  averageCycle: number | null;
  minimumGap: number;
}

export type ValidationCode =
  | "rest_imbalance"
  | "invalid_partition"
  | "duplicate_assignment"
  | "unknown_player"
  | "invalid_court_size"
  | "court_limit"
  | "duplicate_rest_group"
  | "minimum_rest_gap"
  | "immediate_rematch"
  | "three_consecutive_group";

export interface ApprovedException {
  id: string;
  code: "rest_imbalance" | "minimum_rest_gap";
  round: number;
  approvedAt: string;
  reason: string;
  spread?: number;
  priorRestRound?: number;
  actualGap?: number;
  minimumGap?: number;
  playerIds: number[];
}

export interface ScheduleRound {
  round: number;
  resting: SchedulePlayer[];
  courts: CourtMatch[];
  courtLimit: number;
  restRule: RestRuleSnapshot;
  approvedExceptions: ApprovedException[];
  createdAt: string;
}

export interface ValidationIssue {
  code: ValidationCode;
  message: string;
  round: number;
  playerIds?: number[];
}

export interface ScheduleValidation {
  restCounts: Record<string, number>;
  restRounds: Record<string, number[]>;
  cumulativeRestSpreads: number[];
  maximumCumulativeRestSpread: number;
  restGaps: Record<string, number[]>;
  betweenRestRounds: Record<string, number[]>;
  groupmateRepeatCounts: Record<string, number>;
  rematchCounts: Record<string, number>;
  issues: ValidationIssue[];
  approvedIssues: ValidationIssue[];
  hardViolations: string[];
}

export interface FlexibleLineup {
  valid: boolean;
  explicitRestIds: Set<number>;
  explicitGameIds: Set<number>;
  automaticRestIds: Set<number>;
  effectiveRestIds: Set<number>;
  soloIds: Set<number>;
  doublesPlayerCount: number;
  doublesGames: number;
  singlesGames: number;
  totalGames: number;
  message: string;
}

export interface RestSelectionContext {
  previousRounds: ScheduleRound[];
  restGapMode: RestGapMode;
  fixedMinimumGap: number;
}

export interface RepeatRuleSnapshot {
  opponentCapacity: number;
  previousEncounterSlots: number;
  currentEncounterSlots: number;
  totalEncounterSlots: number;
  unavoidableRepeatSlots: number;
  strict: boolean;
}

export interface ManualRoundOptions {
  restGapMode: RestGapMode;
  fixedMinimumGap: number;
  allowRestImbalance?: boolean;
  allowMinimumRestGapPlayerIds?: number[];
  exceptionReason?: string;
  candidateIndex?: number;
}

export class ScheduleRuleError extends Error {
  constructor(message: string, public readonly codes: ValidationCode[]) {
    super(message);
    this.name = "ScheduleRuleError";
  }
}

export function calculateRestRule(
  participantCount: number,
  restCount: number,
  mode: RestGapMode,
  fixedMinimumGap = 0,
): RestRuleSnapshot {
  const averageCycle = restCount > 0 ? participantCount / restCount : null;
  const dynamicGap = averageCycle ? Math.ceil(averageCycle / 2) : 0;
  return {
    mode,
    participantCount,
    restCount,
    averageCycle,
    minimumGap: mode === "fixed" ? fixedMinimumGap : dynamicGap,
  };
}

/**
 * 한 참가자가 아직 만나지 않은 상대만으로 그룹을 만들 수 있는지 계산합니다.
 * 가능한 상대 수는 전체 참가자 수 - 1이고, 한 경기에서 사용하는 상대 슬롯은
 * 해당 경기 인원 - 1입니다. 누적 슬롯이 가능한 상대 수를 넘는 순간부터는
 * 비둘기집 원리에 따라 최소 한 번의 재매칭이 불가피합니다.
 */
export function calculateRepeatRule(
  participantCount: number,
  previousEncounterSlots: number,
  currentGroupSize: number,
): RepeatRuleSnapshot {
  const opponentCapacity = Math.max(0, participantCount - 1);
  const currentEncounterSlots = Math.max(0, currentGroupSize - 1);
  const totalEncounterSlots = Math.max(0, previousEncounterSlots) + currentEncounterSlots;
  const unavoidableRepeatSlots = Math.max(0, totalEncounterSlots - opponentCapacity);
  return {
    opponentCapacity,
    previousEncounterSlots: Math.max(0, previousEncounterSlots),
    currentEncounterSlots,
    totalEncounterSlots,
    unavoidableRepeatSlots,
    strict: unavoidableRepeatSlots === 0,
  };
}

export function calculateFlexibleLineup(
  players: SchedulePlayer[],
  requestedCourts: number,
  explicitRestIds: Set<number>,
  soloIds: Set<number>,
  restOrder: number[],
  explicitGameIds: Set<number> = new Set(),
  restContext?: RestSelectionContext,
): FlexibleLineup {
  const playerById = new Map(players.map(player => [player.id, player]));
  const seenOrderIds = new Set<number>();
  const normalizedRestOrder = [...restOrder, ...players.map(player => player.id)].filter(id => {
    if (!playerById.has(id) || seenOrderIds.has(id)) return false;
    seenOrderIds.add(id);
    return true;
  });
  const ordered = normalizedRestOrder.map(id => playerById.get(id)!);
  const shouldAutoCreateSingles = requestedCourts > 0
    && players.length >= 2
    && players.length < 4
    && explicitRestIds.size === 0
    && soloIds.size === 0
    && explicitGameIds.size === 0;
  const automaticSinglesRestCount = shouldAutoCreateSingles ? players.length - 2 : 0;
  const effectiveSoloIds = shouldAutoCreateSingles
    ? new Set(ordered.slice(automaticSinglesRestCount, automaticSinglesRestCount + 2).map(player => player.id))
    : soloIds;
  const overlap = [...explicitRestIds].some(id => effectiveSoloIds.has(id) || explicitGameIds.has(id))
    || [...effectiveSoloIds].some(id => explicitGameIds.has(id));
  const singlesEven = effectiveSoloIds.size % 2 === 0;
  const singlesGames = singlesEven ? effectiveSoloIds.size / 2 : 0;
  const availableDoublesCourts = requestedCourts - singlesGames;
  const eligible = ordered.filter(player => !explicitRestIds.has(player.id) && !effectiveSoloIds.has(player.id));
  const remaining = eligible;
  const doublesGames = availableDoublesCourts >= 0
    ? Math.min(Math.floor(remaining.length / 4), availableDoublesCourts)
    : 0;
  const doublesPlayerCount = doublesGames * 4;
  const automaticRestCount = Math.max(0, remaining.length - doublesPlayerCount);
  const effectiveRestCount = explicitRestIds.size + automaticRestCount;
  const previousRounds = restContext?.previousRounds || [];
  const minimumGap = restContext
    ? restContext.restGapMode === "fixed" && restContext.fixedMinimumGap === 0 && effectiveRestCount > 0
      ? calculateRestRule(players.length, effectiveRestCount, "dynamic").minimumGap
      : calculateRestRule(players.length, effectiveRestCount, restContext.restGapMode, restContext.fixedMinimumGap).minimumGap
    : 0;
  const nextRound = previousRounds.length + 1;
  const restRoundsByPlayer = new Map(players.map(player => [
    player.id,
    previousRounds.filter(round => round.resting.some(resting => resting.id === player.id)).map(round => round.round),
  ]));
  const orderRank = new Map(normalizedRestOrder.map((id, index) => [id, index]));
  const automaticRestCandidates = remaining
    .filter(player => !explicitGameIds.has(player.id))
    .sort((first, second) => {
      const firstRounds = restRoundsByPlayer.get(first.id) || [];
      const secondRounds = restRoundsByPlayer.get(second.id) || [];
      const firstLast = firstRounds.at(-1);
      const secondLast = secondRounds.at(-1);
      const firstGapAllowed = firstLast === undefined || nextRound - firstLast >= minimumGap;
      const secondGapAllowed = secondLast === undefined || nextRound - secondLast >= minimumGap;
      if (firstGapAllowed !== secondGapAllowed) return firstGapAllowed ? -1 : 1;
      if (firstRounds.length !== secondRounds.length) return firstRounds.length - secondRounds.length;
      if (firstLast !== secondLast) return (firstLast ?? Number.NEGATIVE_INFINITY) - (secondLast ?? Number.NEGATIVE_INFINITY);
      return (orderRank.get(first.id) || 0) - (orderRank.get(second.id) || 0);
    });
  const automaticRestIds = new Set(automaticRestCandidates.slice(0, automaticRestCount).map(player => player.id));
  const forcedGameRested = automaticRestCandidates.length < automaticRestCount;
  const effectiveRestIds = new Set([...explicitRestIds, ...automaticRestIds]);
  const totalGames = doublesGames + singlesGames;
  let message = "";
  if (overlap) message = "같은 참가자에게 경기·휴식·단식을 동시에 지정할 수 없습니다.";
  else if (!singlesEven) message = "단식은 2명씩 선택해주세요.";
  else if (availableDoublesCourts < 0) message = "단식 게임 수가 요청 코트 수를 초과합니다.";
  else if (forcedGameRested) message = "경기로 고정한 인원이 사용 가능한 복식 자리보다 많습니다.";
  else if (totalGames === 0) message = "최소 한 경기 이상 구성해야 합니다.";
  return {
    valid: !message,
    explicitRestIds,
    explicitGameIds,
    automaticRestIds,
    effectiveRestIds,
    soloIds: effectiveSoloIds,
    doublesPlayerCount,
    doublesGames,
    singlesGames,
    totalGames,
    message,
  };
}

const pairKey = (a: SchedulePlayer, b: SchedulePlayer) =>
  [a.id, b.id].sort((x, y) => x - y).join(":");

function isApproved(round: ScheduleRound, issue: ValidationIssue) {
  return round.approvedExceptions.some(exception => {
    if (exception.code !== issue.code || exception.round !== issue.round) return false;
    if (issue.code === "rest_imbalance") return true;
    return issue.code === "minimum_rest_gap"
      && (issue.playerIds || []).every(id => exception.playerIds.includes(id));
  });
}

export function validateSchedule(players: SchedulePlayer[], rounds: ScheduleRound[]): ScheduleValidation {
  const playerById = new Map(players.map(player => [player.id, player]));
  const restRounds: Record<string, number[]> = Object.fromEntries(players.map(player => [player.name, []]));
  const cumulative: Record<number, number> = Object.fromEntries(players.map(player => [player.id, 0]));
  const cumulativeRestSpreads: number[] = [];
  const issues: ValidationIssue[] = [];
  const approvedIssues: ValidationIssue[] = [];
  const lastRestRound = new Map<number, number>();
  const lastGroup = new Map<number, Set<number>>();
  const groupmateRepeatCounts: Record<string, number> = {};
  const rematchCounts: Record<string, number> = Object.fromEntries(players.map(player => [player.name, 0]));

  const addIssue = (round: ScheduleRound, issue: ValidationIssue) => {
    if (isApproved(round, issue)) approvedIssues.push(issue);
    else issues.push(issue);
  };

  rounds.forEach((round, roundIndex) => {
    if (round.round !== roundIndex + 1) {
      addIssue(round, { code: "invalid_partition", round: round.round, message: `${round.round}라운드 번호 순서가 올바르지 않습니다.` });
    }
    const assigned = new Map<number, string[]>();
    const mark = (player: SchedulePlayer, place: string) => {
      if (!playerById.has(player.id)) {
        addIssue(round, { code: "unknown_player", round: round.round, playerIds: [player.id], message: `${round.round}라운드에 등록되지 않은 참가자가 있습니다.` });
        return;
      }
      assigned.set(player.id, [...(assigned.get(player.id) || []), place]);
    };

    round.resting.forEach(player => {
      mark(player, "휴식");
      if (restRounds[player.name]) restRounds[player.name].push(round.round);
      cumulative[player.id] = (cumulative[player.id] || 0) + 1;
      const prior = lastRestRound.get(player.id);
      if (prior !== undefined && round.round - prior < round.restRule.minimumGap) {
        addIssue(round, {
          code: "minimum_rest_gap",
          round: round.round,
          playerIds: [player.id],
          message: `${player.name}: ${prior}→${round.round}라운드 휴식 간격 ${round.round - prior}, 기준 ${round.restRule.minimumGap}`,
        });
      }
      lastRestRound.set(player.id, round.round);
    });

    if (round.courts.length > round.courtLimit) {
      addIssue(round, { code: "court_limit", round: round.round, message: `${round.round}라운드 사용 코트 수가 제한을 초과합니다.` });
    }

    round.courts.forEach((court, courtIndex) => {
      const expected = court.type === "singles" ? 2 : 4;
      if (court.players.length !== expected || new Set(court.players.map(player => player.id)).size !== expected) {
        addIssue(round, { code: "invalid_court_size", round: round.round, playerIds: court.players.map(player => player.id), message: `${round.round}라운드 게임 ${courtIndex + 1}은 ${expected}명이어야 합니다.` });
      }
      court.players.forEach(player => mark(player, court.type === "singles" ? "단식" : "복식"));
      court.players.forEach(player => {
        const others = new Set(court.players.filter(candidate => candidate.id !== player.id).map(candidate => candidate.id));
        const previous = lastGroup.get(player.id);
        const overlap = previous ? [...others].filter(id => previous.has(id)).length : 0;
        rematchCounts[player.name] = (rematchCounts[player.name] || 0) + overlap;
        lastGroup.set(player.id, others);
      });
      for (let first = 0; first < court.players.length; first++) {
        for (let second = first + 1; second < court.players.length; second++) {
          const key = pairKey(court.players[first], court.players[second]);
          groupmateRepeatCounts[key] = (groupmateRepeatCounts[key] || 0) + 1;
        }
      }
    });

    validateRoundRepeatFairness(players, round, rounds.slice(0, roundIndex))
      .forEach(issue => addIssue(round, issue));

    players.forEach(player => {
      const places = assigned.get(player.id) || [];
      if (places.length === 0) {
        addIssue(round, { code: "invalid_partition", round: round.round, playerIds: [player.id], message: `${round.round}라운드 ${player.name}이(가) 휴식·단식·복식 어디에도 없습니다.` });
      } else if (places.length > 1) {
        addIssue(round, { code: "duplicate_assignment", round: round.round, playerIds: [player.id], message: `${round.round}라운드 ${player.name} 중복 배정: ${places.join("·")}` });
      }
    });

    const restValues = players.map(player => cumulative[player.id] || 0);
    const spread = restValues.length ? Math.max(...restValues) - Math.min(...restValues) : 0;
    cumulativeRestSpreads.push(spread);
    if (spread > 1) {
      addIssue(round, {
        code: "rest_imbalance",
        round: round.round,
        playerIds: round.resting.map(player => player.id),
        message: `${round.round}라운드 누적 휴식 편차 ${spread}`,
      });
    }
  });

  const restCounts = Object.fromEntries(Object.entries(restRounds).map(([name, values]) => [name, values.length]));
  const restGaps = Object.fromEntries(Object.entries(restRounds).map(([name, values]) => [name, values.slice(1).map((round, index) => round - values[index])]));
  const betweenRestRounds = Object.fromEntries(Object.entries(restGaps).map(([name, values]) => [name, values.map(value => value - 1)]));
  return {
    restCounts,
    restRounds,
    cumulativeRestSpreads,
    maximumCumulativeRestSpread: Math.max(0, ...cumulativeRestSpreads),
    restGaps,
    betweenRestRounds,
    groupmateRepeatCounts,
    rematchCounts,
    issues,
    approvedIssues,
    hardViolations: issues.map(issue => issue.message),
  };
}

interface MatchHistory {
  pairCounts: Map<string, number>;
  encounterSlots: Map<number, number>;
  recentGroups: Map<number, Set<number>[]>;
}

interface FairnessScore {
  maximumPairCount: number;
  consecutiveTriplePairs: number;
  squaredPairCost: number;
  skillImbalance: number;
  maximumPairPlayerIds: number[];
  consecutiveTriplePlayerIds: number[];
}

function collectMatchHistory(previousRounds: ScheduleRound[]): MatchHistory {
  const pairCounts = new Map<string, number>();
  const encounterSlots = new Map<number, number>();
  const recentGroups = new Map<number, Set<number>[]>();
  previousRounds.forEach(round => round.courts.forEach(court => {
    court.players.forEach(player => {
      const group = new Set(court.players.filter(candidate => candidate.id !== player.id).map(candidate => candidate.id));
      recentGroups.set(player.id, [...(recentGroups.get(player.id) || []), group].slice(-2));
      encounterSlots.set(player.id, (encounterSlots.get(player.id) || 0) + Math.max(0, court.players.length - 1));
    });
    for (let first = 0; first < court.players.length; first++) for (let second = first + 1; second < court.players.length; second++) {
      const key = pairKey(court.players[first], court.players[second]);
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    }
  }));
  return { pairCounts, encounterSlots, recentGroups };
}

function evaluateFairness(
  courts: CourtMatch[],
  history: MatchHistory,
  targetSkill: number,
): FairnessScore {
  let maximumPairCount = 0;
  let consecutiveTriplePairs = 0;
  let squaredPairCost = 0;
  let skillImbalance = 0;
  const maximumPairPlayerIds = new Set<number>();
  const consecutiveTriplePlayerIds = new Set<number>();

  courts.forEach(court => {
    const averageSkill = court.players.reduce((sum, player) => sum + player.skill, 0) / court.players.length;
    skillImbalance += Math.abs(averageSkill - targetSkill);
    for (let first = 0; first < court.players.length; first++) {
      for (let second = first + 1; second < court.players.length; second++) {
        const a = court.players[first];
        const b = court.players[second];
        const nextPairCount = (history.pairCounts.get(pairKey(a, b)) || 0) + 1;
        squaredPairCost += nextPairCount * nextPairCount;
        if (nextPairCount > maximumPairCount) {
          maximumPairCount = nextPairCount;
          maximumPairPlayerIds.clear();
          maximumPairPlayerIds.add(a.id);
          maximumPairPlayerIds.add(b.id);
        } else if (nextPairCount === maximumPairCount) {
          maximumPairPlayerIds.add(a.id);
          maximumPairPlayerIds.add(b.id);
        }

        const aRecent = history.recentGroups.get(a.id) || [];
        const bRecent = history.recentGroups.get(b.id) || [];
        const isThreeConsecutive = (aRecent.length >= 2 && aRecent.at(-1)!.has(b.id) && aRecent.at(-2)!.has(b.id))
          || (bRecent.length >= 2 && bRecent.at(-1)!.has(a.id) && bRecent.at(-2)!.has(a.id));
        if (isThreeConsecutive) {
          consecutiveTriplePairs += 1;
          consecutiveTriplePlayerIds.add(a.id);
          consecutiveTriplePlayerIds.add(b.id);
        }
      }
    }
  });

  return {
    maximumPairCount,
    consecutiveTriplePairs,
    squaredPairCost,
    skillImbalance,
    maximumPairPlayerIds: [...maximumPairPlayerIds],
    consecutiveTriplePlayerIds: [...consecutiveTriplePlayerIds],
  };
}

function compareFairness(first: FairnessScore, second: FairnessScore) {
  return first.maximumPairCount - second.maximumPairCount
    || first.consecutiveTriplePairs - second.consecutiveTriplePairs
    || first.squaredPairCost - second.squaredPairCost
    || first.skillImbalance - second.skillImbalance;
}

function scoreGroup(
  group: SchedulePlayer[],
  history: MatchHistory,
  participantCount: number,
  targetSkill: number,
) {
  let score = 0;
  const averageSkill = group.reduce((sum, player) => sum + player.skill, 0) / group.length;
  score += Math.abs(averageSkill - targetSkill) * 10;
  for (let first = 0; first < group.length; first++) {
    for (let second = first + 1; second < group.length; second++) {
      const a = group[first];
      const b = group[second];
      const priorMeetings = history.pairCounts.get(pairKey(a, b)) || 0;
      const aCapacity = Math.max(1, participantCount - 1);
      const bCapacity = Math.max(1, participantCount - 1);
      const aExpectedRepeats = Math.floor((history.encounterSlots.get(a.id) || 0) / aCapacity);
      const bExpectedRepeats = Math.floor((history.encounterSlots.get(b.id) || 0) / bCapacity);
      const expectedRepeats = Math.min(aExpectedRepeats, bExpectedRepeats);
      const excessMeetings = Math.max(0, priorMeetings - expectedRepeats);
      score += priorMeetings * 20 + excessMeetings * excessMeetings * 400;

      const aRecent = history.recentGroups.get(a.id) || [];
      const bRecent = history.recentGroups.get(b.id) || [];
      if (aRecent.at(-1)?.has(b.id) || bRecent.at(-1)?.has(a.id)) score += 120;
      if (
        (aRecent.length >= 2 && aRecent.at(-1)!.has(b.id) && aRecent.at(-2)!.has(b.id))
        || (bRecent.length >= 2 && bRecent.at(-1)!.has(a.id) && bRecent.at(-2)!.has(a.id))
      ) {
        score += 240;
      }
    }
  }
  return score;
}

function rotate<T>(items: T[], offset: number) {
  if (!items.length) return items;
  const normalized = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

function chooseBestDoublesGroup(
  remaining: SchedulePlayer[],
  history: MatchHistory,
  participantCount: number,
  targetSkill: number,
  variant: number,
) {
  if (remaining.length === 4) return [...remaining];
  const ordered = rotate([...remaining].sort((a, b) => a.id - b.id), variant);
  const anchor = ordered[0];
  const candidates = ordered.slice(1);
  let best: SchedulePlayer[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let first = 0; first < candidates.length - 2; first++) {
    for (let second = first + 1; second < candidates.length - 1; second++) {
      for (let third = second + 1; third < candidates.length; third++) {
        const group = [anchor, candidates[first], candidates[second], candidates[third]];
        const score = scoreGroup(group, history, participantCount, targetSkill);
        if (score < bestScore) {
          best = group;
          bestScore = score;
        }
      }
    }
  }
  return best || remaining.slice(0, 4);
}

function createDeterministicCourts(
  active: SchedulePlayer[],
  doublesCourts: number,
  soloPlayers: SchedulePlayer[],
  previousRounds: ScheduleRound[],
  participantCount: number,
  variant: number,
) {
  const history = collectMatchHistory(previousRounds);
  const targetSkill = active.length
    ? active.reduce((sum, player) => sum + player.skill, 0) / active.length
    : 0;
  let remaining = [...active];
  const courts: CourtMatch[] = [];
  for (let courtIndex = 0; courtIndex < doublesCourts; courtIndex++) {
    const group = chooseBestDoublesGroup(
      remaining,
      history,
      participantCount,
      targetSkill,
      variant + courtIndex,
    );
    courts.push({ players: group, type: "doubles" });
    const selectedIds = new Set(group.map(player => player.id));
    remaining = remaining.filter(player => !selectedIds.has(player.id));
  }
  for (let index = 0; index < soloPlayers.length; index += 2) {
    courts.push({ players: [soloPlayers[index], soloPlayers[index + 1]], type: "singles" });
  }
  return courts;
}

function uniqueCourtKey(courts: CourtMatch[]) {
  return courts
    .map(court => `${court.type}:${court.players.map(player => player.id).sort((a, b) => a - b).join(",")}`)
    .sort()
    .join("|");
}

function createRankedCourtCandidates(
  active: SchedulePlayer[],
  doublesCourts: number,
  soloPlayers: SchedulePlayer[],
  previousRounds: ScheduleRound[],
  participantCount: number,
) {
  const history = collectMatchHistory(previousRounds);
  const allActive = [...active, ...soloPlayers];
  const targetSkill = allActive.length
    ? allActive.reduce((sum, player) => sum + player.skill, 0) / allActive.length
    : 0;
  const variantCount = Math.max(1, Math.min(active.length || 1, Math.max(3, doublesCourts * 2)));
  const unique = new Map<string, { courts: CourtMatch[]; fairness: FairnessScore }>();
  for (let variant = 0; variant < variantCount; variant++) {
    const courts = createDeterministicCourts(
      active,
      doublesCourts,
      soloPlayers,
      previousRounds,
      participantCount,
      variant,
    );
    const key = uniqueCourtKey(courts);
    if (!unique.has(key)) unique.set(key, { courts, fairness: evaluateFairness(courts, history, targetSkill) });
  }
  return [...unique.values()].sort((first, second) => compareFairness(first.fairness, second.fairness));
}

function validateRoundRepeatFairness(
  players: SchedulePlayer[],
  round: ScheduleRound,
  previousRounds: ScheduleRound[],
): ValidationIssue[] {
  const assignedIds = round.courts.flatMap(court => court.players.map(player => player.id));
  const validCourtSizes = round.courts.every(court => court.players.length === (court.type === "singles" ? 2 : 4));
  if (!validCourtSizes || new Set(assignedIds).size !== assignedIds.length) return [];

  const doublesPlayers = round.courts.filter(court => court.type === "doubles").flatMap(court => court.players);
  const soloPlayers = round.courts.filter(court => court.type === "singles").flatMap(court => court.players);
  const history = collectMatchHistory(previousRounds);
  const targetSkill = assignedIds.length
    ? round.courts.flatMap(court => court.players).reduce((sum, player) => sum + player.skill, 0) / assignedIds.length
    : 0;
  const current = evaluateFairness(round.courts, history, targetSkill);

  const activePlayers = [...doublesPlayers, ...soloPlayers];
  const activeById = new Map(activePlayers.map(player => [player.id, player]));
  const hasLocallyAvoidablePair = round.courts.some(court => court.players.some(player => {
    const selectedOthers = court.players.filter(candidate => candidate.id !== player.id);
    const availableOthers = activePlayers.filter(candidate => candidate.id !== player.id);
    const minimumAvailableCount = Math.min(
      ...availableOthers.map(candidate => history.pairCounts.get(pairKey(player, candidate)) || 0),
    );
    return selectedOthers.some(candidate => (history.pairCounts.get(pairKey(player, candidate)) || 0) > minimumAvailableCount + 1);
  }));
  if (!hasLocallyAvoidablePair && current.consecutiveTriplePairs === 0) return [];

  const rankedCandidates = createRankedCourtCandidates(
    doublesPlayers,
    round.courts.filter(court => court.type === "doubles").length,
    soloPlayers,
    previousRounds,
    players.length,
  );
  const best = rankedCandidates[0]?.fairness;
  if (!best) return [];

  const pairSlots = round.courts.reduce(
    (sum, court) => sum + (court.players.length * (court.players.length - 1)) / 2,
    0,
  );
  const issues: ValidationIssue[] = [];
  const excessiveMaximum = current.maximumPairCount > best.maximumPairCount + 1;
  const excessiveDistribution = current.squaredPairCost > best.squaredPairCost + pairSlots * 2;
  if (excessiveMaximum || excessiveDistribution) {
    const names = current.maximumPairPlayerIds
      .map(id => activeById.get(id)?.name)
      .filter((name): name is string => Boolean(name));
    issues.push({
      code: "immediate_rematch",
      round: round.round,
      playerIds: current.maximumPairPlayerIds,
      message: `${round.round}라운드 반복 편중: ${names.join("·") || "일부 참가자"} 누적 ${current.maximumPairCount}회, 가능한 배치 기준 ${best.maximumPairCount}회`,
    });
  }
  if (current.consecutiveTriplePairs > best.consecutiveTriplePairs) {
    const names = current.consecutiveTriplePlayerIds
      .map(id => activeById.get(id)?.name)
      .filter((name): name is string => Boolean(name));
    issues.push({
      code: "three_consecutive_group",
      round: round.round,
      playerIds: current.consecutiveTriplePlayerIds,
      message: `${round.round}라운드 3경기 연속 재매칭을 피할 수 있습니다: ${names.join("·") || "일부 참가자"}`,
    });
  }
  return issues;
}

export function generateManualRound(
  players: SchedulePlayer[],
  resting: SchedulePlayer[],
  previousRounds: ScheduleRound[],
  requestedCourts: number,
  soloPlayers: SchedulePlayer[] = [],
  options: ManualRoundOptions,
): { round: ScheduleRound; validation: ScheduleValidation } {
  const restingIds = new Set(resting.map(player => player.id));
  const soloIds = new Set(soloPlayers.map(player => player.id));
  if (soloPlayers.length % 2 !== 0) throw new ScheduleRuleError("단식은 2명씩 구성해야 합니다.", ["invalid_court_size"]);
  if ([...soloIds].some(id => restingIds.has(id))) throw new ScheduleRuleError("같은 참가자를 휴식과 단식에 동시에 지정할 수 없습니다.", ["duplicate_assignment"]);
  const active = players.filter(player => !restingIds.has(player.id) && !soloIds.has(player.id));
  if (active.length % 4 !== 0) throw new ScheduleRuleError("복식 참가 인원은 4의 배수여야 합니다.", ["invalid_court_size"]);
  const doublesCourts = active.length / 4;
  const singlesCourts = soloPlayers.length / 2;
  if (doublesCourts + singlesCourts > requestedCourts) throw new ScheduleRuleError("현재 구성에 필요한 코트 수가 요청 코트 수를 초과합니다.", ["court_limit"]);
  if (doublesCourts + singlesCourts === 0) throw new ScheduleRuleError("최소 한 경기 이상 구성해야 합니다.", ["invalid_partition"]);

  const rankedCandidates = createRankedCourtCandidates(
    active,
    doublesCourts,
    soloPlayers,
    previousRounds,
    players.length,
  );
  const candidateIndex = Math.max(0, options.candidateIndex || 0);
  const bestCourts = rankedCandidates[candidateIndex % rankedCandidates.length]?.courts;
  if (!bestCourts) throw new ScheduleRuleError("유효한 게임 그룹을 만들 수 없습니다.", ["invalid_partition"]);

  const roundNumber = previousRounds.length + 1;
  const restRule = calculateRestRule(players.length, resting.length, options.restGapMode, options.fixedMinimumGap);
  let round: ScheduleRound = {
    round: roundNumber,
    resting,
    courts: bestCourts,
    courtLimit: requestedCourts,
    restRule,
    approvedExceptions: [],
    createdAt: new Date().toISOString(),
  };
  let validation = validateSchedule(players, [...previousRounds, round]);
  const currentIssues = validation.issues.filter(issue => issue.round === roundNumber);
  const restIssues = currentIssues.filter(issue => issue.code === "rest_imbalance");
  const allowedMinimumRestGapIds = new Set(options.allowMinimumRestGapPlayerIds || []);
  const approvedMinimumRestGapIssues = currentIssues.filter(issue => issue.code === "minimum_rest_gap"
    && (issue.playerIds || []).length > 0
    && (issue.playerIds || []).every(id => allowedMinimumRestGapIds.has(id)));
  const approvedMinimumRestGapIssueSet = new Set(approvedMinimumRestGapIssues);
  const blockingIssues = currentIssues.filter(issue => issue.code !== "rest_imbalance" && !approvedMinimumRestGapIssueSet.has(issue));
  if (blockingIssues.length) throw new ScheduleRuleError(blockingIssues.map(issue => issue.message).join(" / "), blockingIssues.map(issue => issue.code));
  if (restIssues.length && !options.allowRestImbalance) {
    throw new ScheduleRuleError(restIssues.map(issue => issue.message).join(" / "), ["rest_imbalance"]);
  }
  const approvedExceptions: ApprovedException[] = approvedMinimumRestGapIssues.map((issue, index) => {
    const playerId = issue.playerIds?.[0];
    const priorRestRound = playerId === undefined
      ? undefined
      : [...previousRounds].reverse().find(previous => previous.resting.some(player => player.id === playerId))?.round;
    return {
      id: `rest-gap-${roundNumber}-${index}-${Date.now()}`,
      code: "minimum_rest_gap",
      round: roundNumber,
      approvedAt: new Date().toISOString(),
      reason: "사용자가 직접 휴식으로 지정",
      priorRestRound,
      actualGap: priorRestRound === undefined ? undefined : roundNumber - priorRestRound,
      minimumGap: restRule.minimumGap,
      playerIds: issue.playerIds || [],
    };
  });
  if (restIssues.length && options.allowRestImbalance) {
    const spread = validation.cumulativeRestSpreads.at(-1) || 0;
    approvedExceptions.push({
      id: `rest-${roundNumber}-${Date.now()}`,
      code: "rest_imbalance",
      round: roundNumber,
      approvedAt: new Date().toISOString(),
      reason: options.exceptionReason?.trim() || "사용자 승인",
      spread,
      playerIds: resting.map(player => player.id),
    });
  }
  if (approvedExceptions.length) {
    round = { ...round, approvedExceptions };
    validation = validateSchedule(players, [...previousRounds, round]);
  }
  return { round, validation };
}
