# SQLP AI Coach React MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Figma Make React/Vite SQLP AI Coach screens into a functional local MVP with strict JSON validation, `localStorage` persistence, and data-driven dashboard, session, detail, weak-concept, and wrong-answer screens.

**Architecture:** Keep the existing React components as presentation surfaces and add a focused domain layer under `src/app/domain`. The domain layer owns types, validation, storage, sample data, and analytics so a later Django API can replace only the storage boundary.

**Tech Stack:** React 18, Vite 6, TypeScript, `localStorage`, Recharts, lucide-react.

---

## File Structure

Create:

- `src/app/domain/types.ts`: shared app types and allowed enum-like constants.
- `src/app/domain/sampleData.ts`: planning-schema sample session used on first run or empty-state fallback.
- `src/app/domain/validation.ts`: JSON parse, schema validation, normalization, preview generation.
- `src/app/domain/storage.ts`: versioned `localStorage` read/write/select helpers.
- `src/app/domain/analytics.ts`: summary metrics, session summaries, weak concepts, wrong-answer notebook items.

Modify:

- `src/app/App.tsx`: keep selected session id and storage refresh state.
- `src/app/components/Layout.tsx`: pass session data and selection callbacks to pages.
- `src/app/components/JsonRegistration.tsx`: replace local mock validation with domain validation and saving.
- `src/app/components/SessionList.tsx`: render saved session summaries instead of static `SESSIONS`.
- `src/app/components/ProblemDetail.tsx`: render selected or newest saved session.
- `src/app/components/Dashboard.tsx`: render analytics from saved sessions.
- `src/app/components/WeakConcepts.tsx`: render concept analytics from saved sessions.
- `src/app/components/WrongAnswers.tsx`: render derived wrong-answer items from saved sessions.

Verification only:

- `npm run build`
- Run local dev server with `npm run dev`
- Manual browser QA for upload, paste, persistence, and data-driven screens

This directory is currently not a Git repository. Do not run `git commit` unless the user initializes Git first.

---

### Task 1: Domain Types

**Files:**

- Create: `src/app/domain/types.ts`

- [ ] **Step 1: Create the type module**

Create `src/app/domain/types.ts` with:

```ts
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
```

- [ ] **Step 2: Build-check the new file**

Run:

```bash
npm run build
```

Expected: build may still pass because the file is unused, or fail only for unrelated existing project issues. Do not proceed if this new file has TypeScript syntax errors.

---

### Task 2: Sample Data

**Files:**

- Create: `src/app/domain/sampleData.ts`

- [ ] **Step 1: Add a planning-schema sample session**

Create `src/app/domain/sampleData.ts` with:

```ts
import type { RawLearningSession } from "./types";

export const SAMPLE_RAW_SESSION: RawLearningSession = {
  session_date: "2026-06-12",
  book: "SQLP 실전문제",
  speakers: ["세은", "수철"],
  problems: [
    {
      problem_number: 1,
      subject_area: "SQL 기본 및 활용",
      concepts: ["OUTER JOIN", "NULL"],
      solution_summary: "NULL을 포함한 OUTER JOIN 결과 집합에서 WHERE 조건 적용 시 예상 결과를 구하는 문제",
      participants: [
        {
          name: "세은",
          is_correct: false,
          understanding: "애매",
          concepts_covered: ["OUTER JOIN 기본 개념"],
          concepts_missed: ["NULL 처리 WHERE 조건"],
          errors: ["= NULL이 NULL을 잡아준다고 오해"],
          review_required: true,
        },
        {
          name: "수철",
          is_correct: false,
          understanding: "모름",
          concepts_covered: [],
          concepts_missed: ["OUTER JOIN 방향", "NULL 처리"],
          errors: ["INNER JOIN과 OUTER JOIN 혼동"],
          review_required: true,
        },
      ],
    },
    {
      problem_number: 2,
      subject_area: "SQL 기본 및 활용",
      concepts: ["GROUP BY", "HAVING"],
      solution_summary: "GROUP BY와 HAVING 절의 실행 순서 및 조건 적용 방식을 이해하는 문제",
      participants: [
        {
          name: "세은",
          is_correct: true,
          understanding: "잘함",
          concepts_covered: ["GROUP BY", "HAVING 실행 순서"],
          concepts_missed: [],
          errors: [],
          review_required: false,
        },
        {
          name: "수철",
          is_correct: false,
          understanding: "애매",
          concepts_covered: ["GROUP BY 기본"],
          concepts_missed: ["HAVING vs WHERE 차이"],
          errors: ["HAVING을 WHERE처럼 사용"],
          review_required: true,
        },
      ],
    },
    {
      problem_number: 3,
      subject_area: "SQL 고급 활용 및 튜닝",
      concepts: ["실행계획", "인덱스"],
      solution_summary: "실행계획 분석을 통해 인덱스 사용 여부와 쿼리 성능을 판단하는 문제",
      participants: [
        {
          name: "세은",
          is_correct: false,
          understanding: "모름",
          concepts_covered: [],
          concepts_missed: ["실행계획 읽는 법", "인덱스 스캔 판단"],
          errors: ["Full Scan이 항상 비효율적이라고 오해"],
          review_required: true,
        },
        {
          name: "수철",
          is_correct: true,
          understanding: "잘함",
          concepts_covered: ["실행계획 해석", "인덱스 스캔 조건"],
          concepts_missed: [],
          errors: [],
          review_required: false,
        },
      ],
    },
  ],
};
```

- [ ] **Step 2: Build-check**

Run:

```bash
npm run build
```

Expected: no TypeScript errors from `sampleData.ts`.

---

### Task 3: Validation and Normalization

**Files:**

