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
