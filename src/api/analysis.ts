/**
 * 분석 JSON 검증 API 호출.
 *
 * 외부 AI가 생성한 SQLP 풀이 분석 JSON을 학습 기록으로 등록하기 전에
 * 백엔드(/api/analysis/validate/)로 검증한다.
 * 화면(view)은 이 함수를 호출만 하고, HTTP·엔드포인트 경로·응답 타입은
 * api 계층이 책임진다. (sessions.ts / analytics.ts와 같은 패턴)
 */

import { apiClient } from "./client";
import { ANALYSIS_VALIDATE_ENDPOINT } from "./endpoints";
import type { AnalysisValidationResponse } from "@/domain/types";

/**
 * 분석 JSON(파싱된 객체)을 백엔드로 보내 검증한다. (인증 필요)
 * 검증 실패가 에러 응답(4xx envelope)으로 오면 ApiError를 throw하므로 호출부에서 처리한다.
 *
 * @param payload JSON.parse를 통과한 분석 JSON 객체
 */
export function validateAnalysisJson(payload: unknown): Promise<AnalysisValidationResponse> {
  return apiClient.post<AnalysisValidationResponse>(ANALYSIS_VALIDATE_ENDPOINT, payload);
}
