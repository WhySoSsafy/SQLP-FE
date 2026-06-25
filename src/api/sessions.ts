/**
 * 학습 세션 관련 API 호출.
 *
 * [test/mock-mode] 백엔드 없이 MOCK_SESSIONS 데이터를 반환한다.
 * participant에 안정적인 numeric ID를 주입해 댓글 기능이 동작하도록 한다.
 */

import type { LearningSession } from "@/domain/types";
import { MOCK_SESSIONS } from "@/mocks/data";

// MOCK_SESSIONS 순서대로 순회하며 (problemId :: participantName) → numeric ID 매핑을 빌드한다.
// 이 맵은 모듈 로드 시 한 번 생성되므로 fetchSessionDetail 호출 순서와 무관하게 ID가 안정적이다.
const _participantIdMap = new Map<string, number>();
let _nextId = 1;
for (const s of MOCK_SESSIONS) {
  for (const p of s.problems) {
    for (const pt of p.participants) {
      const key = `${p.id}::${pt.name}`;
      if (!_participantIdMap.has(key)) {
        _participantIdMap.set(key, _nextId++);
      }
    }
  }
}

function hydrateSession(session: LearningSession): LearningSession {
  return {
    ...session,
    problems: session.problems.map((p) => ({
      ...p,
      participants: p.participants.map((pt) => ({
        ...pt,
        id: _participantIdMap.get(`${p.id}::${pt.name}`),
      })),
    })),
  };
}

export function fetchSessions(): Promise<LearningSession[]> {
  return Promise.resolve(MOCK_SESSIONS.map((s) => ({ ...s, problems: [] })));
}

export function fetchSessionDetail(id: string): Promise<LearningSession> {
  const session = MOCK_SESSIONS.find((s) => s.id === id) ?? MOCK_SESSIONS[0];
  return Promise.resolve(hydrateSession(session));
}

export function createSession(session: LearningSession): Promise<LearningSession> {
  return Promise.resolve(session);
}
