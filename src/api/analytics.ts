/**
 * 학습 분석/통계 리포트 API 호출.
 *
 * 프론트에서 세션 데이터로 직접 계산하던 리포트(대시보드 요약, 세션별 요약,
 * 취약 개념, 복습 추천, 오답 목록)를 백엔드 집계 결과로 조회한다.
 * 데이터 계층(domain/analytics.ts)은 이 함수를 호출만 하고,
 * HTTP·엔드포인트 경로·응답 타입은 api 계층이 책임진다. (sessions.ts와 같은 패턴)
 */

import { apiClient } from "./client";
import {
  ANALYTICS_DASHBOARD_ENDPOINT,
  ANALYTICS_RECOMMENDATIONS_ENDPOINT,
  ANALYTICS_SESSION_SUMMARIES_ENDPOINT,
  ANALYTICS_WEAK_CONCEPTS_ENDPOINT,
  ANALYTICS_WRONG_ANSWERS_ENDPOINT,
} from "./endpoints";
import type {
  DashboardSummary,
  ReviewRecommendation,
  SessionSummary,
  WeakConcept,
  WrongAnswerItem,
} from "@/domain/types";

/** 홈 대시보드 요약(주간 풀이 수, 복습 필요 수, 평균 이해도, 연속 학습일). */
export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiClient.get<DashboardSummary>(ANALYTICS_DASHBOARD_ENDPOINT);
}

/** 학습 세션별 요약 목록(이해도/복습 필요 수 등 집계 포함). */
export function fetchSessionSummaries(): Promise<SessionSummary[]> {
  return apiClient.get<SessionSummary[]>(ANALYTICS_SESSION_SUMMARIES_ENDPOINT);
}

/** 참여자별 점수/취약 횟수가 집계된 취약 개념 목록. */
export function fetchWeakConcepts(): Promise<WeakConcept[]> {
  return apiClient.get<WeakConcept[]>(ANALYTICS_WEAK_CONCEPTS_ENDPOINT);
}

/**
 * 우선 복습 추천 목록.
 * limit이 주어지면 ?limit= 쿼리로 전달한다. (undefined면 client가 자동 제외)
 */
export function fetchReviewRecommendations(limit?: number): Promise<ReviewRecommendation[]> {
  return apiClient.get<ReviewRecommendation[]>(ANALYTICS_RECOMMENDATIONS_ENDPOINT, {
    query: { limit },
  });
}

/** 오답노트용 오답/복습 필요 항목 목록. */
export function fetchWrongAnswerItems(): Promise<WrongAnswerItem[]> {
  return apiClient.get<WrongAnswerItem[]>(ANALYTICS_WRONG_ANSWERS_ENDPOINT);
}
