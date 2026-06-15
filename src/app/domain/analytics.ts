import { compareSessionsDesc } from "./storage";
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

interface ConceptAccumulator {
  name: string;
  subject: SubjectArea;
  problemIds: Set<string>;
  weakCountByParticipant: Record<string, number>;
  scoreSumByParticipant: Record<string, number>;
  scoreCountByParticipant: Record<string, number>;
  lastReviewDate: string;
}

export function understandingScore(value: Understanding): number {
  if (value === "잘함") return 100;
  if (value === "애매") return 60;
  return 20;
}

export function averageUnderstandingForSession(session: LearningSession): number {
  const scores = session.problems.flatMap((problem) =>
    problem.participants.map((participant) => understandingScore(participant.understanding)),
  );

  return average(scores);
}

export function countReviewRequiredProblems(session: LearningSession): number {
  return session.problems.filter((problem) =>
    problem.participants.some((participant) => participant.review_required),
  ).length;
}

export function summarizeSessions(sessions: LearningSession[]): SessionSummary[] {
  return sessions
    .slice()
    .sort(compareSessionsDesc)
    .map((session) => ({
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
  const monday = startOfWeek(today);
  const mondayKey = toDateKey(monday);
  const weeklyProblemCount = sessions
    .filter((session) => session.session_date >= mondayKey)
    .reduce((sum, session) => sum + session.problems.length, 0);
  const reviewRequiredCount = sessions.reduce(
    (sum, session) => sum + countReviewRequiredProblems(session),
    0,
  );
  const scores = sessions.flatMap((session) =>
    session.problems.flatMap((problem) =>
      problem.participants.map((participant) => understandingScore(participant.understanding)),
    ),
  );

  return {
    weeklyProblemCount,
    reviewRequiredCount,
    averageUnderstanding: average(scores),
    studyStreak: calculateStudyStreak(sessions, today),
  };
}

export function buildWeakConcepts(sessions: LearningSession[]): WeakConcept[] {
  const concepts = new Map<string, ConceptAccumulator>();

  sessions.forEach((session) => {
    session.problems.forEach((problem) => {
      const declaredConcepts = new Set(problem.concepts);
      const problemConcepts = new Set(problem.concepts);
      const missedConceptsByParticipant = new Map<string, Set<string>>();

      problem.participants.forEach((participant) => {
        missedConceptsByParticipant.set(participant.name, new Set(participant.concepts_missed));
        participant.concepts_missed.forEach((concept) => problemConcepts.add(concept));
      });

      problemConcepts.forEach((concept) => {
        const accumulator = getConceptAccumulator(concepts, concept, problem.subject_area, session.session_date);
        const isDeclaredConcept = declaredConcepts.has(concept);
        accumulator.problemIds.add(problem.id);
        if (session.session_date > accumulator.lastReviewDate) {
          accumulator.lastReviewDate = session.session_date;
        }

        problem.participants.forEach((participant) => {
          const missedConcepts = missedConceptsByParticipant.get(participant.name) ?? new Set<string>();
          const score = understandingScore(participant.understanding);
          accumulator.scoreSumByParticipant[participant.name] =
            (accumulator.scoreSumByParticipant[participant.name] ?? 0) + score;
          accumulator.scoreCountByParticipant[participant.name] =
            (accumulator.scoreCountByParticipant[participant.name] ?? 0) + 1;

          const hasProblemLevelWeakSignal =
            !participant.is_correct ||
            participant.review_required ||
            participant.understanding !== "잘함";
          const weak =
            missedConcepts.has(concept) ||
            (isDeclaredConcept && hasProblemLevelWeakSignal);

          if (weak) {
            accumulator.weakCountByParticipant[participant.name] =
              (accumulator.weakCountByParticipant[participant.name] ?? 0) + 1;
          }
        });
      });
    });
  });

  return Array.from(concepts.values())
    .map((concept) => {
      const scoreByParticipant = averageScoresByParticipant(
        concept.scoreSumByParticipant,
        concept.scoreCountByParticipant,
      );
      const averageScore = average(Object.values(scoreByParticipant));
      const weakCount = totalWeakCount(concept.weakCountByParticipant);

      return {
        name: concept.name,
        subject: concept.subject,
        totalProblems: concept.problemIds.size,
        weakCountByParticipant: concept.weakCountByParticipant,
        scoreByParticipant,
        averageScore,
        lastReviewDate: concept.lastReviewDate,
        recommend: weakCount > 0,
      };
    })
    .sort(compareWeakConcepts);
}

export function buildReviewRecommendations(
  sessions: LearningSession[],
  limit = 3,
): ReviewRecommendation[] {
  return buildWeakConcepts(sessions)
    .filter((concept) => concept.recommend)
    .slice(0, limit)
    .map((concept) => ({
      concept: concept.name,
      subject: concept.subject,
      reason:
        concept.averageScore < 50
          ? "모름/오답 반복으로 우선 복습이 필요해요."
          : "애매 반복으로 다시 정리하면 좋아요.",
      score: concept.averageScore,
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

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getConceptAccumulator(
  concepts: Map<string, ConceptAccumulator>,
  name: string,
  subject: SubjectArea,
  sessionDate: string,
): ConceptAccumulator {
  const existing = concepts.get(name);
  if (existing) return existing;

  const created: ConceptAccumulator = {
    name,
    subject,
    problemIds: new Set<string>(),
    weakCountByParticipant: {},
    scoreSumByParticipant: {},
    scoreCountByParticipant: {},
    lastReviewDate: sessionDate,
  };
  concepts.set(name, created);
  return created;
}

function averageScoresByParticipant(
  scoreSums: Record<string, number>,
  scoreCounts: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(scoreSums).map(([participant, sum]) => [
      participant,
      Math.round(sum / Math.max(1, scoreCounts[participant] ?? 0)),
    ]),
  );
}

function totalWeakCount(weakCountByParticipant: Record<string, number>): number {
  return Object.values(weakCountByParticipant).reduce((sum, count) => sum + count, 0);
}

function compareWeakConcepts(a: WeakConcept, b: WeakConcept): number {
  return (
    totalWeakCount(b.weakCountByParticipant) - totalWeakCount(a.weakCountByParticipant) ||
    a.averageScore - b.averageScore ||
    b.lastReviewDate.localeCompare(a.lastReviewDate) ||
    a.subject.localeCompare(b.subject) ||
    a.name.localeCompare(b.name)
  );
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
}

function calculateStudyStreak(sessions: LearningSession[], today: Date): number {
  const studiedDates = new Set(sessions.map((session) => session.session_date));
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;

  while (studiedDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
