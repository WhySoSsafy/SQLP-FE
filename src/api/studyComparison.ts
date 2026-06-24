/**
 * 스터디원 비교 API 호출.
 *
 * 스터디원별 개념 이해도/요약 비교 데이터를 조회한다.
 * 화면(view)은 이 함수를 호출만 하고, HTTP·엔드포인트 경로·응답 타입은
 * api 계층이 책임진다. (sessions.ts / analytics.ts / calendar.ts와 같은 패턴)
 */

import { apiClient } from "./client";
import { STUDY_COMPARISON_ENDPOINT } from "./endpoints";
import type { StudyComparisonResponse } from "@/domain/types";

/**
 * 스터디원 비교 데이터를 조회한다. (인증 필요)
 * 실패 시 ApiError를 throw하며, 폴백 처리는 호출부가 담당한다.
 *
 * TODO(backend): 기간/그룹 필터가 필요하면 query 파라미터를 추가한다. (예: { period, groupId })
 */
export function fetchStudyComparison(): Promise<StudyComparisonResponse> {
  return apiClient.get<StudyComparisonResponse>(STUDY_COMPARISON_ENDPOINT);
}