- Create: `src/app/domain/validation.ts`

- [ ] **Step 1: Implement strict parsing and validation**

Create `src/app/domain/validation.ts` with:

```ts
import {
  SUBJECT_AREAS,
  UNDERSTANDING_VALUES,
  type LearningSession,
  type RawLearningSession,
  type ValidationError,
  type ValidationPreview,
  type ValidationResult,
} from "./types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);

const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const normalizeIdPart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, "-")
    .replace(/^-+|-+$/g, "");

const makeSessionId = (raw: RawLearningSession): string => {
  const problemNumbers = raw.problems.map((problem) => problem.problem_number).join("-");
  return `${raw.session_date}-${normalizeIdPart(raw.book)}-${problemNumbers}`;
};

const push = (errors: ValidationError[], path: string, message: string) => {
  errors.push({ path, message });
};

export function parseAndValidateSession(input: string): ValidationResult {
  if (!input.trim()) {
    return {
      ok: false,
      errors: [{ path: "$", message: "JSON 내용이 비어 있습니다." }],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON 파싱에 실패했습니다.";
    return {
      ok: false,
      errors: [{ path: "$", message: `JSON 문법 오류: ${message}` }],
    };
  }

  const errors = validateRawSession(parsed);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const raw = parsed as RawLearningSession;
  const session = normalizeSession(raw);
  return {
    ok: true,
    errors: [],
    session,
    preview: createPreview(session),
  };
}

export function validateRawSession(value: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isObject(value)) {
    return [{ path: "$", message: "최상위 JSON은 객체여야 합니다." }];
  }

  if (typeof value.session_date !== "string" || !isValidDateString(value.session_date)) {
    push(errors, "$.session_date", "session_date는 YYYY-MM-DD 형식의 날짜여야 합니다.");
  }

  if (typeof value.book !== "string" || value.book.trim().length === 0) {
    push(errors, "$.book", "book은 비어 있지 않은 문자열이어야 합니다.");
  }

  if (!isStringArray(value.speakers)) {
    push(errors, "$.speakers", "speakers는 비어 있지 않은 문자열 배열이어야 합니다.");
  }

  if (!Array.isArray(value.problems) || value.problems.length === 0) {
    push(errors, "$.problems", "problems는 비어 있지 않은 배열이어야 합니다.");
  }

  const speakers = isStringArray(value.speakers) ? value.speakers : [];
  const problemNumbers = new Set<number>();

  if (Array.isArray(value.problems)) {
    value.problems.forEach((problem, problemIndex) => {
      const problemPath = `$.problems[${problemIndex}]`;
      if (!isObject(problem)) {
        push(errors, problemPath, "문제 항목은 객체여야 합니다.");
        return;
      }

      if (typeof problem.problem_number !== "number" || !Number.isInteger(problem.problem_number)) {
        push(errors, `${problemPath}.problem_number`, "problem_number는 정수여야 합니다.");
      } else if (problemNumbers.has(problem.problem_number)) {
        push(errors, `${problemPath}.problem_number`, `문제번호 ${problem.problem_number}가 중복되었습니다.`);
      } else {
        problemNumbers.add(problem.problem_number);
      }

      if (typeof problem.subject_area !== "string" || !SUBJECT_AREAS.includes(problem.subject_area as never)) {
        push(errors, `${problemPath}.subject_area`, `subject_area는 ${SUBJECT_AREAS.join(", ")} 중 하나여야 합니다.`);
      }

      if (!isStringArray(problem.concepts)) {
        push(errors, `${problemPath}.concepts`, "concepts는 비어 있지 않은 문자열 배열이어야 합니다.");
      }

      if (typeof problem.solution_summary !== "string" || problem.solution_summary.trim().length === 0) {
        push(errors, `${problemPath}.solution_summary`, "solution_summary는 비어 있지 않은 문자열이어야 합니다.");
      }

      if (!Array.isArray(problem.participants) || problem.participants.length === 0) {
        push(errors, `${problemPath}.participants`, "participants는 비어 있지 않은 배열이어야 합니다.");
        return;
      }

      problem.participants.forEach((participant, participantIndex) => {
        const participantPath = `${problemPath}.participants[${participantIndex}]`;
        if (!isObject(participant)) {
          push(errors, participantPath, "참여자 분석은 객체여야 합니다.");
          return;
        }

        if (typeof participant.name !== "string" || participant.name.trim().length === 0) {
          push(errors, `${participantPath}.name`, "name은 비어 있지 않은 문자열이어야 합니다.");
        } else if (speakers.length > 0 && !speakers.includes(participant.name)) {
          push(errors, `${participantPath}.name`, `${participant.name}은 speakers에 포함되어야 합니다.`);
        }

        if (typeof participant.is_correct !== "boolean") {
          push(errors, `${participantPath}.is_correct`, "is_correct는 boolean이어야 합니다.");
        }

        if (typeof participant.understanding !== "string" || !UNDERSTANDING_VALUES.includes(participant.understanding as never)) {
          push(errors, `${participantPath}.understanding`, "understanding은 잘함, 애매, 모름 중 하나여야 합니다.");
        }

        if (!isStringArrayOrEmpty(participant.concepts_covered)) {
          push(errors, `${participantPath}.concepts_covered`, "concepts_covered는 문자열 배열이어야 합니다.");
        }

        if (!isStringArrayOrEmpty(participant.concepts_missed)) {
          push(errors, `${participantPath}.concepts_missed`, "concepts_missed는 문자열 배열이어야 합니다.");
        }

        if (!isStringArrayOrEmpty(participant.errors)) {
          push(errors, `${participantPath}.errors`, "errors는 문자열 배열이어야 합니다.");
        }

        if (typeof participant.review_required !== "boolean") {
          push(errors, `${participantPath}.review_required`, "review_required는 boolean이어야 합니다.");
        }
      });
    });
  }

  return errors;
}

function isStringArrayOrEmpty(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function normalizeSession(raw: RawLearningSession): LearningSession {
  const sessionId = makeSessionId(raw);
  return {
    id: sessionId,
    session_date: raw.session_date,
    book: raw.book.trim(),
    speakers: raw.speakers.map((speaker) => speaker.trim()),
    created_at: new Date().toISOString(),
    problems: raw.problems
      .slice()
      .sort((a, b) => a.problem_number - b.problem_number)
      .map((problem) => ({
        id: `${sessionId}-p${problem.problem_number}`,
        problem_number: problem.problem_number,
        subject_area: problem.subject_area,
        concepts: problem.concepts.map((concept) => concept.trim()),
        solution_summary: problem.solution_summary.trim(),
        participants: problem.participants.map((participant) => ({
          name: participant.name.trim(),
          is_correct: participant.is_correct,
          understanding: participant.understanding,
          concepts_covered: participant.concepts_covered.map((concept) => concept.trim()).filter(Boolean),
          concepts_missed: participant.concepts_missed.map((concept) => concept.trim()).filter(Boolean),
          errors: participant.errors.map((item) => item.trim()).filter(Boolean),
          review_required: participant.review_required,
        })),
      })),
  };
}

export function createPreview(session: LearningSession): ValidationPreview {
  const conceptTags = Array.from(new Set(session.problems.flatMap((problem) => problem.concepts))).slice(0, 8);
  return {
    sessionDate: session.session_date,
    book: session.book,
    problemCount: session.problems.length,
    participantCount: session.speakers.length,
    conceptTags,
  };
}
```

