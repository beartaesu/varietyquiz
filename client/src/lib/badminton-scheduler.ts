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
  code: "rest_imbalance";
  round: number;
  approvedAt: string;
  reason: string;
  spread: number;
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

export interface ManualRoundOptions {
  restGapMode: RestGapMode;
  fixedMinimumGap: number;
  allowRestImbalance?: boolean;
  exceptionReason?: string;
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

export function calculateFlexibleLineup(
  players: SchedulePlayer[],
  requestedCourts: number,
  explicitRestIds: Set<number>,
  soloIds: Set<number>,
  restOrder: number[],
  explicitGameIds: Set<number> = new Set(),
): FlexibleLineup {
  const overlap = [...explicitRestIds].some(id => soloIds.has(id) || explicitGameIds.has(id))
    || [...soloIds].some(id => explicitGameIds.has(id));
  const singlesEven = soloIds.size % 2 === 0;
  const singlesGames = singlesEven ? soloIds.size / 2 : 0;
  const availableDoublesCourts = requestedCourts - singlesGames;
  const ordered = [
    ...restOrder.map(id => players.find(player => player.id === id)).filter((player): player is SchedulePlayer => Boolean(player)),
    ...players.filter(player => !restOrder.includes(player.id)),
  ];
  const eligible = ordered.filter(player => !explicitRestIds.has(player.id) && !soloIds.has(player.id));
  const remaining = eligible;
  const doublesGames = availableDoublesCourts >= 0
    ? Math.min(Math.floor(remaining.length / 4), availableDoublesCourts)
    : 0;
  const doublesPlayerCount = doublesGames * 4;
  const automaticRestCount = Math.max(0, remaining.length - doublesPlayerCount);
  const automaticRestCandidates = remaining.filter(player => !explicitGameIds.has(player.id));
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
    soloIds,
    doublesPlayerCount,
    doublesGames,
    singlesGames,
    totalGames,
    message,
  };
}

const pairKey = (a: SchedulePlayer, b: SchedulePlayer) =>
  [a.id, b.id].sort((x, y) => x - y).join(":");

const restKey = (players: SchedulePlayer[]) =>
  players.map(player => player.id).sort((a, b) => a - b).join(":");

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function isApproved(round: ScheduleRound, issue: ValidationIssue) {
  return issue.code === "rest_imbalance"
    && round.approvedExceptions.some(exception => exception.code === issue.code && exception.round === issue.round);
}

export function validateSchedule(players: SchedulePlayer[], rounds: ScheduleRound[]): ScheduleValidation {
  const playerById = new Map(players.map(player => [player.id, player]));
  const restRounds: Record<string, number[]> = Object.fromEntries(players.map(player => [player.name, []]));
  const cumulative: Record<number, number> = Object.fromEntries(players.map(player => [player.id, 0]));
  const cumulativeRestSpreads: number[] = [];
  const issues: ValidationIssue[] = [];
  const approvedIssues: ValidationIssue[] = [];
  const restGroups = new Map<string, number>();
  const lastRestRound = new Map<number, number>();
  const lastGroup = new Map<number, Set<number>>();
  const groupHistory = new Map<number, Set<number>[]>();
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

    const currentRestKey = restKey(round.resting);
    if (round.resting.length && restGroups.has(currentRestKey)) {
      addIssue(round, { code: "duplicate_rest_group", round: round.round, message: `${round.round}라운드 휴식 조합이 ${restGroups.get(currentRestKey)}라운드와 같습니다.` });
    } else if (round.resting.length) restGroups.set(currentRestKey, round.round);

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
        if (overlap >= 2) {
          addIssue(round, { code: "immediate_rematch", round: round.round, playerIds: [player.id], message: `${round.round}라운드 ${player.name}: 직전 경기 인원 ${overlap}명 재매칭` });
        }
        const history = groupHistory.get(player.id) || [];
        if (history.length >= 2 && [...others].some(id => history.at(-1)!.has(id) && history.at(-2)!.has(id))) {
          addIssue(round, { code: "three_consecutive_group", round: round.round, playerIds: [player.id], message: `${round.round}라운드 ${player.name}: 같은 참가자와 3경기 연속` });
        }
        groupHistory.set(player.id, [...history, others]);
        lastGroup.set(player.id, others);
      });
      for (let first = 0; first < court.players.length; first++) {
        for (let second = first + 1; second < court.players.length; second++) {
          const key = pairKey(court.players[first], court.players[second]);
          groupmateRepeatCounts[key] = (groupmateRepeatCounts[key] || 0) + 1;
        }
      }
    });

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

function scoreGroups(courts: CourtMatch[], previousRounds: ScheduleRound[]) {
  const lastGroup = new Map<number, Set<number>>();
  const pairCounts = new Map<string, number>();
  previousRounds.forEach(round => round.courts.forEach(court => {
    court.players.forEach(player => lastGroup.set(player.id, new Set(court.players.filter(candidate => candidate.id !== player.id).map(candidate => candidate.id))));
    for (let first = 0; first < court.players.length; first++) for (let second = first + 1; second < court.players.length; second++) {
      const key = pairKey(court.players[first], court.players[second]);
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    }
  }));
  let score = 0;
  courts.forEach(court => {
    const averageSkill = court.players.reduce((sum, player) => sum + player.skill, 0) / court.players.length;
    score += Math.abs(averageSkill - 2.5) * 2;
    court.players.forEach(player => {
      const others = court.players.filter(candidate => candidate.id !== player.id);
      const overlap = others.filter(candidate => lastGroup.get(player.id)?.has(candidate.id)).length;
      if (overlap >= 2) score += 100_000;
      else score += overlap * 1_000;
    });
    for (let first = 0; first < court.players.length; first++) for (let second = first + 1; second < court.players.length; second++) {
      score += (pairCounts.get(pairKey(court.players[first], court.players[second])) || 0) * 50;
    }
  });
  return score + Math.random();
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

  let bestCourts: CourtMatch[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 3000; attempt++) {
    const ordered = shuffled(active);
    const courts: CourtMatch[] = Array.from({ length: doublesCourts }, (_, index) => ({
      players: ordered.slice(index * 4, index * 4 + 4),
      type: "doubles",
    }));
    for (let index = 0; index < soloPlayers.length; index += 2) {
      courts.push({ players: [soloPlayers[index], soloPlayers[index + 1]], type: "singles" });
    }
    const score = scoreGroups(courts, previousRounds);
    if (score < bestScore) {
      bestScore = score;
      bestCourts = courts;
    }
    if (score < 1_000) break;
  }
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
  const blockingIssues = currentIssues.filter(issue => issue.code !== "rest_imbalance");
  if (blockingIssues.length) throw new ScheduleRuleError(blockingIssues.map(issue => issue.message).join(" / "), blockingIssues.map(issue => issue.code));
  if (restIssues.length && !options.allowRestImbalance) {
    throw new ScheduleRuleError(restIssues.map(issue => issue.message).join(" / "), ["rest_imbalance"]);
  }
  if (restIssues.length && options.allowRestImbalance) {
    const spread = validation.cumulativeRestSpreads.at(-1) || 0;
    round = {
      ...round,
      approvedExceptions: [{
        id: `rest-${roundNumber}-${Date.now()}`,
        code: "rest_imbalance",
        round: roundNumber,
        approvedAt: new Date().toISOString(),
        reason: options.exceptionReason?.trim() || "사용자 승인",
        spread,
        playerIds: resting.map(player => player.id),
      }],
    };
    validation = validateSchedule(players, [...previousRounds, round]);
  }
  return { round, validation };
}
