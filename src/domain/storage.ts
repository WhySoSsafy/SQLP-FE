import type { LearningSession } from "./types";
import { createMockSessions } from "./mockData";
import { createSession, fetchSessions, toApiError } from "@/api";

// 실제 학습 세션은 백엔드 API로 관리한다. (localStorage에 더 이상 저장하지 않는다)
// 아래 키들은 개발용 mock 데이터와 UI 선택 상태 보존에만 쓰인다.
export const MOCK_SESSION_STORAGE_KEY = "sqlp_ai_coach.mock_sessions.v1";
export const SELECTED_SESSION_KEY = "sqlp_ai_coach.selected_session.v1";

export interface SaveSessionResult {
  ok: boolean;
  error?: string;
}

export async function loadSessions(): Promise<LearningSession[]> {
  const real = await loadRealSessions();
  // 개발용 mock 데이터는 여전히 localStorage에서 가져와 함께 보여준다.
  return [...real, ...loadMockSessions()].sort(compareSessionsDesc);
}

export async function loadRealSessions(): Promise<LearningSession[]> {
  try {
    return await fetchSessions();
  } catch {
    // 목록 조회 실패 시에도 화면이 깨지지 않도록 빈 배열로 폴백한다.
    // (mock 데이터는 loadSessions에서 별도로 합쳐진다)
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

export async function saveSession(session: LearningSession): Promise<SaveSessionResult> {
  try {
    const created = await createSession(session);

    // 방금 등록한 세션을 선택 상태로 둔다. (서버 발급 id가 있으면 그것을 사용)
    setSelectedSessionId(created?.id ?? session.id);

    return { ok: true };
  } catch (error) {
    const apiError = toApiError(error);

    // 중복 세션은 백엔드가 DUPLICATE_SESSION 코드로 내려준다. (기존 UX 문구 유지)
    if (apiError.code === "DUPLICATE_SESSION") {
      return {
        ok: false,
        error: "같은 날짜, 문제집명, 문제번호 구성을 가진 학습 세션이 이미 저장되어 있습니다.",
      };
    }

    return {
      ok: false,
      error: apiError.message || "학습 세션을 저장하지 못했습니다.",
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