- [ ] **Step 2: Build-check validation**

Run:

```bash
npm run build
```

Expected: no TypeScript errors in `validation.ts`.

---

### Task 4: Local Storage Boundary

**Files:**

- Create: `src/app/domain/storage.ts`

- [ ] **Step 1: Implement session persistence helpers**

Create `src/app/domain/storage.ts` with:

```ts
import type { LearningSession } from "./types";

export const SESSION_STORAGE_KEY = "sqlp_ai_coach.sessions.v1";
export const SELECTED_SESSION_KEY = "sqlp_ai_coach.selected_session.v1";

export interface SaveSessionResult {
  ok: boolean;
  error?: string;
}

export function loadSessions(): LearningSession[] {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LearningSession[];
  } catch {
    return [];
  }
}

export function saveSession(session: LearningSession): SaveSessionResult {
  try {
    const sessions = loadSessions();
    if (sessions.some((existing) => isDuplicateSession(existing, session))) {
      return {
        ok: false,
        error: "같은 날짜, 문제집명, 문제번호 구성을 가진 학습 세션이 이미 저장되어 있습니다.",
      };
    }
    const next = [session, ...sessions].sort(compareSessionsDesc);
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
    window.localStorage.setItem(SELECTED_SESSION_KEY, session.id);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "브라우저 저장소에 학습 세션을 저장하지 못했습니다.",
    };
  }
}

export function setSelectedSessionId(sessionId: string): void {
  try {
    window.localStorage.setItem(SELECTED_SESSION_KEY, sessionId);
  } catch {
    // Selection persistence is helpful but non-critical.
  }
}

export function getSelectedSessionId(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_SESSION_KEY);
  } catch {
    return null;
  }
}

export function getSelectedOrNewestSession(sessions: LearningSession[], selectedId: string | null): LearningSession | null {
  if (sessions.length === 0) return null;
  return sessions.find((session) => session.id === selectedId) ?? getNewestSession(sessions);
}

export function getNewestSession(sessions: LearningSession[]): LearningSession | null {
  return sessions.slice().sort(compareSessionsDesc)[0] ?? null;
}

export function compareSessionsDesc(a: LearningSession, b: LearningSession): number {
  if (a.session_date !== b.session_date) {
    return b.session_date.localeCompare(a.session_date);
  }
  return b.created_at.localeCompare(a.created_at);
}

function isDuplicateSession(a: LearningSession, b: LearningSession): boolean {
  if (a.session_date !== b.session_date || a.book !== b.book) return false;
  const aNumbers = a.problems.map((problem) => problem.problem_number).sort((x, y) => x - y).join(",");
  const bNumbers = b.problems.map((problem) => problem.problem_number).sort((x, y) => x - y).join(",");
  return aNumbers === bNumbers;
}
```

- [ ] **Step 2: Build-check storage**

Run:

```bash
npm run build
```

Expected: no TypeScript errors in `storage.ts`.

---

### Task 5: Analytics

**Files:**

- Create: `src/app/domain/analytics.ts`

- [ ] **Step 1: Implement derived data helpers**

Create `src/app/domain/analytics.ts` with:

