/**
 * API 모듈 공개 진입점.
 *
 * 화면/도메인 코드에서는 항상 이 모듈을 통해 import 한다.
 *   import { apiClient, ApiError, toApiError } from "@/app/api";
 *
 * ── 호출 예시 ─────────────────────────────────────────────
 * // 조회 (GET)
 * const sessions = await apiClient.get<SessionSummary[]>("/api/sessions/");
 *
 * // 쿼리 파라미터
 * const calendar = await apiClient.get("/api/calendar/", { query: { year: 2026, month: 6 } });
 *
 * // 생성 (POST) — body는 자동으로 JSON 직렬화된다.
 * const result = await apiClient.post("/api/analysis/validate/", payload);
 *
 * // 인증 없이 호출 (로그인/회원가입)
 * const auth = await apiClient.post("/api/auth/login/", { email, password }, { skipAuth: true });
 *
 * // 수정 (PATCH) / 삭제 (DELETE)
 * await apiClient.patch(`/api/wrong-answers/${id}/`, { done: true });
 * await apiClient.del(`/api/sessions/${id}/`);
 *
 * ── 에러 처리 예시 ────────────────────────────────────────
 * try {
 *   await apiClient.post("/api/sessions/", payload);
 * } catch (error) {
 *   const apiError = toApiError(error);
 *   console.log(apiError.status);      // HTTP 상태 코드
 *   console.log(apiError.code);        // 백엔드 에러 코드 (예: VALIDATION_ERROR)
 *   console.log(apiError.message);     // 사용자에게 보여줄 메시지
 *   console.log(apiError.fieldErrors); // [{ path, message }] 필드별 검증 에러
 *   console.log(apiError.original);    // 원본 에러
 * }
 */

export { apiClient, API_BASE_URL, toApiError } from "./client";
export {
  ApiError,
  toApiErrorFromResponse,
  toApiErrorFromNetwork,
} from "./errors";
export {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
} from "./tokens";
export type {
  ApiErrorEnvelope,
  ApiFieldError,
  HttpMethod,
  RequestOptions,
} from "./types";
