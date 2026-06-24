/**
 * 학습 캘린더 API 호출.
 *
 * 월별 날짜별 학습 항목/요약을 조회한다.
 * 화면(view)은 이 함수를 호출만 하고, HTTP·엔드포인트 경로·응답 타입은
 * api 계층이 책임진다. (sessions.ts / analytics.ts와 같은 패턴)
 */

import { apiClient } from "./client";
import { CALENDAR_ENDPOINT } from "./endpoints";
import type { CalendarResponse } from "@/domain/types";

/**
 * 지정한 연·월의 학습 캘린더를 조회한다. (인증 필요)
 * 실패 시 ApiError를 throw하며, 폴백 처리는 호출부가 담당한다.
 *
 * @param year  4자리 연도 (예: 2026)
 * @param month 1~12 월
 */
export function fetchCalendar(year: number, month: number): Promise<CalendarResponse> {
  return apiClient.get<CalendarResponse>(CALENDAR_ENDPOINT, {
    query: { year, month },
  });
}