```ts
import type {
  DashboardSummary,
  LearningSession,
  ReviewRecommendation,
  SessionSummary,
  SubjectArea,
  Understanding,
  WeakConcept,
  WrongAnswerItem,
} from "./types";
import { compareSessionsDesc } from "./storage";

export function understandingScore(value: Understanding): number {
  if (value === "잘함") return 100;
  if (value === "애매") return 60;
  return 20;
}

export function averageUnderstandingForSession(session: LearningSession): number {
  const scores = session.problems.flatMap((problem) =>
    problem.participants.map((participant) => understandingScore(participant.understanding)),
  );
  return scores.length === 0 ? 0 : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function countReviewRequiredProblems(session: LearningSession): number {
  return session.problems.filter((problem) => problem.participants.some((participant) => participant.review_required)).length;
}

export function summarizeSessions(sessions: LearningSession[]): SessionSummary[] {
  return sessions.slice().sort(compareSessionsDesc).map((session) => ({
    id: session.id,
    date: session.session_date,
    book: session.book,
    problemCount: session.problems.length,
    speakers: session.speakers,
    averageUnderstanding: averageUnderstandingForSession(session),
    reviewRequiredCount: countReviewRequiredProblems(session),
  }));
}

export function buildDashboardSummary(sessions: LearningSession[], today = new Date()): DashboardSummary {
  const weekStart = startOfWeek(today);
  const weeklyProblemCount = sessions
    .filter((session) => new Date(`${session.session_date}T00:00:00`) >= weekStart)
    .reduce((sum, session) => sum + session.problems.length, 0);
  const reviewRequiredCount = sessions.reduce((sum, session) => sum + countReviewRequiredProblems(session), 0);
  const allScores = sessions.flatMap((session) =>
    session.problems.flatMap((problem) => problem.participants.map((participant) => understandingScore(participant.understanding))),
  );
  const averageUnderstanding = allScores.length === 0 ? 0 : Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length);

  return {
    weeklyProblemCount,
    reviewRequiredCount,
    averageUnderstanding,
    studyStreak: calculateStudyStreak(sessions, today),
  };
}

export function buildWeakConcepts(sessions: LearningSession[]): WeakConcept[] {
  const map = new Map<string, WeakConcept>();

  sessions.forEach((session) => {
    session.problems.forEach((problem) => {
      problem.concepts.forEach((concept) => {
        const existing = map.get(concept) ?? {
          name: concept,
          subject: problem.subject_area,
          totalProblems: 0,
          weakCountByParticipant: {},
          scoreByParticipant: {},
          averageScore: 0,
          lastReviewDate: session.session_date,
          recommend: false,
        };

        existing.totalProblems += 1;
        if (session.session_date > existing.lastReviewDate) existing.lastReviewDate = session.session_date;

        problem.participants.forEach((participant) => {
          const score = understandingScore(participant.understanding);
          existing.scoreByParticipant[participant.name] = (existing.scoreByParticipant[participant.name] ?? 0) + score;
          const weak =
            !participant.is_correct ||
            participant.review_required ||
            participant.understanding !== "잘함" ||
            participant.concepts_missed.length > 0;
          if (weak) {
            existing.weakCountByParticipant[participant.name] = (existing.weakCountByParticipant[participant.name] ?? 0) + 1;
          }
        });

        map.set(concept, existing);
      });

      problem.participants.forEach((participant) => {
        participant.concepts_missed.forEach((missedConcept) => {
          const existing = map.get(missedConcept) ?? {
            name: missedConcept,
            subject: problem.subject_area,
            totalProblems: 0,
            weakCountByParticipant: {},
            scoreByParticipant: {},
            averageScore: 0,
            lastReviewDate: session.session_date,
            recommend: false,
          };
          existing.weakCountByParticipant[participant.name] = (existing.weakCountByParticipant[participant.name] ?? 0) + 1;
          if (session.session_date > existing.lastReviewDate) existing.lastReviewDate = session.session_date;
          map.set(missedConcept, existing);
        });
      });
    });
  });

  return Array.from(map.values())
    .map((concept) => {
      const participantNames = Object.keys(concept.scoreByParticipant);
      const totalScore = participantNames.reduce((sum, name) => sum + concept.scoreByParticipant[name], 0);
      const denominator = Math.max(1, concept.totalProblems * Math.max(1, participantNames.length));
      const averageScore = Math.round(totalScore / denominator);
      const weakTotal = Object.values(concept.weakCountByParticipant).reduce((sum, count) => sum + count, 0);
      return {
        ...concept,
        averageScore,
        recommend: weakTotal > 0 || averageScore < 70,
      };
    })
    .sort((a, b) => {
      const aWeak = Object.values(a.weakCountByParticipant).reduce((sum, count) => sum + count, 0);
      const bWeak = Object.values(b.weakCountByParticipant).reduce((sum, count) => sum + count, 0);
      return bWeak - aWeak || a.averageScore - b.averageScore;
    });
}

export function buildReviewRecommendations(sessions: LearningSession[], limit = 3): ReviewRecommendation[] {
  return buildWeakConcepts(sessions)
    .filter((concept) => concept.recommend)
    .slice(0, limit)
    .map((concept) => ({
      concept: concept.name,
      subject: concept.subject,
      score: concept.averageScore,
      reason: concept.averageScore < 50 ? "최근 모름 또는 오답 판정이 반복된 개념이에요." : "최근 애매 판정이 반복된 개념이에요.",
    }));
}

export function buildWrongAnswerItems(sessions: LearningSession[]): WrongAnswerItem[] {
  return sessions
    .slice()
    .sort(compareSessionsDesc)
    .flatMap((session) =>
      session.problems.flatMap((problem) =>
        problem.participants
          .filter(
            (participant) =>
              !participant.is_correct ||
              participant.understanding !== "잘함" ||
              participant.review_required ||
              participant.concepts_missed.length > 0 ||
              participant.errors.length > 0,
          )
          .map((participant) => ({
            id: `${session.id}-${problem.id}-${participant.name}`,
            sessionId: session.id,
            problemId: problem.id,
            problemNumber: problem.problem_number,
            sessionDate: session.session_date,
            book: session.book,
            person: participant.name,
            concepts: problem.concepts,
            understanding: participant.understanding,
            missed: participant.concepts_missed,
            errors: participant.errors,
            explanation: problem.solution_summary,
            isCorrect: participant.is_correct,
            reviewRequired: participant.review_required,
          })),
      ),
    );
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function calculateStudyStreak(sessions: LearningSession[], today: Date): number {
  const studiedDates = new Set(sessions.map((session) => session.session_date));
  let count = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!studiedDates.has(key)) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}
```

