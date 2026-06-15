import type { LearningSession } from "./types";
import { createMockSessions } from "./mockData";

export const SESSION_STORAGE_KEY = "sqlp_ai_coach.sessions.v1";
export const MOCK_SESSION_STORAGE_KEY = "sqlp_ai_coach.mock_sessions.v1";
export const SELECTED_SESSION_KEY = "sqlp_ai_coach.selected_session.v1";

export interface SaveSessionResult {
  ok: boolean;
  error?: string;
}

export function loadSessions(): LearningSession[] {
  return [...loadRealSessions(), ...loadMockSessions()].sort(compareSessionsDesc);
}

export function loadRealSessions(): LearningSession[] {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed as LearningSession[];
  } catch {
    return [];
  }
}

export function loadMockSessions(): LearningSession[] {
  try {
    const raw = window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed as LearningSession[];
  } catch {
    return [];
  }
}

export function hasMockSessions(): boolean {
  return loadMockSessions().length > 0;
}

export function seedMockSessions(): SaveSessionResult {
  try {
    const mockSessions = createMockSessions();
    window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(mockSessions));
    window.localStorage.setItem(SELECTED_SESSION_KEY, mockSessions[0]?.id ?? "");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "브라우저 저장소에 Mock 데이터를 저장하지 못했습니다.",
    };
  }
}

export function clearMockSessions(): SaveSessionResult {
  try {
    window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);

    const selectedId = getSelectedSessionId();
    if (selectedId?.startsWith("mock-")) {
      window.localStorage.removeItem(SELECTED_SESSION_KEY);
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "브라우저 저장소에서 Mock 데이터를 삭제하지 못했습니다.",
    };
  }
}

export function saveSession(session: LearningSession): SaveSessionResult {
  try {
    const sessions = loadRealSessions();

    if (sessions.some((existing) => isDuplicateSession(existing, session))) {
      return {
        ok: false,
        error: "같은 날짜, 문제집명, 문제번호 구성을 가진 학습 세션이 이미 저장되어 있습니다.",
      };
    }

    const next = [session, ...sessions].sort(compareSessionsDesc);

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
    window.localStorage.setItem(SELECTED_SESSION_KEY, session.id);

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "브라우저 저장소에 학습 세션을 저장하지 못했습니다.",
    };
  }
}

export function setSelectedSessionId(sessionId: string): void {
  try {
    window.localStorage.setItem(SELECTED_SESSION_KEY, sessionId);
  } catch {
    // Selection persistence is helpful but non-critical.
  }
}

export function getSelectedSessionId(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_SESSION_KEY);
  } catch {
    return null;
  }
}

export function getSelectedOrNewestSession(
  sessions: LearningSession[],
  selectedId: string | null,
): LearningSession | null {
  if (sessions.length === 0) return null;

  return sessions.find((session) => session.id === selectedId) ?? getNewestSession(sessions);
}

export function getNewestSession(sessions: LearningSession[]): LearningSession | null {
  return sessions.slice().sort(compareSessionsDesc)[0] ?? null;
}

export function compareSessionsDesc(a: LearningSession, b: LearningSession): number {
  if (a.session_date !== b.session_date) {
    return b.session_date.localeCompare(a.session_date);
  }

  return b.created_at.localeCompare(a.created_at);
}

function isDuplicateSession(a: LearningSession, b: LearningSession): boolean {
  if (a.session_date !== b.session_date || a.book !== b.book) return false;

  return getProblemNumberSetKey(a) === getProblemNumberSetKey(b);
}

function getProblemNumberSetKey(session: LearningSession): string {
  return Array.from(new Set(session.problems.map((problem) => problem.problem_number)))
    .sort((a, b) => a - b)
    .join(",");
}
