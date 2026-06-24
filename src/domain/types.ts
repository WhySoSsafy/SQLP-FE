export const UNDERSTANDING_VALUES = ["잘함", "애매", "모름"] as const;
export type Understanding = (typeof UNDERSTANDING_VALUES)[number];

export const SUBJECT_AREAS = [
  "데이터 모델링의 이해",
  "SQL 기본 및 활용",
  "SQL 고급 활용 및 튜닝",
] as const;
export type SubjectArea = (typeof SUBJECT_AREAS)[number];

export interface RawParticipantAnalysis {
  name: string;
  is_correct: boolean;
  understanding: Understanding;
  concepts_covered: string[];
  concepts_missed: string[];
  errors: string[];
  review_required: boolean;
}

export interface RawProblemAnalysis {
  problem_number: number;
  subject_area: SubjectArea;
  concepts: string[];
  solution_summary: string;
  participants: RawParticipantAnalysis[];
}

export interface RawLearningSession {
  session_date: string;
  book: string;
  speakers: string[];
  problems: RawProblemAnalysis[];
}

export interface ParticipantAnalysis extends RawParticipantAnalysis {}

export interface ProblemAnalysis extends RawProblemAnalysis {
  id: string;
  participants: ParticipantAnalysis[];
}

export interface LearningSession {
  id: string;
  session_date: string;
  book: string;
  speakers: string[];
  problems: ProblemAnalysis[];
  created_at: string;
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationPreview {
  sessionDate: string;
  book: string;
  problemCount: number;
  participantCount: number;
  conceptTags: string[];
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  session?: LearningSession;
  preview?: ValidationPreview;
}

/**
 * 분석 JSON 검증 API(POST /api/analysis/validate/) 응답.
 *
 * 백엔드 응답 스키마가 확정 전이라 모든 필드를 optional로 두고 방어적으로 처리한다.
 * - ok가 false거나 errors가 있으면 검증 실패로 본다.
 * - preview/session/message는 백엔드가 내려줄 때만 사용한다.
 *
 * TODO(backend): 분석 검증 응답 스키마 확정 시 필드를 재확인한다.
 */
export interface AnalysisValidationResponse {
  ok?: boolean;
  message?: string;
  errors?: ValidationError[];
  preview?: ValidationPreview;
  session?: LearningSession;
}

export interface SessionSummary {
  id: string;
  date: string;
  book: string;
  problemCount: number;
  speakers: string[];
  averageUnderstanding: number;
  reviewRequiredCount: number;
}

/** 학습 캘린더의 하루치 학습 항목. */
export interface CalendarDayEntry {
  /** "YYYY-MM-DD" */
  date: string;
  problemCount: number;
  /** 0~100 */
  averageUnderstanding: number;
  reviewRequiredCount: number;
  concepts: string[];
  speakers: string[];
  completed?: boolean;
}

/** 학습 캘린더 월별 요약. */
export interface CalendarMonthSummary {
  studyStreak: number;
  totalProblemCount: number;
  reviewRequiredCount: number;
}

/**
 * 학습 캘린더 조회 API(GET /api/calendar/?year=&month=) 응답.
 *
 * 백엔드 스키마가 확정 전이라 모든 필드를 optional로 두고 방어적으로 처리한다.
 * (days가 없으면 빈 달, summary가 없으면 days로부터 합계를 계산한다.)
 *
 * TODO(backend): 캘린더 응답 스키마(필드명/날짜별 항목 구조) 확정 시 재확인한다.
 */
export interface CalendarResponse {
  year?: number;
  month?: number;
  days?: CalendarDayEntry[];
  summary?: CalendarMonthSummary;
}

/** 스터디원 비교 - 한 스터디원의 요약 지표. */
export interface StudyComparisonMember {
  name: string;
  /** 0~100 */
  averageUnderstanding: number;
  /** 잘함 개수 */
  goodCount: number;
  /** 애매 개수 */
  vagueCount: number;
  /** 모름 개수 */
  unknownCount: number;
}

/** 스터디원 비교 - 개념(문제)별 스터디원 이해도. */
export interface StudyComparisonRow {
  id: number;
  concept: string;
  subject: string;
  /** 스터디원 이름 → 이해도 */
  understandings: Record<string, Understanding>;
}

/**
 * 스터디원 비교 조회 API(GET /api/study-comparison/) 응답.
 *
 * 현재 화면은 두 스터디원의 개념별 이해도 비교 UI이므로 그 표시에 필요한 형태로 정의한다.
 * 백엔드 스키마가 확정 전이라 모든 필드를 optional로 두고 방어적으로 처리한다.
 *
 * TODO(backend): 응답 스키마(멤버 수/필드명/차트 데이터 포함 여부, 필터·정렬 쿼리) 확정 시 재확인한다.
 */
export interface StudyComparisonResponse {
  /** 비교 대상 설명 (예: "SQLP 실전문제 (2026-06-12)") */
  title?: string;
  members?: StudyComparisonMember[];
  rows?: StudyComparisonRow[];
}

export interface DashboardSummary {
  weeklyProblemCount: number;
  reviewRequiredCount: number;
  averageUnderstanding: number;
  studyStreak: number;
}

export interface ReviewRecommendation {
  concept: string;
  subject: SubjectArea;
  reason: string;
  score: number;
}

export interface WeakConcept {
  name: string;
  subject: SubjectArea;
  totalProblems: number;
  weakCountByParticipant: Record<string, number>;
  scoreByParticipant: Record<string, number>;
  averageScore: number;
  lastReviewDate: string;
  recommend: boolean;
}

export interface WrongAnswerItem {
  id: string;
  sessionId: string;
  problemId: string;
  problemNumber: number;
  sessionDate: string;
  book: string;
  person: string;
  concepts: string[];
  understanding: Understanding;
  missed: string[];
  errors: string[];
  explanation: string;
  isCorrect: boolean;
  reviewRequired: boolean;
}