- [ ] **Step 2: Build-check analytics**

Run:

```bash
npm run build
```

Expected: no TypeScript errors in `analytics.ts`.

---

### Task 6: App State and Layout Props

**Files:**

- Modify: `src/app/App.tsx`
- Modify: `src/app/components/Layout.tsx`

- [ ] **Step 1: Update `App.tsx` to own saved sessions and selected session**

Replace the `App.tsx` body with this shape while preserving the existing `Page` union:

```tsx
import { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import Layout from "./components/Layout";
import type { LearningSession } from "./domain/types";
import { getSelectedSessionId, loadSessions, setSelectedSessionId as persistSelectedSessionId } from "./domain/storage";

export type Page =
  | "home"
  | "json-register"
  | "sessions"
  | "problem-detail"
  | "weak-concepts"
  | "calendar"
  | "wrong-answers"
  | "study-comparison";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [selectedSessionId, setSelectedSessionIdState] = useState<string | null>(null);

  const refreshSessions = () => {
    setSessions(loadSessions());
    setSelectedSessionIdState(getSelectedSessionId());
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const selectSession = (sessionId: string) => {
    persistSelectedSessionId(sessionId);
    setSelectedSessionIdState(sessionId);
    setCurrentPage("problem-detail");
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      sessions={sessions}
      selectedSessionId={selectedSessionId}
      onSelectSession={selectSession}
      onSessionsChanged={refreshSessions}
    />
  );
}
```

- [ ] **Step 2: Update `Layout.tsx` props and page wiring**

Add imports and props:

```tsx
import type { LearningSession } from "../domain/types";
```

Update `Props`:

```ts
interface Props {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  sessions: LearningSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onSessionsChanged: () => void;
}
```

Update `Layout` signature:

```tsx
export default function Layout({
  currentPage,
  onNavigate,
  sessions,
  selectedSessionId,
  onSelectSession,
  onSessionsChanged,
}: Props) {
```

Update `renderPage` cases:

```tsx
case "home": return <Dashboard onNavigate={onNavigate} sessions={sessions} />;
case "json-register": return <JsonRegistration onSessionsChanged={onSessionsChanged} />;
case "sessions": return <SessionList sessions={sessions} onSelectSession={onSelectSession} />;
case "problem-detail": return <ProblemDetail sessions={sessions} selectedSessionId={selectedSessionId} />;
case "weak-concepts": return <WeakConcepts sessions={sessions} />;
case "wrong-answers": return <WrongAnswers sessions={sessions} />;
```

Leave `calendar` and `study-comparison` cases unchanged.

- [ ] **Step 3: Build-check app wiring**

Run:

```bash
npm run build
```

Expected: TypeScript errors in the modified child components because their props have not been updated yet. Confirm errors point to `Dashboard`, `JsonRegistration`, `SessionList`, `ProblemDetail`, `WeakConcepts`, or `WrongAnswers`, then continue.

---

### Task 7: JSON Registration Data Flow

**Files:**

- Modify: `src/app/components/JsonRegistration.tsx`

- [ ] **Step 1: Update imports and props**

Add:

```tsx
import type { ValidationPreview } from "../domain/types";
import { parseAndValidateSession } from "../domain/validation";
import { saveSession } from "../domain/storage";
```

Add props:

```ts
interface Props {
  onSessionsChanged: () => void;
}
```

Change function signature:

```tsx
export default function JsonRegistration({ onSessionsChanged }: Props) {
```

- [ ] **Step 2: Replace validation state**

Replace:

```ts
type ValidateStatus = null | "ok" | "error";
const [validateStatus, setValidateStatus] = useState<ValidateStatus>(null);
const [registered, setRegistered] = useState(false);
```

with:

```ts
type ValidateStatus = null | "ok" | "error";
const [validateStatus, setValidateStatus] = useState<ValidateStatus>(null);
const [validationErrors, setValidationErrors] = useState<string[]>([]);
const [preview, setPreview] = useState<ValidationPreview | null>(null);
const [validatedSessionJson, setValidatedSessionJson] = useState<string | null>(null);
const [registered, setRegistered] = useState(false);
```

- [ ] **Step 3: Replace `handleValidate`**

Use:

```tsx
const handleValidate = () => {
  const result = parseAndValidateSession(jsonText);
  setRegistered(false);

  if (!result.ok || !result.session || !result.preview) {
    setValidateStatus("error");
    setPreview(null);
    setValidatedSessionJson(null);
    setValidationErrors(result.errors.map((error) => `${error.path}: ${error.message}`));
    return;
  }

  setValidateStatus("ok");
  setValidationErrors([]);
  setPreview(result.preview);
  setValidatedSessionJson(JSON.stringify(result.session));
};
```

- [ ] **Step 4: Replace `handleRegister`**

Use:

```tsx
const handleRegister = () => {
  if (validateStatus !== "ok" || !validatedSessionJson) return;
  const session = JSON.parse(validatedSessionJson);
  const result = saveSession(session);
  if (!result.ok) {
    setValidateStatus("error");
    setValidationErrors([result.error ?? "학습 기록 저장에 실패했습니다."]);
    setRegistered(false);
    return;
  }
  setRegistered(true);
  onSessionsChanged();
};
```

- [ ] **Step 5: Update file handling to validate content, not file name**

Keep the existing `FileReader`, but add unsupported-file and empty-file handling:

