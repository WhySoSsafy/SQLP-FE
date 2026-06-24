/**
 * 학습 세션 관련 API 호출.
 *
 * 학습 세션(AI 분석 결과 JSON) 목록 조회와 등록 엔드포인트 호출을 한곳에 모은다.
 * 데이터 계층(domain/storage.ts)은 이 함수를 호출만 하고,
 * HTTP·엔드포인트 경로·응답 타입은 api 계층이 책임진다. (auth.ts와 같은 패턴)
 */

import { apiClient } from "./client";
import { SESSIONS_ENDPOINT } from "./endpoints";
import type { LearningSession } from "@/domain/types";

/**
 * 내 학습 세션 전체 목록을 조회한다. (인증 필요)
 * 실패 시 ApiError를 throw하며, 폴백 처리는 호출부가 담당한다.
 */
export function fetchSessions(): Promise<LearningSession[]> {
  return apiClient.get<LearningSession[]>(SESSIONS_ENDPOINT);
}

/**
 * 검증을 마친 학습 세션을 등록한다. (인증 필요)
 * 중복 세션 등 검증 실패 시 백엔드가 ApiError(code: DUPLICATE_SESSION 등)를 내려준다.
 *
 * TODO(backend): 등록 응답 본문이 생성된 세션 전체(서버 발급 id 포함)인지 확정되면 타입을 재확인한다.
 */
export function createSession(session: LearningSession): Promise<LearningSession> {
  return apiClient.post<LearningSession>(SESSIONS_ENDPOINT, session);
}
