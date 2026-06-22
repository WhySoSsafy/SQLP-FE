import {
  SUBJECT_AREAS,
  UNDERSTANDING_VALUES,
  type LearningSession,
  type RawLearningSession,
  type SubjectArea,
  type Understanding,
  type ValidationError,
  type ValidationPreview,
  type ValidationResult,
} from "./types";

const REQUIRED_TOP_LEVEL_FIELDS = ["session_date", "book", "speakers", "problems"] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNonEmptyStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const normalizeIdPart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, "-")
    .replace(/^-+|-+$/g, "");

const trimStringArray = (values: string[]): string[] =>
  values.map((value) => value.trim()).filter(Boolean);

const makeSessionId = (raw: RawLearningSession): string => {
  const problemNumbers = raw.problems
    .map((problem) => problem.problem_number)
    .slice()
    .sort((a, b) => a - b)
    .join("-");

  return `${raw.session_date}-${normalizeIdPart(raw.book)}-${problemNumbers}`;
};

const push = (errors: ValidationError[], path: string, message: string): void => {
  errors.push({ path, message });
};

const hasField = (value: Record<string, unknown>, field: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, field);

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

  const session = normalizeSession(parsed as RawLearningSession);

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

  REQUIRED_TOP_LEVEL_FIELDS.forEach((field) => {
    if (!hasField(value, field)) {
      push(errors, `$.${field}`, `${field}는 필수 필드입니다.`);
    }
  });

  if (
    hasField(value, "session_date") &&
    (!isNonEmptyString(value.session_date) || !isValidDateString(value.session_date))
  ) {
    push(errors, "$.session_date", "session_date는 유효한 YYYY-MM-DD 날짜여야 합니다.");
  }

  if (hasField(value, "book") && !isNonEmptyString(value.book)) {
    push(errors, "$.book", "book은 비어 있지 않은 문자열이어야 합니다.");
  }

  if (hasField(value, "speakers") && !isNonEmptyStringArray(value.speakers)) {
    push(errors, "$.speakers", "speakers는 비어 있지 않은 문자열 배열이어야 합니다.");
  }

  if (hasField(value, "problems") && (!Array.isArray(value.problems) || value.problems.length === 0)) {
    push(errors, "$.problems", "problems는 비어 있지 않은 배열이어야 합니다.");
  }

  const speakers = isNonEmptyStringArray(value.speakers)
    ? new Set(value.speakers.map((speaker) => speaker.trim()))
    : new Set<string>();
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

      if (
        typeof problem.subject_area !== "string" ||
        !SUBJECT_AREAS.includes(problem.subject_area as SubjectArea)
      ) {
        push(
          errors,
          `${problemPath}.subject_area`,
          `subject_area는 ${SUBJECT_AREAS.join(", ")} 중 하나여야 합니다.`,
        );
      }

      if (!isNonEmptyStringArray(problem.concepts)) {
        push(errors, `${problemPath}.concepts`, "concepts는 비어 있지 않은 문자열 배열이어야 합니다.");
      }

      if (!isNonEmptyString(problem.solution_summary)) {
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

        if (!isNonEmptyString(participant.name)) {
          push(errors, `${participantPath}.name`, "name은 비어 있지 않은 문자열이어야 합니다.");
        } else if (speakers.size > 0 && !speakers.has(participant.name.trim())) {
          push(errors, `${participantPath}.name`, `${participant.name.trim()}은 speakers에 포함되어야 합니다.`);
        }

        if (typeof participant.is_correct !== "boolean") {
          push(errors, `${participantPath}.is_correct`, "is_correct는 boolean이어야 합니다.");
        }

        if (
          typeof participant.understanding !== "string" ||
          !UNDERSTANDING_VALUES.includes(participant.understanding as Understanding)
        ) {
          push(errors, `${participantPath}.understanding`, "understanding은 잘함, 애매, 모름 중 하나여야 합니다.");
        }

        if (!isStringArray(participant.concepts_covered)) {
          push(errors, `${participantPath}.concepts_covered`, "concepts_covered는 문자열 배열이어야 합니다.");
        }

        if (!isStringArray(participant.concepts_missed)) {
          push(errors, `${participantPath}.concepts_missed`, "concepts_missed는 문자열 배열이어야 합니다.");
        }

        if (!isStringArray(participant.errors)) {
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

export function normalizeSession(raw: RawLearningSession): LearningSession {
  const sessionId = makeSessionId(raw);

  return {
    id: sessionId,
    session_date: raw.session_date.trim(),
    book: raw.book.trim(),
    speakers: trimStringArray(raw.speakers),
    created_at: new Date().toISOString(),
    problems: raw.problems
      .slice()
      .sort((a, b) => a.problem_number - b.problem_number)
      .map((problem) => ({
        id: `${sessionId}-p${problem.problem_number}`,
        problem_number: problem.problem_number,
        subject_area: problem.subject_area,
        concepts: trimStringArray(problem.concepts),
        solution_summary: problem.solution_summary.trim(),
        participants: problem.participants.map((participant) => ({
          name: participant.name.trim(),
          is_correct: participant.is_correct,
          understanding: participant.understanding,
          concepts_covered: trimStringArray(participant.concepts_covered),
          concepts_missed: trimStringArray(participant.concepts_missed),
          errors: trimStringArray(participant.errors),
          review_required: participant.review_required,
        })),
      })),
  };
}

export function createPreview(session: LearningSession): ValidationPreview {
  const conceptTags = Array.from(
    new Set(session.problems.flatMap((problem) => problem.concepts)),
  ).slice(0, 8);

  return {
    sessionDate: session.session_date,
    book: session.book,
    problemCount: session.problems.length,
    participantCount: session.speakers.length,
    conceptTags,
  };
}