```tsx
const handleFile = (file: File) => {
  setRegistered(false);
  if (!file.name.endsWith(".json")) {
    setValidateStatus("error");
    setValidationErrors(["$.file: .json 파일만 업로드할 수 있습니다."]);
    return;
  }

  setFileName(file.name);
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = String(e.target?.result ?? "");
    setJsonText(text);
    if (!text.trim()) {
      setValidateStatus("error");
      setValidationErrors(["$.file: 파일 내용이 비어 있습니다."]);
    } else {
      setValidateStatus(null);
      setValidationErrors([]);
    }
  };
  reader.onerror = () => {
    setValidateStatus("error");
    setValidationErrors(["$.file: 파일을 읽지 못했습니다."]);
  };
  reader.readAsText(file);
};
```

- [ ] **Step 6: Replace hard-coded preview rendering**

Remove the `previewData` constant. Render preview from `preview`.

Use labels:

```tsx
{preview && (
  <>
    <PreviewItem label="학습 날짜" value={preview.sessionDate} />
    <PreviewItem label="문제집명" value={preview.book} />
    <PreviewItem label="문제 수" value={`${preview.problemCount}문제`} />
    <PreviewItem label="참여자 수" value={`${preview.participantCount}명`} />
  </>
)}
```

Render concept tags with:

```tsx
{preview?.conceptTags.map((tag) => (
  <span key={tag} style={{ backgroundColor: "#FEF3C7", color: "#92690B", fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "999px" }}>
    {tag}
  </span>
))}
```

Render validation errors as:

```tsx
<ul style={{ margin: "0.25rem 0 0", paddingLeft: "1rem" }}>
  {validationErrors.map((error) => (
    <li key={error}>{error}</li>
  ))}
</ul>
```

- [ ] **Step 7: Build-check JSON registration**

Run:

```bash
npm run build
```

Expected: remaining prop/type errors only in screens not yet updated.

---

### Task 8: Session List and Selection

**Files:**

- Modify: `src/app/components/SessionList.tsx`

- [ ] **Step 1: Replace static data with props**

Remove the `SESSIONS` constant and the `Page` import.

Add:

```tsx
import type { LearningSession } from "../domain/types";
import { summarizeSessions } from "../domain/analytics";
```

Update props:

```ts
interface Props {
  sessions: LearningSession[];
  onSelectSession: (sessionId: string) => void;
}
```

Update signature:

```tsx
export default function SessionList({ sessions, onSelectSession }: Props) {
```

- [ ] **Step 2: Build summaries from saved sessions**

Add after state:

```tsx
const summaries = summarizeSessions(sessions);
```

Update filtering:

```tsx
const filtered = summaries.filter((s) => {
  const matchSearch = s.book.toLowerCase().includes(search.toLowerCase());
  const matchUnder =
    underFilter === "all"
      ? true
      : underFilter === "high"
      ? s.averageUnderstanding >= 75
      : underFilter === "mid"
      ? s.averageUnderstanding >= 60 && s.averageUnderstanding < 75
      : s.averageUnderstanding < 60;
  return matchSearch && matchUnder;
});
```

Update rendered property names:

```tsx
s.date
s.problemCount
s.speakers
s.reviewRequiredCount
s.averageUnderstanding
```

Update click handler:

```tsx
onClick={() => onSelectSession(s.id)}
```

- [ ] **Step 3: Add empty state**

Before card list, render:

```tsx
{filtered.length === 0 && (
  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "2rem", color: "#6B7280", textAlign: "center" }}>
    저장된 학습 세션이 없습니다. JSON 등록 화면에서 분석 결과를 먼저 등록하세요.
  </div>
)}
```

- [ ] **Step 4: Build-check session list**

Run:

```bash
npm run build
```

Expected: remaining prop/type errors only in screens not yet updated.

---

### Task 9: Problem Detail from Selected Session

**Files:**

- Modify: `src/app/components/ProblemDetail.tsx`

- [ ] **Step 1: Replace static model with domain props**

Remove the local `Problem` interface and `PROBLEMS` array.

Add:

```tsx
import type { LearningSession, ProblemAnalysis, Understanding } from "../domain/types";
import { getSelectedOrNewestSession } from "../domain/storage";
```

Add props:

```ts
interface Props {
  sessions: LearningSession[];
  selectedSessionId: string | null;
}
```

Update signature:

```tsx
export default function ProblemDetail({ sessions, selectedSessionId }: Props) {
  const session = getSelectedOrNewestSession(sessions, selectedSessionId);
  const [selected, setSelected] = useState<ProblemAnalysis | null>(null);
```

- [ ] **Step 2: Add no-data state**

At the start of the component return path:

```tsx
if (!session) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "2rem", color: "#6B7280", maxWidth: "720px" }}>
      저장된 학습 세션이 없습니다. JSON 등록 후 문제별 이해도를 확인할 수 있습니다.
    </div>
  );
}
```

- [ ] **Step 3: Render dynamic table headers**

Build participant columns:

```tsx
const participantHeaders = session.speakers.flatMap((speaker) => [`${speaker} 정답`, `${speaker} 이해도`]);
const headers = ["#", "과목", "핵심 개념", ...participantHeaders, "복습"];
```

Use `headers.map` instead of the hard-coded header array.

- [ ] **Step 4: Render problem rows from session data**

Replace `PROBLEMS.map` with `session.problems.map`.

Use:

```tsx
<td>{p.problem_number}번</td>
<td>{p.subject_area}</td>
```

For participant cells:

