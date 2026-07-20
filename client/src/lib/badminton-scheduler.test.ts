import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  SchedulePlayer,
  ScheduleRound,
  ScheduleRuleError,
  calculateFlexibleLineup,
  calculateRestRule,
  generateManualRound,
  validateSchedule,
} from "./badminton-scheduler";

const players = (count: number): SchedulePlayer[] => Array.from({ length: count }, (_, index) => ({
  id: index + 1,
  name: `참가자${index + 1}`,
  skill: index % 6,
}));

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

  it("같은 휴식 조합 반복과 최소 휴식 간격 위반을 차단한다", () => {
    const roster = players(8);
    const first = generateManualRound(roster, roster.slice(0, 4), [], 1, [], { restGapMode: "fixed", fixedMinimumGap: 2 }).round;
    expect(() => generateManualRound(roster, roster.slice(0, 4), [first], 1, [], { restGapMode: "fixed", fixedMinimumGap: 2, allowRestImbalance: true })).toThrow(ScheduleRuleError);
  });
});
