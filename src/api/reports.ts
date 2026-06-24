/**
 * 학습 리포트 API 호출.
 *
 * 성장 리포트 등 백엔드 집계 리포트를 조회한다.
 * 화면(view)은 이 함수를 호출만 하고, HTTP·엔드포인트 경로·응답 타입은
 * api 계층이 책임진다. (analytics.ts / calendar.ts와 같은 패턴)
 */

import { apiClient } from "./client";
import { GROWTH_REPORT_ENDPOINT } from "./endpoints";
import type { GrowthReport } from "@/domain/types";

/**
 * 학습 성장 리포트를 조회한다. (인증 필요)
 * 실패 시 ApiError를 throw하며, 폴백 처리는 호출부가 담당한다.
 *
 * TODO(backend): 기간 필터가 필요하면 query 파라미터를 추가한다. (예: { period })
 */
export function fetchGrowthReport(): Promise<GrowthReport> {
  return apiClient.get<GrowthReport>(GROWTH_REPORT_ENDPOINT);
}
