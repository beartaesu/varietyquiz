import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  SchedulePlayer,
  ScheduleRound,
  ScheduleRuleError,
  calculateFlexibleLineup,
  calculateRepeatRule,
  calculateRestRule,
  generateManualRound,
  validateSchedule,
} from "./badminton-scheduler";

const players = (count: number): SchedulePlayer[] => Array.from({ length: count }, (_, index) => ({
  id: index + 1,
  name: `참가자${index + 1}`,
  skill: index % 6,
}));

const restOnlyRound = (roster: SchedulePlayer[], round: number, restId: number): ScheduleRound => ({
  round,
  resting: [roster.find(player => player.id === restId)!],
  courts: [],
  courtLimit: 2,
  restRule: calculateRestRule(roster.length, 1, "fixed", 3),
  approvedExceptions: [],
  createdAt: new Date(round).toISOString(),
});

const fixedOptions = { restGapMode: "fixed" as const, fixedMinimumGap: 1 };

describe("유연한 인원 구성", () => {
  it("13명에서 휴식 1명과 단식 2명을 선택하면 2명을 자동 휴식으로 전환한다", () => {
    const roster = players(13);
    const result = calculateFlexibleLineup(roster, 4, new Set([5]), new Set([1, 9]), roster.map(player => player.id));
    expect(result.valid).toBe(true);
    expect(result.effectiveRestIds.size).toBe(3);
    expect(result.automaticRestIds.size).toBe(2);
    expect(result.doublesGames).toBe(2);
    expect(result.singlesGames).toBe(1);
  });

  it("자동 휴식은 대기열 앞에서 순환하고 경기 고정자는 건너뛴다", () => {
    const roster = players(13);
    const first = calculateFlexibleLineup(roster, 3, new Set(), new Set(), roster.map(player => player.id));
    expect([...first.automaticRestIds]).toEqual([1]);
    const rotatedOrder = [...roster.slice(1).map(player => player.id), roster[0].id];
    const second = calculateFlexibleLineup(roster, 3, new Set(), new Set(), rotatedOrder);
    expect([...second.automaticRestIds]).toEqual([2]);
    const fixed = calculateFlexibleLineup(roster, 3, new Set(), new Set(), rotatedOrder, new Set([2]));
    expect([...fixed.automaticRestIds]).toEqual([3]);
  });

  it("자동 휴식은 순번보다 누적 휴식 횟수가 적은 참가자를 우선한다", () => {
    const roster = players(9);
    const previousRounds = [restOnlyRound(roster, 1, 1)];
    const result = calculateFlexibleLineup(roster, 2, new Set(), new Set(), roster.map(player => player.id), new Set(), {
      previousRounds,
      restGapMode: "fixed",
      fixedMinimumGap: 1,
    });

    expect([...result.automaticRestIds]).toEqual([2]);
  });

  it("휴식 횟수가 같으면 최소 간격을 지키면서 가장 오래전에 쉰 참가자를 우선한다", () => {
    const roster = players(9);
    const previousRounds = roster.map((player, index) => restOnlyRound(roster, index + 1, player.id));
    const restOrder = [9, 1, 2, 3, 4, 5, 6, 7, 8];
    const result = calculateFlexibleLineup(roster, 2, new Set(), new Set(), restOrder, new Set(), {
      previousRounds,
      restGapMode: "fixed",
      fixedMinimumGap: 3,
    });

    expect([...result.automaticRestIds]).toEqual([1]);
  });

  it("유효한 모든 기본 조합은 참가자를 정확히 한 번 분류한다", () => {
    fc.assert(fc.property(
      fc.integer({ min: 2, max: 30 }),
      fc.integer({ min: 1, max: 8 }),
      (count, courts) => {
        const roster = players(count);
        const result = calculateFlexibleLineup(roster, courts, new Set(), new Set(), roster.map(player => player.id));
        if (!result.valid) return true;
        return result.effectiveRestIds.size + result.doublesPlayerCount + result.soloIds.size === count
          && result.totalGames <= courts;
      },
    ), { numRuns: 1000 });
  });

  it("2~3명은 별도 선택 없이 단식 1경기와 휴식자로 자동 구성한다", () => {
    for (const count of [2, 3]) {
      const roster = players(count);
      const result = calculateFlexibleLineup(roster, 1, new Set(), new Set(), roster.map(player => player.id));
      expect(result.valid, `${count}명 구성`).toBe(true);
      expect(result.singlesGames).toBe(1);
      expect(result.soloIds.size).toBe(2);
      expect(result.effectiveRestIds.size).toBe(count - 2);
    }
  });
});