```tsx
{session.speakers.flatMap((speaker) => {
  const participant = p.participants.find((item) => item.name === speaker);
  return [
    <td key={`${p.id}-${speaker}-correct`} style={{ padding: "0.875rem 1rem" }}>
      <span style={{ color: participant?.is_correct ? "#10B981" : "#EF4444", fontWeight: 600 }}>
        {participant?.is_correct ? "O" : "X"}
      </span>
    </td>,
    <td key={`${p.id}-${speaker}-understanding`} style={{ padding: "0.875rem 1rem" }}>
      {participant ? <Badge val={participant.understanding} /> : <span style={{ color: "#9CA3AF" }}>-</span>}
    </td>,
  ];
})}
```

Use review flag:

```tsx
const needReview = p.participants.some((participant) => participant.review_required);
```

- [ ] **Step 5: Render dynamic detail panel**

Replace fixed 세은/수철 sections with:

```tsx
{selected.participants.map((participant) => (
  <div key={participant.name} style={{ marginBottom: "1rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#C8962A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.75rem", fontWeight: 600 }}>
        {participant.name.slice(0, 1)}
      </div>
      <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{participant.name} 분석</span>
      <Badge val={participant.understanding} />
    </div>
    <div style={{ backgroundColor: "#F9FAFB", borderRadius: "8px", padding: "0.75rem" }}>
      <AnalysisRow label="맞힌 개념" items={participant.concepts_covered} color="#10B981" />
      <AnalysisRow label="놓친 개념" items={participant.concepts_missed} color="#EF4444" />
      <AnalysisRow label="오개념" items={participant.errors} color="#EF4444" />
      <div style={{ fontSize: "0.8125rem" }}>
        <span style={{ color: "#6B7280" }}>복습 필요: </span>
        <span style={{ color: participant.review_required ? "#EF4444" : "#10B981" }}>
          {participant.review_required ? "필요" : "불필요"}
        </span>
      </div>
    </div>
  </div>
))}
```

Use `selected.solution_summary` for both problem summary fallback and explanation summary until a richer schema exists.

- [ ] **Step 6: Build-check problem detail**

Run:

```bash
npm run build
```

Expected: remaining prop/type errors only in screens not yet updated.

---

### Task 10: Dashboard Analytics

**Files:**

- Modify: `src/app/components/Dashboard.tsx`

- [ ] **Step 1: Replace static arrays with analytics**

Add:

```tsx
import type { LearningSession } from "../domain/types";
import { buildDashboardSummary, buildReviewRecommendations, summarizeSessions } from "../domain/analytics";
```

Update props:

```ts
interface Props {
  onNavigate: (p: Page) => void;
  sessions: LearningSession[];
}
```

Inside component:

```tsx
const summary = buildDashboardSummary(sessions, new Date("2026-06-12T00:00:00"));
const recommendations = buildReviewRecommendations(sessions);
const recentSessions = summarizeSessions(sessions).slice(0, 4);
```

Use `summary.weeklyProblemCount`, `summary.reviewRequiredCount`, `summary.averageUnderstanding`, and `summary.studyStreak` in summary cards.

- [ ] **Step 2: Render recommendation and recent session empty states**

If `recommendations.length === 0`, show:

```tsx
<div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.5rem", color: "#6B7280" }}>
  저장된 학습 데이터가 없거나 현재 추천할 취약 개념이 없습니다.
</div>
```

If `recentSessions.length === 0`, show:

```tsx
<div style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "1rem", color: "#9CA3AF", fontSize: "0.875rem" }}>
  최근 학습 세션이 없습니다.
</div>
```

- [ ] **Step 3: Build-check dashboard**

Run:

```bash
npm run build
```

Expected: remaining prop/type errors only in screens not yet updated.

---

### Task 11: Weak Concepts Analytics

**Files:**

- Modify: `src/app/components/WeakConcepts.tsx`

- [ ] **Step 1: Replace static concepts with analytics**

Add:

```tsx
import type { LearningSession } from "../domain/types";
import { buildWeakConcepts } from "../domain/analytics";
```

Update signature:

```tsx
interface Props {
  sessions: LearningSession[];
}

export default function WeakConcepts({ sessions }: Props) {
```

Inside component:

```tsx
const concepts = buildWeakConcepts(sessions);
const speakers = Array.from(new Set(sessions.flatMap((session) => session.speakers)));
const top5 = concepts.slice(0, 5);
```

Keep the existing filter labels as `전체`, `세은`, `수철` for MVP if sample data primarily uses those speakers. If saved data has other speakers, show them in the review list but keep the chart limited to the first two speakers to avoid redesign.

- [ ] **Step 2: Map analytics to chart data**

Use:

```tsx
const chartData = concepts.map((concept) => ({
  name: concept.name,
  세은: concept.scoreByParticipant["세은"] ? Math.round(concept.scoreByParticipant["세은"] / Math.max(1, concept.totalProblems)) : 0,
  수철: concept.scoreByParticipant["수철"] ? Math.round(concept.scoreByParticipant["수철"] / Math.max(1, concept.totalProblems)) : 0,
  평균: concept.averageScore,
}));
```

For top cards, use `top5.map`.

For review list, use `concepts.map` and:

```tsx
const weakCount = Object.values(c.weakCountByParticipant).reduce((sum, count) => sum + count, 0);
```

- [ ] **Step 3: Add empty state**

If `concepts.length === 0`, render:

```tsx
return (
  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "2rem", color: "#6B7280", maxWidth: "720px" }}>
    저장된 학습 데이터가 없습니다. JSON 등록 후 취약 개념을 확인할 수 있습니다.
  </div>
);
```

- [ ] **Step 4: Build-check weak concepts**

Run:

```bash
npm run build
```

Expected: remaining prop/type errors only in screens not yet updated.

---

### Task 12: Wrong Answers from Saved Sessions

**Files:**

- Modify: `src/app/components/WrongAnswers.tsx`

