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