describe("인원수 기반 재매칭 허용", () => {
  it("9명 복식은 세 번째 출전부터 최소 한 상대의 재매칭이 불가피하다고 계산한다", () => {
    const beforeThirdGame = calculateRepeatRule(9, 3, 4);
    expect(beforeThirdGame.strict).toBe(true);
    expect(beforeThirdGame.unavoidableRepeatSlots).toBe(0);

    const thirdGame = calculateRepeatRule(9, 6, 4);
    expect(thirdGame.opponentCapacity).toBe(8);
    expect(thirdGame.totalEncounterSlots).toBe(9);
    expect(thirdGame.unavoidableRepeatSlots).toBe(1);
    expect(thirdGame.strict).toBe(false);
  });

  it("9명 2코트는 휴식을 순환하며 6라운드까지 재매칭 규칙에 막히지 않는다", () => {
    const roster = players(9);
    const rounds: ScheduleRound[] = [];
    for (let index = 0; index < 6; index++) {
      const round = generateManualRound(roster, [roster[index]], rounds, 2, [], fixedOptions).round;
      rounds.push(round);
    }
    const validation = validateSchedule(roster, rounds);
    expect(validation.issues.filter(issue => issue.code === "immediate_rematch" || issue.code === "three_consecutive_group")).toEqual([]);
  });

  it("반복이 불가피한 인원·코트 조합도 20라운드까지 중단하지 않는다", () => {
    const scenarios = [
      { count: 5, courts: 1 },
      { count: 6, courts: 1 },
      { count: 7, courts: 1 },
      { count: 9, courts: 2 },
      { count: 10, courts: 2 },
      { count: 12, courts: 3 },
      { count: 13, courts: 3 },
    ];
    scenarios.forEach(({ count, courts }) => {
      const roster = players(count);
      const rounds: ScheduleRound[] = [];
      let restOrder = roster.map(player => player.id);
      const restCount = count - Math.min(courts, Math.floor(count / 4)) * 4;
      const fixedMinimumGap = calculateRestRule(count, restCount, "dynamic").minimumGap;
      for (let index = 0; index < 20; index++) {
        const lineup = calculateFlexibleLineup(roster, courts, new Set(), new Set(), restOrder);
        expect(lineup.valid, `${count}명·${courts}코트 ${index + 1}라운드 구성`).toBe(true);
        const resting = roster.filter(player => lineup.effectiveRestIds.has(player.id));
        const round = generateManualRound(roster, resting, rounds, courts, [], {
          restGapMode: "fixed",
          fixedMinimumGap,
        }).round;
        rounds.push(round);
        const restingIds = new Set(resting.map(player => player.id));
        restOrder = [
          ...restOrder.filter(id => !restingIds.has(id)),
          ...restOrder.filter(id => restingIds.has(id)),
        ];
      }
      expect(validateSchedule(roster, rounds).issues, `${count}명·${courts}코트 검증`).toEqual([]);
    });
  });

  it("같은 입력에는 항상 같은 배치를 만들고 후보 번호로 대안을 만들 수 있다", () => {
    const roster = players(12);
    const first = generateManualRound(roster, [], [], 3, [], { ...fixedOptions, candidateIndex: 0 }).round;
    const repeated = generateManualRound(roster, [], [], 3, [], { ...fixedOptions, candidateIndex: 0 }).round;
    const alternative = generateManualRound(roster, [], [], 3, [], { ...fixedOptions, candidateIndex: 1 }).round;
    const ids = (round: ScheduleRound) => round.courts.map(court => court.players.map(player => player.id));
    expect(ids(repeated)).toEqual(ids(first));
    expect(ids(alternative)).not.toEqual(ids(first));
  });

  it("특정 두 사람을 피할 수 있는데도 계속 같은 코트에 배치하면 차단한다", () => {
    const roster = players(9);
    const restIds = [9, 8, 7, 6];
    const rounds: ScheduleRound[] = restIds.map((restId, index) => {
      const resting = roster.find(player => player.id === restId)!;
      const active = roster.filter(player => player.id !== restId);
      const fixedPairCourt = [
        roster[0],
        roster[1],
        ...active.filter(player => player.id !== 1 && player.id !== 2).slice(0, 2),
      ];
      const fixedIds = new Set(fixedPairCourt.map(player => player.id));
      return {
        round: index + 1,
        resting: [resting],
        courts: [
          { type: "doubles", players: fixedPairCourt },
          { type: "doubles", players: active.filter(player => !fixedIds.has(player.id)) },
        ],
        courtLimit: 2,
        restRule: calculateRestRule(9, 1, "fixed", 1),
        approvedExceptions: [],
        createdAt: new Date(index).toISOString(),
      };
    });

    const validation = validateSchedule(roster, rounds);
    expect(validation.issues.some(issue => issue.code === "immediate_rematch")).toBe(true);
    expect(validation.issues.some(issue => issue.code === "three_consecutive_group")).toBe(true);
    expect(() => generateManualRound(
      roster,
      rounds[3].resting,
      rounds.slice(0, 3),
      2,
      [],
      fixedOptions,
    )).not.toThrow();
  });
});

