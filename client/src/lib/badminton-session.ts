import { RestGapMode, SchedulePlayer, ScheduleRound } from "./badminton-scheduler";

export const BADMINTON_SESSION_VERSION = 2;
const SESSIONS_KEY = "badminton_sessions_v2";
const ACTIVE_SESSION_KEY = "badminton_active_session_v2";

export interface BadmintonFeatureFlags {
  confirmBeforeFinalize: boolean;
  autoSaveDraft: boolean;
  requireExceptionReason: boolean;
  enableAlternatives: boolean;
  enableLiveMode: boolean;
  showSessionSummary: boolean;
}

export interface BadmintonSessionSettings extends BadmintonFeatureFlags {
  restGapMode: RestGapMode;
  fixedMinimumGap: number;
}

export interface BadmintonSession {
  version: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  owner?: { provider: "local" | "google" | "naver"; subject: string };
  players: SchedulePlayer[];
  requestedCourts: number;
  restOrder: number[];
  rounds: ScheduleRound[];
  settings: BadmintonSessionSettings;
}

export const defaultFeatureFlags: BadmintonFeatureFlags = {
  confirmBeforeFinalize: true,
  autoSaveDraft: true,
  requireExceptionReason: false,
  enableAlternatives: false,
  enableLiveMode: false,
  showSessionSummary: true,
};

export function createSession(input: {
  name?: string;
  players: SchedulePlayer[];
  requestedCourts: number;
  restOrder: number[];
  restGapMode: RestGapMode;
  fixedMinimumGap: number;
  flags?: Partial<BadmintonFeatureFlags>;
}): BadmintonSession {
  const now = new Date().toISOString();
  return {
    version: BADMINTON_SESSION_VERSION,
    id: `badminton-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name?.trim() || `배드민턴 ${new Date().toLocaleDateString("ko-KR")}`,
    createdAt: now,
    updatedAt: now,
    players: input.players,
    requestedCourts: input.requestedCourts,
    restOrder: input.restOrder,
    rounds: [],
    settings: {
      restGapMode: input.restGapMode,
      fixedMinimumGap: input.fixedMinimumGap,
      ...defaultFeatureFlags,
      ...input.flags,
    },
  };
}

export function normalizeSession(value: BadmintonSession): BadmintonSession {
  const incomingSettings = value.settings || ({} as BadmintonSessionSettings);
  return {
    ...value,
    version: BADMINTON_SESSION_VERSION,
    rounds: value.rounds || [],
    restOrder: value.restOrder?.length ? value.restOrder : value.players.map(player => player.id),
    settings: {
      restGapMode: incomingSettings.restGapMode || "fixed",
      fixedMinimumGap: incomingSettings.fixedMinimumGap || 0,
      confirmBeforeFinalize: incomingSettings.confirmBeforeFinalize ?? defaultFeatureFlags.confirmBeforeFinalize,
      autoSaveDraft: incomingSettings.autoSaveDraft ?? defaultFeatureFlags.autoSaveDraft,
      requireExceptionReason: incomingSettings.requireExceptionReason ?? defaultFeatureFlags.requireExceptionReason,
      enableAlternatives: incomingSettings.enableAlternatives ?? defaultFeatureFlags.enableAlternatives,
      enableLiveMode: incomingSettings.enableLiveMode ?? defaultFeatureFlags.enableLiveMode,
      showSessionSummary: incomingSettings.showSessionSummary ?? defaultFeatureFlags.showSessionSummary,
    },
  };
}

export function listSessions(): BadmintonSession[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]") as BadmintonSession[];
    return parsed.map(normalizeSession).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function saveSession(session: BadmintonSession): BadmintonSession {
  const next = normalizeSession({ ...session, updatedAt: new Date().toISOString() });
  const sessions = listSessions().filter(item => item.id !== next.id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([next, ...sessions]));
  localStorage.setItem(ACTIVE_SESSION_KEY, next.id);
  return next;
}

export function loadSession(id: string): BadmintonSession | null {
  return listSessions().find(session => session.id === id) || null;
}

export function loadActiveSession(): BadmintonSession | null {
  const id = localStorage.getItem(ACTIVE_SESSION_KEY);
  return id ? loadSession(id) : null;
}

export function setActiveSession(id: string) {
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export function deleteSession(id: string) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(listSessions().filter(session => session.id !== id)));
  if (localStorage.getItem(ACTIVE_SESSION_KEY) === id) localStorage.removeItem(ACTIVE_SESSION_KEY);
}
