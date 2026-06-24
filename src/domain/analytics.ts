/**
 * 학습 분석/통계 리포트 도메인 함수.
 *
 * 과거에는 프론트에서 세션 데이터(LearningSession[])로 직접 집계/계산했지만,
 * [106] 작업에서 백엔드 분석 API 조회 기반으로 교체했다.
 * 화면(view)은 기존과 동일한 함수명을 그대로 import 하되, 이제 Promise를 await 한다.
 * 실제 HTTP 호출은 api 계층(@/api → src/api/analytics.ts)이 담당한다.
 * (storage.ts가 sessions API를 감싸는 것과 동일한 domain→api 레이어링)
 */

import {
  fetchDashboardSummary,
  fetchReviewRecommendations,
  fetchSessionSummaries,
  fetchWeakConcepts,
  fetchWrongAnswerItems,
} from "@/api";
import type {
  DashboardSummary,
  ReviewRecommendation,
  SessionSummary,
  WeakConcept,
  WrongAnswerItem,
} from "./types";

/** 학습 세션별 요약 목록을 조회한다. */
export function summarizeSessions(): Promise<SessionSummary[]> {
  return fetchSessionSummaries();
}

/** 홈 대시보드 요약(주간 풀이 수, 복습 필요 수, 평균 이해도, 연속 학습일)을 조회한다. */
export function buildDashboardSummary(): Promise<DashboardSummary> {
  return fetchDashboardSummary();
}

/** 취약 개념 목록(참여자별 점수/취약 횟수 집계 포함)을 조회한다. */
export function buildWeakConcepts(): Promise<WeakConcept[]> {
  return fetchWeakConcepts();
}

/** 우선 복습 추천 목록을 조회한다. (limit 기본 3) */
export function buildReviewRecommendations(limit = 3): Promise<ReviewRecommendation[]> {
  return fetchReviewRecommendations(limit);
}

/** 오답노트용 오답/복습 필요 항목 목록을 조회한다. */
export function buildWrongAnswerItems(): Promise<WrongAnswerItem[]> {
  return fetchWrongAnswerItems();
}