describe("전수검증", () => {
  it("2명부터 24명까지 생성된 첫 라운드는 참가자를 빠짐없이 배정한다", () => {
    for (let count = 2; count <= 24; count++) {
      const roster = players(count);
      const courts = Math.max(1, Math.min(6, Math.ceil(count / 4)));
      const soloIds = count < 4 ? new Set(roster.slice(0, 2).map(player => player.id)) : new Set<number>();
      const restIds = count < 4 ? new Set(roster.slice(2).map(player => player.id)) : new Set<number>();
      const lineup = calculateFlexibleLineup(roster, courts, restIds, soloIds, roster.map(player => player.id));
      expect(lineup.valid, `${count}명 구성`).toBe(true);
      const round = generateManualRound(
        roster,
        roster.filter(player => lineup.effectiveRestIds.has(player.id)),
        [],
        courts,
        roster.filter(player => soloIds.has(player.id)),
        fixedOptions,
      ).round;
      expect(validateSchedule(roster, [round]).issues, `${count}명 검증`).toEqual([]);
    }
  });

  it("휴식과 출전 중복 및 참가자 누락을 모두 검출한다", () => {
    const roster = players(5);
    const round: ScheduleRound = {
      round: 1,
      resting: [roster[0]],
      courts: [{ type: "doubles", players: [roster[0], roster[1], roster[2], roster[3]] }],
      courtLimit: 1,
      restRule: calculateRestRule(5, 1, "fixed", 1),
      approvedExceptions: [],
      createdAt: new Date(0).toISOString(),
    };
    const validation = validateSchedule(roster, [round]);
    expect(validation.issues.some(issue => issue.code === "duplicate_assignment")).toBe(true);
    expect(validation.issues.some(issue => issue.code === "invalid_partition")).toBe(true);
  });

  it("등록되지 않은 참가자와 코트 제한 초과를 검출한다", () => {
    const roster = players(4);
    const outsider = { id: 99, name: "미등록", skill: 0 };
    const round: ScheduleRound = {
      round: 1,
      resting: [],
      courts: [
        { type: "doubles", players: [roster[0], roster[1], roster[2], outsider] },
        { type: "singles", players: [roster[3], outsider] },
      ],
      courtLimit: 1,
      restRule: calculateRestRule(4, 0, "fixed", 0),
      approvedExceptions: [],
      createdAt: new Date(0).toISOString(),
    };
    const validation = validateSchedule(roster, [round]);
    expect(validation.issues.some(issue => issue.code === "unknown_player")).toBe(true);
    expect(validation.issues.some(issue => issue.code === "court_limit")).toBe(true);
  });
});

