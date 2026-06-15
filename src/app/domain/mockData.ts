import { normalizeSession } from "./validation";
import type { LearningSession, RawLearningSession } from "./types";

export const MOCK_RAW_SESSIONS: RawLearningSession[] = [
  {
    session_date: "2026-06-10",
    book: "SQLP Mock - 조인 집중",
    speakers: ["세은", "수철"],
    problems: [
      {
        problem_number: 1,
        subject_area: "SQL 기본 및 활용",
        concepts: ["INNER JOIN", "OUTER JOIN", "NULL"],
        solution_summary: "INNER JOIN과 OUTER JOIN의 결과 차이, NULL 보존 여부를 비교하는 문제",
        participants: [
          {
            name: "세은",
            is_correct: true,
            understanding: "애매",
            concepts_covered: ["INNER JOIN"],
            concepts_missed: ["OUTER JOIN 기준 테이블", "NULL 보존"],
            errors: ["LEFT OUTER JOIN에서 보존되는 테이블 방향을 헷갈림"],
            review_required: true,
          },
          {
            name: "수철",
            is_correct: false,
            understanding: "모름",
            concepts_covered: [],
            concepts_missed: ["INNER JOIN", "OUTER JOIN", "NULL"],
            errors: ["OUTER JOIN을 INNER JOIN과 동일한 결과로 이해함"],
            review_required: true,
          },
        ],
      },
      {
        problem_number: 2,
        subject_area: "SQL 기본 및 활용",
        concepts: ["SELF JOIN", "계층형 질의"],
        solution_summary: "동일 테이블을 여러 번 참조해 상하 관계를 찾는 SELF JOIN 문제",
        participants: [
          {
            name: "세은",
            is_correct: true,
            understanding: "잘함",
            concepts_covered: ["SELF JOIN", "테이블 별칭"],
            concepts_missed: [],
            errors: [],
            review_required: false,
          },
          {
            name: "수철",
            is_correct: true,
            understanding: "애매",
            concepts_covered: ["SELF JOIN"],
            concepts_missed: ["계층 관계 방향"],
            errors: ["부모/자식 별칭을 반대로 읽음"],
            review_required: true,
          },
        ],
      },
    ],
  },
  {
    session_date: "2026-06-12",
    book: "SQLP Mock - 집계와 윈도우",
    speakers: ["세은", "민준"],
    problems: [
      {
        problem_number: 3,
        subject_area: "SQL 기본 및 활용",
        concepts: ["GROUP BY", "HAVING", "WHERE"],
        solution_summary: "WHERE와 HAVING의 적용 시점, 집계 조건의 위치를 묻는 문제",
        participants: [
          {
            name: "세은",
            is_correct: false,
            understanding: "애매",
            concepts_covered: ["GROUP BY"],
            concepts_missed: ["HAVING", "WHERE 실행 순서"],
            errors: ["집계 함수 조건을 WHERE에 둔다고 설명함"],
            review_required: true,
          },
          {
            name: "민준",
            is_correct: true,
            understanding: "잘함",
            concepts_covered: ["GROUP BY", "HAVING", "WHERE"],
            concepts_missed: [],
            errors: [],
            review_required: false,
          },
        ],
      },
      {
        problem_number: 4,
        subject_area: "SQL 기본 및 활용",
        concepts: ["윈도우 함수", "RANK", "DENSE_RANK", "ROW_NUMBER"],
        solution_summary: "순위 함수별 동점 처리 방식과 결과 행 번호를 비교하는 문제",
        participants: [
          {
            name: "세은",
            is_correct: false,
            understanding: "모름",
            concepts_covered: ["ROW_NUMBER"],
            concepts_missed: ["RANK", "DENSE_RANK"],
            errors: ["RANK와 DENSE_RANK가 같은 순번을 만든다고 오해함"],
            review_required: true,
          },
          {
            name: "민준",
            is_correct: false,
            understanding: "애매",
            concepts_covered: ["RANK"],
            concepts_missed: ["DENSE_RANK"],
            errors: ["동점 이후 순번을 건너뛰는지 확신하지 못함"],
            review_required: true,
          },
        ],
      },
    ],
  },
  {
    session_date: "2026-06-14",
    book: "SQLP Mock - 튜닝과 모델링",
    speakers: ["지아", "수철"],
    problems: [
      {
        problem_number: 5,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["실행계획", "인덱스", "Full Table Scan"],
        solution_summary: "실행계획에서 Full Table Scan과 Index Range Scan의 의미를 해석하는 문제",
        participants: [
          {
            name: "지아",
            is_correct: true,
            understanding: "잘함",
            concepts_covered: ["실행계획", "인덱스"],
            concepts_missed: [],
            errors: [],
            review_required: false,
          },
          {
            name: "수철",
            is_correct: false,
            understanding: "모름",
            concepts_covered: [],
            concepts_missed: ["실행계획", "Full Table Scan", "인덱스 선택도"],
            errors: ["Full Table Scan은 항상 비효율적이라고 단정함"],
            review_required: true,
          },
        ],
      },
      {
        problem_number: 6,
        subject_area: "데이터 모델링의 이해",
        concepts: ["정규화", "반정규화", "식별관계"],
        solution_summary: "정규화와 반정규화 적용 기준, 식별관계 선택 근거를 설명하는 문제",
        participants: [
          {
            name: "지아",
            is_correct: false,
            understanding: "애매",
            concepts_covered: ["정규화"],
            concepts_missed: ["반정규화 적용 기준"],
            errors: ["반정규화를 정규화의 단순 반대 과정으로 설명함"],
            review_required: true,
          },
          {
            name: "수철",
            is_correct: true,
            understanding: "잘함",
            concepts_covered: ["정규화", "식별관계"],
            concepts_missed: [],
            errors: [],
            review_required: false,
          },
        ],
      },
    ],
  },
];

export function createMockSessions(): LearningSession[] {
  return MOCK_RAW_SESSIONS.map((raw, index) => {
    const session = normalizeSession(raw);
    const mockId = `mock-${session.id}`;

    return {
      ...session,
      id: mockId,
      book: `[MOCK] ${session.book}`,
      created_at: `2026-06-${String(10 + index).padStart(2, "0")}T09:00:00.000Z`,
      problems: session.problems.map((problem) => ({
        ...problem,
        id: `mock-${problem.id}`,
      })),
    };
  });
}