- [ ] **Step 1: Replace static wrong-answer items**

Add:

```tsx
import type { LearningSession, WrongAnswerItem } from "../domain/types";
import { buildWrongAnswerItems } from "../domain/analytics";
```

Update props and signature:

```tsx
interface Props {
  sessions: LearningSession[];
}

export default function WrongAnswers({ sessions }: Props) {
```

Replace `WRONG_ITEMS_INIT` state with:

```tsx
const [doneIds, setDoneIds] = useState<string[]>([]);
const items = buildWrongAnswerItems(sessions).map((item) => ({
  ...item,
  done: doneIds.includes(item.id),
}));
```

Update `toggle`:

```tsx
const toggle = (id: string) => {
  setDoneIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
};
```

- [ ] **Step 2: Update filtering and render fields**

Use `WrongAnswerItem & { done: boolean }` data.

Render:

```tsx
{item.problemNumber}번
{item.person}
관련 개념: {item.concepts.join(", ")}
놓친 개념: {item.missed.length > 0 ? item.missed.join(", ") : "없음"}
오개념: {item.errors.length > 0 ? item.errors.join(", ") : "없음"}
해설: {item.explanation}
```

For `"wrong"` filter, use:

```tsx
if (filter === "wrong") return !item.isCorrect && !item.done;
```

- [ ] **Step 3: Add empty state for no sessions**

If `sessions.length === 0`, render a single empty panel:

```tsx
<div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "2rem", color: "#6B7280" }}>
  저장된 학습 데이터가 없습니다. JSON 등록 후 오답노트가 자동 생성됩니다.
</div>
```

- [ ] **Step 4: Build-check wrong answers**

Run:

```bash
npm run build
```

Expected: the full app should now compile, except for any minor property renames missed during component conversion.

---

### Task 13: Manual QA and Polish

**Files:**

- Modify only files touched by prior tasks if defects are found.

- [ ] **Step 1: Run production build**

Run:

```bash
npm run build
```

Expected: build completes successfully.

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL such as `http://localhost:5173/`.

- [ ] **Step 3: Test valid pasted JSON**

Use this exact JSON in the JSON direct paste tab:

```json
{
  "session_date": "2026-06-12",
  "book": "SQLP 실전문제",
  "speakers": ["세은", "수철"],
  "problems": [
    {
      "problem_number": 1,
      "subject_area": "SQL 기본 및 활용",
      "concepts": ["JOIN", "OUTER JOIN", "NULL"],
      "solution_summary": "OUTER JOIN에서 기준 테이블의 데이터 보존 여부를 묻는 문제",
      "participants": [
        {
          "name": "세은",
          "is_correct": true,
          "understanding": "애매",
          "concepts_covered": ["OUTER JOIN"],
          "concepts_missed": ["NULL 처리"],
          "errors": ["기준 테이블의 방향을 일부 혼동함"],
          "review_required": true
        },
        {
          "name": "수철",
          "is_correct": false,
          "understanding": "모름",
          "concepts_covered": [],
          "concepts_missed": ["OUTER JOIN", "NULL 처리"],
          "errors": ["OUTER JOIN의 기준 테이블을 반대로 이해함"],
          "review_required": true
        }
      ]
    }
  ]
}
```

Expected:

- Validation succeeds.
- Preview shows date `2026-06-12`, book `SQLP 실전문제`, 1 problem, 2 participants.
- Register button saves successfully.

- [ ] **Step 4: Test invalid pasted JSON**

Use:

```json
{
  "session_date": "2026-06-12",
  "book": "SQLP 실전문제",
  "speakers": ["세은"],
  "problems": [
    {
      "problem_number": 1,
      "subject_area": "잘못된 과목",
      "concepts": ["JOIN"],
      "solution_summary": "요약",
      "participants": [
        {
          "name": "수철",
          "is_correct": "yes",
          "understanding": "보통",
          "concepts_covered": [],
          "concepts_missed": [],
          "errors": [],
          "review_required": true
        }
      ]
    }
  ]
}
```

Expected:

- Validation fails.
- Error list includes invalid `subject_area`, unknown participant name, invalid `is_correct`, and invalid `understanding`.

- [ ] **Step 5: Test connected screens**

Verify:

- Session list shows the saved session.
- Clicking the session opens problem detail for that session.
- Home dashboard metrics change after saving.
- Weak concepts include `OUTER JOIN` and `NULL 처리`.
- Wrong answers include 수철's missed concepts and 세은's ambiguous review-required item.
- Browser refresh keeps the saved session.

- [ ] **Step 6: Record final verification**

In the final response, report:

- `npm run build` result.
- Dev server URL if still running.
- Manual QA pass/fail notes.
- Any known limitations, especially calendar and study comparison remaining static.

---

## Self-Review

Spec coverage:

- JSON upload and paste: Tasks 7 and 13.
- Strict planning-document schema validation: Task 3.
- `localStorage` persistence: Task 4.
- API-replaceable storage boundary: Task 4.
- Session list, problem detail, dashboard, weak concepts, wrong answers: Tasks 8 through 12.
- Calendar and study comparison static for MVP: Task 6 keeps those routes unchanged.
- Build and manual verification: Task 13.

Completion-marker scan:

- No unfinished markers are intentionally left.
- Where component replacement is described, exact paths and code snippets are provided.

Type consistency:

- Shared app data uses `LearningSession`, `ProblemAnalysis`, `ParticipantAnalysis`, and analytics return types from `src/app/domain/types.ts`.
- Later tasks import the exact functions created in earlier tasks.

Repository note:

- The workspace is not currently a Git repository, so commit steps are omitted. If Git is initialized before execution, add commits after each completed task using focused messages.