describe("휴식 기준과 승인 예외", () => {
  it("고정 기준과 동적 기준을 구분해 스냅샷으로 계산한다", () => {
    expect(calculateRestRule(13, 3, "fixed", 7).minimumGap).toBe(7);
    expect(calculateRestRule(13, 3, "dynamic", 7).minimumGap).toBe(3);
  });

  it("승인된 휴식 편차가 이후 라운드를 다시 차단하지 않는다", () => {
    const roster = players(8);
    const first = generateManualRound(roster, roster.slice(0, 4), [], 1, [], fixedOptions).round;
    const secondRest = [roster[0], roster[4], roster[5], roster[6]];
    expect(() => generateManualRound(roster, secondRest, [first], 1, [], fixedOptions)).toThrow(ScheduleRuleError);
    const second = generateManualRound(roster, secondRest, [first], 1, [], { ...fixedOptions, allowRestImbalance: true, exceptionReason: "본인 희망" }).round;
    expect(second.approvedExceptions).toHaveLength(1);
    const thirdRest = [roster[1], roster[2], roster[4], roster[7]];
    const third = generateManualRound(roster, thirdRest, [first, second], 1, [], fixedOptions).round;
    const validation = validateSchedule(roster, [first, second, third]);
    expect(validation.approvedIssues.some(issue => issue.round === 2 && issue.code === "rest_imbalance")).toBe(true);
    expect(validation.issues.some(issue => issue.round === 2 && issue.code === "rest_imbalance")).toBe(false);
  });

  it("휴식 조합은 순환 후 재사용할 수 있지만 최소 휴식 간격 위반은 차단한다", () => {
    const roster = players(8);
    const first = generateManualRound(roster, roster.slice(0, 4), [], 1, [], { restGapMode: "fixed", fixedMinimumGap: 2 }).round;
    expect(() => generateManualRound(roster, roster.slice(0, 4), [first], 1, [], { restGapMode: "fixed", fixedMinimumGap: 2, allowRestImbalance: true })).toThrow(ScheduleRuleError);
    const repeated = generateManualRound(roster, roster.slice(0, 4), [first], 1, [], {
      restGapMode: "fixed",
      fixedMinimumGap: 1,
      allowRestImbalance: true,
    }).round;
    expect(validateSchedule(roster, [first, repeated]).issues.filter(issue => issue.code === "duplicate_rest_group")).toEqual([]);
  });

  it("직접 휴식으로 지정한 참가자는 최소 휴식 간격 예외를 기록하고 허용한다", () => {
    const roster = players(8);
    const options = { restGapMode: "fixed" as const, fixedMinimumGap: 3 };
    const first = generateManualRound(roster, roster.slice(0, 4), [], 1, [], options).round;
    const second = generateManualRound(roster, roster.slice(4), [first], 1, [], options).round;
    const selectedRestIds = roster.slice(0, 4).map(player => player.id);

    expect(() => generateManualRound(roster, roster.slice(0, 4), [first, second], 1, [], options)).toThrow(ScheduleRuleError);

    const third = generateManualRound(roster, roster.slice(0, 4), [first, second], 1, [], {
      ...options,
      allowMinimumRestGapPlayerIds: selectedRestIds,
    }).round;
    const validation = validateSchedule(roster, [first, second, third]);

    expect(third.approvedExceptions.every(exception => exception.code === "minimum_rest_gap")).toBe(true);
    expect(new Set(third.approvedExceptions.flatMap(exception => exception.playerIds))).toEqual(new Set(selectedRestIds));
    expect(third.approvedExceptions.every(exception => exception.priorRestRound === 1 && exception.actualGap === 2 && exception.minimumGap === 3)).toBe(true);
    expect(validation.issues.filter(issue => issue.round === 3)).toEqual([]);
    expect(validation.approvedIssues.filter(issue => issue.round === 3 && issue.code === "minimum_rest_gap")).toHaveLength(4);
  });
});
