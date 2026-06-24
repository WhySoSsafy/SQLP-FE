/**
 * 백엔드 API 엔드포인트 경로 상수.
 *
 * 백엔드 명세가 아직 확정 전이라 경로가 바뀔 수 있다.
 * 다른 코드는 경로 문자열을 직접 쓰지 말고 반드시 아래 상수를 사용한다.
 * 명세 변경 시 이 파일만 고치면 된다.
 *
 * TODO(backend): 백엔드 최종 명세 확정 시 경로를 재확인/수정한다.
 *   - 현재 값은 SQLP-BE/accounts/urls.py 기준이다.
 */

/** 로그인. POST → { access, refresh, user? } */
export const LOGIN_ENDPOINT = "/api/auth/login/";

/** 회원가입. POST { name, email, password } → { ok, user } (토큰 미발급) */
export const REGISTER_ENDPOINT = "/api/auth/register/";

/** access 토큰 재발급. POST { refresh } → { access } (SimpleJWT TokenRefreshView) */
export const REFRESH_ENDPOINT = "/api/auth/refresh/";

/** 내 정보 조회. GET → User */
export const ME_ENDPOINT = "/api/users/me/";

/**
 * 학습 세션 목록 조회 / 등록.
 *   GET  → LearningSession[]
 *   POST { ...LearningSession } → LearningSession (서버 발급 id 포함)
 *
 * TODO(backend): 최종 명세 확정 시 응답 본문 형태(목록/등록)를 재확인한다.
 */
export const SESSIONS_ENDPOINT = "/api/sessions/";

/**
 * 학습 분석/통계 리포트 조회. (모두 GET, 인증 필요)
 *
 * 프론트에서 세션 데이터로 직접 계산하던 리포트를 백엔드가 집계해 내려준다.
 * 기존 /api/sessions/ 네이밍과 일관되게 /api/analytics/* 네임스페이스로 둔다.
 *
 * TODO(backend): 아래 경로/응답 형태는 가정값이다. 분석 API 명세 확정 시 재확인한다.
 *   - GET /api/analytics/dashboard/       → DashboardSummary
 *   - GET /api/analytics/sessions/        → SessionSummary[]
 *   - GET /api/analytics/weak-concepts/   → WeakConcept[]
 *   - GET /api/analytics/recommendations/ → ReviewRecommendation[]  (?limit=)
 *   - GET /api/analytics/wrong-answers/   → WrongAnswerItem[]
 */
export const ANALYTICS_DASHBOARD_ENDPOINT = "/api/analytics/dashboard/";
export const ANALYTICS_SESSION_SUMMARIES_ENDPOINT = "/api/analytics/sessions/";
export const ANALYTICS_WEAK_CONCEPTS_ENDPOINT = "/api/analytics/weak-concepts/";
export const ANALYTICS_RECOMMENDATIONS_ENDPOINT = "/api/analytics/recommendations/";
export const ANALYTICS_WRONG_ANSWERS_ENDPOINT = "/api/analytics/wrong-answers/";

/**
 * 분석 JSON 검증.
 *   POST { ...분석 JSON } → AnalysisValidationResponse
 *
 * 외부 AI가 생성한 분석 JSON을 등록 전에 백엔드 규칙으로 검증한다.
 * TODO(backend): 검증 응답 본문 형태 확정 시 재확인한다.
 */
export const ANALYSIS_VALIDATE_ENDPOINT = "/api/analysis/validate/";

/**
 * 학습 캘린더 조회.
 *   GET ?year=&month= → CalendarResponse
 *
 * 월별 날짜별 학습 항목/요약을 조회한다. (year/month 쿼리로 해당 월 데이터를 받는다)
 * TODO(backend): 쿼리 파라미터(year/month 또는 start/end)와 응답 스키마 확정 시 재확인한다.
 */
export const CALENDAR_ENDPOINT = "/api/calendar/";

/**
 * 스터디원 비교 조회.
 *   GET → StudyComparisonResponse
 *
 * 스터디원별 개념 이해도/요약 비교 데이터를 조회한다.
 * TODO(backend): 필터·정렬 쿼리(period/groupId 등) 지원 여부와 응답 스키마 확정 시 재확인한다.
 */
export const STUDY_COMPARISON_ENDPOINT = "/api/study-comparison/";

/**
 * 개념 상세/요약 조회.
 *   GET /api/concepts/{id}/ → ConceptDetail
 *
 * SQLP 교재 PDF를 AI가 개념 단위로 정리한 JSON을 백엔드가 저장/관리하고,
 * 프론트는 이 경로로 특정 개념 요약 데이터를 받아 표시한다. (동적 id → 함수형 상수)
 * TODO(backend): 개념 JSON 응답 스키마(필드명/예시·관련개념 구조) 확정 시 재확인한다.
 */
export const CONCEPT_DETAIL_ENDPOINT = (id: string | number) => `/api/concepts/${id}/`;
