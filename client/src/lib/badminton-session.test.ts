import { beforeEach, describe, expect, it } from "vitest";
import { createSession, defaultFeatureFlags, listSessions, loadActiveSession, normalizeSession, saveSession } from "./badminton-session";

beforeEach(() => {
  const values = new Map<string, string>();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
    clear: () => values.clear(),
    key: index => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  } as Storage;
});

describe("배드민턴 세션 모델", () => {
  it("로그인과 점수 기록 확장이 가능한 버전 세션을 만든다", () => {
    const session = createSession({
      name: "테스트 세션",
      players: [{ id: 1, name: "태수", skill: 0, profileId: "local-1" }, { id: 2, name: "준호", skill: 0, profileId: "local-2" }],
      requestedCourts: 1,
      restOrder: [1, 2],
      restGapMode: "fixed",
      fixedMinimumGap: 0,
    });
    expect(session.version).toBe(2);
    expect(session.rounds).toEqual([]);
    expect(session.settings).toMatchObject(defaultFeatureFlags);
    expect(session.players.every(player => Boolean(player.profileId))).toBe(true);
  });

  it("누락된 시험 기능 설정을 기본값으로 복원한다", () => {
    const session = createSession({ players: [{ id: 1, name: "A", skill: 0 }], requestedCourts: 1, restOrder: [1], restGapMode: "dynamic", fixedMinimumGap: 0 });
    const normalized = normalizeSession({ ...session, settings: { ...session.settings, enableLiveMode: undefined as unknown as boolean } });
    expect(normalized.settings.enableLiveMode).toBe(false);
  });

  it("활성 세션을 저장하고 새로고침과 같은 재로드에서 복구한다", () => {
    const session = createSession({ players: [{ id: 1, name: "A", skill: 0 }], requestedCourts: 1, restOrder: [1], restGapMode: "fixed", fixedMinimumGap: 1 });
    saveSession(session);
    expect(listSessions()).toHaveLength(1);
    expect(loadActiveSession()?.id).toBe(session.id);
  });

  it("손상된 저장 목록은 빈 목록으로 안전하게 복구한다", () => {
    localStorage.setItem("badminton_sessions_v2", "{broken");
    expect(listSessions()).toEqual([]);
  });
});
