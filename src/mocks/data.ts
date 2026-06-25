import type {
  LearningSession,
  SessionSummary,
  DashboardSummary,
  ReviewRecommendation,
  CalendarResponse,
  WeakConcept,
  WrongAnswerItem,
  GrowthReport,
  StudyComparisonResponse,
  ConceptDetail,
  Comment,
} from "@/domain/types";

// ── Sessions ──────────────────────────────────────────────────────────────────

export const MOCK_SESSIONS: LearningSession[] = [
  {
    id: "s1",
    session_date: "2026-06-20",
    book: "SQLP 기출문제 2024 (2과목)",
    speakers: ["세은", "수철"],
    created_at: "2026-06-20T10:00:00.000Z",
    problems: [
      {
        id: "s1-p1", problem_number: 1,
        subject_area: "SQL 기본 및 활용",
        concepts: ["CASE WHEN", "NULL 처리", "DECODE"],
        solution_summary: "CASE WHEN과 DECODE의 동작 차이, NULL 처리 방식을 비교하는 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["CASE WHEN", "DECODE"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["CASE WHEN"], concepts_missed: ["NULL 처리 순서"], errors: ["NULL 비교 시 = 연산자 사용 오류"], review_required: true },
        ],
      },
      {
        id: "s1-p2", problem_number: 2,
        subject_area: "SQL 기본 및 활용",
        concepts: ["GROUP BY", "ROLLUP", "CUBE"],
        solution_summary: "ROLLUP과 CUBE로 생성되는 집계 행의 차이를 묻는 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["ROLLUP", "CUBE"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "애매", concepts_covered: ["ROLLUP"], concepts_missed: ["CUBE 생성 행 수"], errors: ["CUBE가 생성하는 행 수를 ROLLUP과 동일하게 판단"], review_required: true },
        ],
      },
      {
        id: "s1-p3", problem_number: 3,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["실행계획", "NL Join", "Hash Join"],
        solution_summary: "NL Join과 Hash Join의 적용 조건과 실행계획 해석 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["NL Join", "Hash Join", "실행계획"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "잘함", concepts_covered: ["NL Join", "Hash Join"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s1-p4", problem_number: 4,
        subject_area: "데이터 모델링의 이해",
        concepts: ["식별자", "주식별자", "외래키"],
        solution_summary: "주식별자와 외래키의 특성, NULL 허용 여부를 비교하는 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["주식별자", "외래키"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["주식별자"], concepts_missed: ["외래키 NULL 허용 조건"], errors: [], review_required: true },
        ],
      },
      {
        id: "s1-p5", problem_number: 5,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["인덱스 스캔", "Index Range Scan", "Index Full Scan"],
        solution_summary: "Index Range Scan과 Index Full Scan이 선택되는 조건 차이 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["Index Range Scan", "Index Full Scan"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "애매", concepts_covered: ["Index Range Scan"], concepts_missed: ["Index Full Scan 선택 기준"], errors: ["선택도 기준 혼동"], review_required: true },
        ],
      },
    ],
  },
  {
    id: "s2",
    session_date: "2026-06-17",
    book: "SQLP 기출문제 2024 (1과목)",
    speakers: ["세은"],
    created_at: "2026-06-17T10:00:00.000Z",
    problems: [
      {
        id: "s2-p1", problem_number: 1,
        subject_area: "데이터 모델링의 이해",
        concepts: ["정규화", "1NF", "2NF", "3NF"],
        solution_summary: "정규화 단계별 조건과 이상(Anomaly) 현상 제거 원리를 묻는 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["1NF", "2NF", "3NF"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s2-p2", problem_number: 2,
        subject_area: "데이터 모델링의 이해",
        concepts: ["반정규화", "테이블 병합", "컬럼 중복"],
        solution_summary: "반정규화 적용 기준과 발생 가능한 데이터 중복 문제를 묻는 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["반정규화", "테이블 병합"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s2-p3", problem_number: 3,
        subject_area: "SQL 기본 및 활용",
        concepts: ["OUTER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN"],
        solution_summary: "LEFT/RIGHT OUTER JOIN 결과 집합과 NULL 보존 테이블 방향 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["LEFT OUTER JOIN", "RIGHT OUTER JOIN"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s2-p4", problem_number: 4,
        subject_area: "SQL 기본 및 활용",
        concepts: ["서브쿼리", "스칼라 서브쿼리", "인라인 뷰"],
        solution_summary: "스칼라 서브쿼리와 인라인 뷰의 동작 방식과 반환 값 차이 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["스칼라 서브쿼리", "인라인 뷰"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s2-p5", problem_number: 5,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["파티셔닝", "Range Partition", "Hash Partition"],
        solution_summary: "파티션 프루닝과 파티션 유형별 적합한 데이터 분포 조건 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "애매", concepts_covered: ["Range Partition"], concepts_missed: ["Hash Partition 프루닝", "파티션 프루닝 조건"], errors: ["Hash Partition에서도 프루닝이 항상 된다고 오답"], review_required: true },
        ],
      },
    ],
  },
  {
    id: "s3",
    session_date: "2026-06-12",
    book: "SQLP 실전문제 - 인덱스 설계",
    speakers: ["세은", "수철"],
    created_at: "2026-06-12T10:00:00.000Z",
    problems: [
      {
        id: "s3-p1", problem_number: 1,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["복합 인덱스", "선두 컬럼", "인덱스 범위 스캔"],
        solution_summary: "복합 인덱스의 컬럼 순서가 쿼리 성능에 미치는 영향 분석 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["복합 인덱스", "선두 컬럼"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "애매", concepts_covered: ["복합 인덱스"], concepts_missed: ["선두 컬럼 조건 위반"], errors: ["선두 컬럼 없이도 인덱스가 사용된다고 판단"], review_required: true },
        ],
      },
      {
        id: "s3-p2", problem_number: 2,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["인덱스 스킵 스캔", "함수기반 인덱스"],
        solution_summary: "함수기반 인덱스와 인덱스 스킵 스캔 적용 조건을 비교하는 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["함수기반 인덱스"], concepts_missed: ["인덱스 스킵 스캔 조건"], errors: [], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["함수기반 인덱스", "인덱스 스킵 스캔"], errors: ["일반 인덱스와 함수기반 인덱스 차이를 구분하지 못함"], review_required: true },
        ],
      },
      {
        id: "s3-p3", problem_number: 3,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["Bind Variable", "하드파싱", "소프트파싱"],
        solution_summary: "바인드 변수 사용 여부에 따른 파싱 비용과 실행계획 공유 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["Bind Variable", "소프트파싱"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["Bind Variable"], concepts_missed: ["하드파싱 발생 조건"], errors: [], review_required: true },
        ],
      },
      {
        id: "s3-p4", problem_number: 4,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["통계 정보", "카디널리티", "선택도"],
        solution_summary: "옵티마이저가 실행계획을 선택할 때 통계 정보를 활용하는 방식 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["카디널리티", "선택도"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "잘함", concepts_covered: ["통계 정보", "카디널리티"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
    ],
  },
  {
    id: "s5",
    session_date: "2026-06-05",
    book: "SQLP 실전문제 - 윈도우 함수",
    speakers: ["세은", "수철"],
    created_at: "2026-06-05T10:00:00.000Z",
    problems: [
      {
        id: "s5-p1", problem_number: 1,
        subject_area: "SQL 기본 및 활용",
        concepts: ["RANK", "DENSE_RANK", "ROW_NUMBER"],
        solution_summary: "동점 처리 방식의 차이: RANK의 순위 건너뜀 vs DENSE_RANK의 연속 순위 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["RANK", "DENSE_RANK", "ROW_NUMBER"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "잘함", concepts_covered: ["RANK", "DENSE_RANK"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s5-p2", problem_number: 2,
        subject_area: "SQL 기본 및 활용",
        concepts: ["ROWS BETWEEN", "RANGE BETWEEN", "윈도우 프레임"],
        solution_summary: "ROWS BETWEEN과 RANGE BETWEEN의 동작 차이, 기본 프레임 값 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "애매", concepts_covered: ["ROWS BETWEEN"], concepts_missed: ["RANGE BETWEEN 기본값"], errors: ["RANGE BETWEEN의 기본 동작을 ROWS와 동일하게 판단"], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["ROWS BETWEEN", "RANGE BETWEEN"], errors: ["윈도우 프레임 문법 자체를 모름"], review_required: true },
        ],
      },
      {
        id: "s5-p3", problem_number: 3,
        subject_area: "SQL 기본 및 활용",
        concepts: ["SUM OVER", "AVG OVER", "누적 합계"],
        solution_summary: "윈도우 함수로 누적 합계, 이동 평균 계산하는 쿼리 작성 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["SUM OVER", "AVG OVER"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["SUM OVER"], concepts_missed: ["이동 평균 프레임 설정"], errors: [], review_required: true },
        ],
      },
      {
        id: "s5-p4", problem_number: 4,
        subject_area: "SQL 기본 및 활용",
        concepts: ["NTILE", "PERCENT_RANK", "CUME_DIST"],
        solution_summary: "분위수 관련 함수(NTILE, PERCENT_RANK, CUME_DIST)의 계산 방식 비교 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["NTILE"], concepts_missed: ["PERCENT_RANK 계산식", "CUME_DIST 차이"], errors: [], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["NTILE", "PERCENT_RANK", "CUME_DIST"], errors: ["모든 함수가 동일한 결과를 낸다고 오답"], review_required: true },
        ],
      },
    ],
  },
  {
    id: "s6",
    session_date: "2026-06-02",
    book: "SQLP 실전문제 - 집합 연산자",
    speakers: ["세은"],
    created_at: "2026-06-02T10:00:00.000Z",
    problems: [
      {
        id: "s6-p1", problem_number: 1,
        subject_area: "SQL 기본 및 활용",
        concepts: ["UNION", "UNION ALL", "중복 제거"],
        solution_summary: "UNION과 UNION ALL의 정렬 동작 및 중복 처리 방식 비교 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["UNION", "UNION ALL"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s6-p2", problem_number: 2,
        subject_area: "SQL 기본 및 활용",
        concepts: ["INTERSECT", "MINUS", "EXCEPT"],
        solution_summary: "INTERSECT와 MINUS 연산 결과 및 적용 순서에 따른 차이 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["INTERSECT", "MINUS"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s6-p3", problem_number: 3,
        subject_area: "SQL 기본 및 활용",
        concepts: ["EXISTS", "IN", "서브쿼리 최적화"],
        solution_summary: "EXISTS와 IN 서브쿼리의 실행 방식과 대용량에서의 성능 차이 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["EXISTS", "IN"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s6-p4", problem_number: 4,
        subject_area: "SQL 기본 및 활용",
        concepts: ["WITH절", "CTE", "재귀 CTE"],
        solution_summary: "CTE(WITH절)를 활용한 쿼리 재사용과 재귀 CTE로 계층 데이터 조회 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["WITH절", "CTE"], concepts_missed: ["재귀 CTE 종료 조건"], errors: [], review_required: true },
        ],
      },
    ],
  },
  {
    id: "s7",
    session_date: "2026-05-25",
    book: "SQLP 실전문제 - 서브쿼리",
    speakers: ["세은", "수철"],
    created_at: "2026-05-25T10:00:00.000Z",
    problems: [
      {
        id: "s7-p1", problem_number: 1,
        subject_area: "SQL 기본 및 활용",
        concepts: ["비상관 서브쿼리", "상관 서브쿼리", "실행 횟수"],
        solution_summary: "비상관 서브쿼리와 상관 서브쿼리의 실행 방식과 성능 차이 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["비상관 서브쿼리", "상관 서브쿼리"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "애매", concepts_covered: ["비상관 서브쿼리"], concepts_missed: ["상관 서브쿼리 반복 실행"], errors: ["상관 서브쿼리가 한 번만 실행된다고 오답"], review_required: true },
        ],
      },
      {
        id: "s7-p2", problem_number: 2,
        subject_area: "SQL 기본 및 활용",
        concepts: ["ANY", "ALL", "비교 연산자"],
        solution_summary: "서브쿼리에서 ANY/ALL 연산자 동작 방식과 결과 집합 비교 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["ANY"], concepts_missed: ["ALL 연산자 조건"], errors: [], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["ANY", "ALL"], errors: ["ANY와 ALL을 OR/AND와 단순 매핑"], review_required: true },
        ],
      },
      {
        id: "s7-p3", problem_number: 3,
        subject_area: "SQL 기본 및 활용",
        concepts: ["PIVOT", "DECODE를 이용한 피벗"],
        solution_summary: "PIVOT 구문과 DECODE+GROUP BY를 이용한 행→열 변환 비교 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["PIVOT", "DECODE 피벗"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["PIVOT"], concepts_missed: ["DECODE 피벗 작성법"], errors: [], review_required: true },
        ],
      },
      {
        id: "s7-p4", problem_number: 4,
        subject_area: "SQL 기본 및 활용",
        concepts: ["GROUPING SETS", "GROUPING 함수"],
        solution_summary: "GROUPING SETS를 활용한 다차원 집계와 GROUPING 함수 결과 해석 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "애매", concepts_covered: ["GROUPING SETS"], concepts_missed: ["GROUPING 함수 반환값"], errors: ["GROUPING 함수가 NULL 컬럼에 1을 반환한다는 것을 놓침"], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["GROUPING SETS", "GROUPING 함수"], errors: ["GROUPING SETS와 ROLLUP 결과를 동일시"], review_required: true },
        ],
      },
      {
        id: "s7-p5", problem_number: 5,
        subject_area: "데이터 모델링의 이해",
        concepts: ["수퍼타입", "서브타입", "Arc 관계"],
        solution_summary: "수퍼타입/서브타입 관계에서 물리 모델 변환 방식과 Arc 관계 표현 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["수퍼타입", "서브타입"], concepts_missed: ["Arc 관계 변환"], errors: [], review_required: true },
          { name: "수철", is_correct: true, understanding: "잘함", concepts_covered: ["수퍼타입", "서브타입", "Arc 관계"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
    ],
  },
  {
    id: "s8",
    session_date: "2026-05-14",
    book: "SQLP 실전문제 - DML과 트랜잭션",
    speakers: ["세은", "수철"],
    created_at: "2026-05-14T10:00:00.000Z",
    problems: [
      {
        id: "s8-p1", problem_number: 1,
        subject_area: "SQL 기본 및 활용",
        concepts: ["COMMIT", "ROLLBACK", "SAVEPOINT"],
        solution_summary: "트랜잭션 제어 명령어 동작과 SAVEPOINT를 이용한 부분 롤백 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["COMMIT", "ROLLBACK", "SAVEPOINT"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "애매", concepts_covered: ["COMMIT", "ROLLBACK"], concepts_missed: ["SAVEPOINT 부분 롤백"], errors: ["SAVEPOINT 이후 전체 롤백된다고 오답"], review_required: true },
        ],
      },
      {
        id: "s8-p2", problem_number: 2,
        subject_area: "SQL 기본 및 활용",
        concepts: ["INSERT SELECT", "UPDATE 서브쿼리", "MERGE"],
        solution_summary: "MERGE 구문의 WHEN MATCHED/NOT MATCHED 동작과 INSERT SELECT 차이 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["MERGE", "INSERT SELECT"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["MERGE"], concepts_missed: ["MERGE DELETE 절"], errors: [], review_required: true },
        ],
      },
      {
        id: "s8-p3", problem_number: 3,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["Lock", "Row Lock", "Table Lock"],
        solution_summary: "DML 처리 중 발생하는 Row Lock과 Table Lock 범위 및 해제 조건 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["Row Lock", "Table Lock"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["Row Lock", "Table Lock", "Lock 해제 조건"], errors: ["ROLLBACK이 Lock을 즉시 해제하지 않는다고 오답"], review_required: true },
        ],
      },
      {
        id: "s8-p4", problem_number: 4,
        subject_area: "SQL 기본 및 활용",
        concepts: ["DDL", "DCL", "TCL", "DML"],
        solution_summary: "SQL 명령어 분류와 각 분류의 자동 COMMIT 여부를 묻는 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["DDL", "DCL", "TCL", "DML"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["DDL", "DML"], concepts_missed: ["DCL vs TCL 구분"], errors: [], review_required: true },
        ],
      },
    ],
  },
  {
    id: "s9",
    session_date: "2026-05-05",
    book: "SQLP 실전문제 - JOIN 완전정복",
    speakers: ["세은", "수철"],
    created_at: "2026-05-05T10:00:00.000Z",
    problems: [
      {
        id: "s9-p1", problem_number: 1,
        subject_area: "SQL 기본 및 활용",
        concepts: ["INNER JOIN", "OUTER JOIN", "CROSS JOIN"],
        solution_summary: "세 가지 조인의 결과 행 수와 조인 조건 생략 시 동작 비교 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["INNER JOIN", "OUTER JOIN", "CROSS JOIN"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "애매", concepts_covered: ["INNER JOIN", "OUTER JOIN"], concepts_missed: ["CROSS JOIN 결과 행 수"], errors: ["CROSS JOIN과 FULL OUTER JOIN 혼동"], review_required: true },
        ],
      },
      {
        id: "s9-p2", problem_number: 2,
        subject_area: "SQL 기본 및 활용",
        concepts: ["NATURAL JOIN", "USING절", "ON절"],
        solution_summary: "NATURAL JOIN과 USING절의 컬럼 명시 규칙 및 ON절 차이 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["NATURAL JOIN", "USING절", "ON절"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["ON절"], concepts_missed: ["NATURAL JOIN 제약"], errors: [], review_required: true },
        ],
      },
      {
        id: "s9-p3", problem_number: 3,
        subject_area: "SQL 기본 및 활용",
        concepts: ["SELF JOIN", "계층 관계", "재귀"],
        solution_summary: "SELF JOIN을 활용하여 같은 테이블에서 상하 관계를 조회하는 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["SELF JOIN"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "잘함", concepts_covered: ["SELF JOIN", "계층 관계"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s9-p4", problem_number: 4,
        subject_area: "SQL 기본 및 활용",
        concepts: ["카테시안 곱", "조인 조건 누락", "N+1 문제"],
        solution_summary: "WHERE절 조인 조건 누락 시 발생하는 카테시안 곱 결과 계산 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["카테시안 곱"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "잘함", concepts_covered: ["카테시안 곱", "조인 조건 누락"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s9-p5", problem_number: 5,
        subject_area: "SQL 고급 활용 및 튜닝",
        concepts: ["조인 순서", "드라이빙 테이블", "인덱스 조인"],
        solution_summary: "조인 순서에 따른 실행계획 변화와 드라이빙 테이블 선정 기준 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "애매", concepts_covered: ["드라이빙 테이블"], concepts_missed: ["조인 순서 최적화 기준"], errors: [], review_required: true },
          { name: "수철", is_correct: true, understanding: "잘함", concepts_covered: ["드라이빙 테이블", "조인 순서"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
    ],
  },
  {
    id: "s10",
    session_date: "2026-04-21",
    book: "SQLP 기본서 - 데이터 정규화",
    speakers: ["세은"],
    created_at: "2026-04-21T10:00:00.000Z",
    problems: [
      {
        id: "s10-p1", problem_number: 1,
        subject_area: "데이터 모델링의 이해",
        concepts: ["함수 종속", "완전 함수 종속", "부분 함수 종속"],
        solution_summary: "2NF 조건인 완전 함수 종속과 부분 함수 종속 제거 원리 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "애매", concepts_covered: ["함수 종속"], concepts_missed: ["완전 함수 종속 조건"], errors: ["복합키의 일부에만 종속된 경우를 완전 종속이라고 오답"], review_required: true },
        ],
      },
      {
        id: "s10-p2", problem_number: 2,
        subject_area: "데이터 모델링의 이해",
        concepts: ["이행 함수 종속", "3NF", "BCNF"],
        solution_summary: "3NF와 BCNF의 차이 및 이행 함수 종속 제거 과정 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["이행 함수 종속", "3NF"], concepts_missed: ["BCNF 조건"], errors: [], review_required: true },
        ],
      },
      {
        id: "s10-p3", problem_number: 3,
        subject_area: "데이터 모델링의 이해",
        concepts: ["반정규화", "집계 테이블", "이력 테이블"],
        solution_summary: "성능 최적화를 위한 반정규화 기법과 집계/이력 테이블 활용 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["반정규화", "집계 테이블"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
      {
        id: "s10-p4", problem_number: 4,
        subject_area: "데이터 모델링의 이해",
        concepts: ["정규화 장단점", "조인 증가", "무결성"],
        solution_summary: "정규화 심화 시 발생하는 조인 증가와 무결성 보장 트레이드오프 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["정규화 장단점", "무결성"], concepts_missed: [], errors: [], review_required: false },
        ],
      },
    ],
  },
  {
    id: "s11",
    session_date: "2026-04-08",
    book: "SQLP 기본서 - SQL 기본 문법",
    speakers: ["세은", "수철"],
    created_at: "2026-04-08T10:00:00.000Z",
    problems: [
      {
        id: "s11-p1", problem_number: 1,
        subject_area: "SQL 기본 및 활용",
        concepts: ["SELECT", "FROM", "WHERE", "실행 순서"],
        solution_summary: "SQL 실행 순서(FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY) 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["SQL 실행 순서"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["SQL 실행 순서"], errors: ["SELECT가 FROM보다 먼저 실행된다고 오답"], review_required: true },
        ],
      },
      {
        id: "s11-p2", problem_number: 2,
        subject_area: "SQL 기본 및 활용",
        concepts: ["WHERE절", "LIKE", "BETWEEN", "IN"],
        solution_summary: "다양한 WHERE 조건 연산자의 동작과 NOT 조건 결합 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["LIKE", "BETWEEN", "IN"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["LIKE", "IN"], concepts_missed: ["BETWEEN 경계값 포함 여부"], errors: [], review_required: true },
        ],
      },
      {
        id: "s11-p3", problem_number: 3,
        subject_area: "SQL 기본 및 활용",
        concepts: ["GROUP BY", "HAVING", "집계 함수"],
        solution_summary: "HAVING 조건의 사용 위치와 WHERE와의 실행 순서 차이 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["GROUP BY", "HAVING"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: false, understanding: "애매", concepts_covered: ["GROUP BY"], concepts_missed: ["HAVING 사용 조건"], errors: ["집계 함수 조건을 WHERE에 사용 가능하다고 오답"], review_required: true },
        ],
      },
      {
        id: "s11-p4", problem_number: 4,
        subject_area: "SQL 기본 및 활용",
        concepts: ["ORDER BY", "NULL 정렬", "NULLS FIRST", "NULLS LAST"],
        solution_summary: "ORDER BY에서 NULL 값의 기본 정렬 순서와 NULLS FIRST/LAST 제어 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "애매", concepts_covered: ["ORDER BY"], concepts_missed: ["NULL 기본 정렬 순서"], errors: ["Oracle에서 NULL이 오름차순 시 맨 앞에 온다고 오답"], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["NULL 정렬", "NULLS FIRST", "NULLS LAST"], errors: ["DBMS와 무관하게 NULL이 항상 마지막이라고 오답"], review_required: true },
        ],
      },
      {
        id: "s11-p5", problem_number: 5,
        subject_area: "SQL 기본 및 활용",
        concepts: ["숫자 함수", "문자 함수", "날짜 함수"],
        solution_summary: "ROUND, TRUNC, SUBSTR, TO_DATE 등 내장 함수 사용법 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "잘함", concepts_covered: ["숫자 함수", "문자 함수", "날짜 함수"], concepts_missed: [], errors: [], review_required: false },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["문자 함수"], concepts_missed: ["날짜 함수 형식"], errors: [], review_required: true },
        ],
      },
    ],
  },
  {
    id: "s12",
    session_date: "2026-03-25",
    book: "SQLP 기본서 - ERD와 관계",
    speakers: ["세은", "수철"],
    created_at: "2026-03-25T10:00:00.000Z",
    problems: [
      {
        id: "s12-p1", problem_number: 1,
        subject_area: "데이터 모델링의 이해",
        concepts: ["ERD", "엔터티", "속성", "관계"],
        solution_summary: "ERD 구성 요소(엔터티, 속성, 관계)의 표기법과 의미 해석 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["ERD 표기법", "관계 표기"], errors: ["엔터티와 속성을 ERD에서 동일하게 표기한다고 오답"], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["ERD", "엔터티", "관계"], errors: ["관계선의 까마귀발 표기 의미를 반대로 해석"], review_required: true },
        ],
      },
      {
        id: "s12-p2", problem_number: 2,
        subject_area: "데이터 모델링의 이해",
        concepts: ["카디널리티", "1:N 관계", "M:N 관계", "관계 해소"],
        solution_summary: "M:N 관계 해소 방법과 카디널리티에 따른 테이블 설계 변화 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["카디널리티", "1:N 관계"], concepts_missed: ["M:N 관계 해소 방법"], errors: [], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["M:N 관계 해소", "교차 엔터티"], errors: ["M:N 관계를 직접 구현 가능하다고 오답"], review_required: true },
        ],
      },
      {
        id: "s12-p3", problem_number: 3,
        subject_area: "데이터 모델링의 이해",
        concepts: ["식별 관계", "비식별 관계"],
        solution_summary: "식별 관계와 비식별 관계의 외래키 포함 여부와 선택 기준 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["식별 관계"], concepts_missed: ["비식별 관계 선택 기준"], errors: [], review_required: true },
          { name: "수철", is_correct: true, understanding: "애매", concepts_covered: ["비식별 관계"], concepts_missed: ["식별 관계 PK 구성"], errors: [], review_required: true },
        ],
      },
      {
        id: "s12-p4", problem_number: 4,
        subject_area: "데이터 모델링의 이해",
        concepts: ["선택성", "필수 참여", "선택 참여"],
        solution_summary: "관계에서의 선택성(O/I 표기)과 데이터 무결성 제약 연관 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "애매", concepts_covered: ["선택성"], concepts_missed: ["필수 참여 vs 선택 참여 표기"], errors: ["O가 필수 참여를 나타낸다고 오답"], review_required: true },
          { name: "수철", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["선택성", "필수/선택 참여"], errors: ["ERD 선택성 기호를 학습하지 않음"], review_required: true },
        ],
      },
    ],
  },
  {
    id: "s13",
    session_date: "2026-03-15",
    book: "SQLP 기본서 - 데이터 모델 개요",
    speakers: ["세은"],
    created_at: "2026-03-15T10:00:00.000Z",
    problems: [
      {
        id: "s13-p1", problem_number: 1,
        subject_area: "데이터 모델링의 이해",
        concepts: ["데이터 모델링", "개념적 모델링", "논리적 모델링", "물리적 모델링"],
        solution_summary: "데이터 모델링 3단계(개념/논리/물리)의 산출물과 수행 순서 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["논리적 모델링", "물리적 모델링"], errors: ["논리/물리 모델링의 순서를 혼동"], review_required: true },
        ],
      },
      {
        id: "s13-p2", problem_number: 2,
        subject_area: "데이터 모델링의 이해",
        concepts: ["스키마", "3층 스키마", "외부 스키마", "개념 스키마", "내부 스키마"],
        solution_summary: "ANSI/SPARC 3층 스키마 구조와 각 레벨의 독립성 개념 문제",
        participants: [
          { name: "세은", is_correct: false, understanding: "모름", concepts_covered: [], concepts_missed: ["3층 스키마", "논리적 독립성", "물리적 독립성"], errors: ["외부 스키마가 최하위 계층이라고 오답"], review_required: true },
        ],
      },
      {
        id: "s13-p3", problem_number: 3,
        subject_area: "데이터 모델링의 이해",
        concepts: ["엔터티 유형", "키 엔터티", "메인 엔터티", "행위 엔터티"],
        solution_summary: "엔터티 발생 시점에 따른 유형 분류와 각 유형의 특징 문제",
        participants: [
          { name: "세은", is_correct: true, understanding: "애매", concepts_covered: ["키 엔터티", "메인 엔터티"], concepts_missed: ["행위 엔터티 특징"], errors: [], review_required: true },
        ],
      },
    ],
  },
];

// ── Session Summaries ─────────────────────────────────────────────────────────

function calcAvgUnderstanding(session: LearningSession): number {
  let sum = 0, n = 0;
  for (const p of session.problems) {
    for (const pt of p.participants) {
      sum += pt.understanding === "잘함" ? 100 : pt.understanding === "애매" ? 50 : 0;
      n++;
    }
  }
  return n > 0 ? Math.round(sum / n) : 0;
}

function calcReviewCount(session: LearningSession): number {
  let count = 0;
  for (const p of session.problems) {
    for (const pt of p.participants) {
      if (pt.review_required) count++;
    }
  }
  return count;
}

export const MOCK_SESSION_SUMMARIES: SessionSummary[] = MOCK_SESSIONS.map((s) => ({
  id: s.id,
  date: s.session_date,
  book: s.book,
  problemCount: s.problems.length,
  speakers: s.speakers,
  averageUnderstanding: calcAvgUnderstanding(s),
  reviewRequiredCount: calcReviewCount(s),
}));

// ── Dashboard Summary ─────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  weeklyProblemCount: 14,
  reviewRequiredCount: 31,
  averageUnderstanding: 68,
  studyStreak: 12,
};

// ── Review Recommendations ────────────────────────────────────────────────────

export const MOCK_REVIEW_RECOMMENDATIONS: ReviewRecommendation[] = [
  { concept: "GROUPING SETS와 GROUPING 함수", subject: "SQL 기본 및 활용", reason: "두 세션 연속 오답 - GROUPING 함수 반환값 혼동", score: 20 },
  { concept: "파티셔닝 (Range/Hash)", subject: "SQL 고급 활용 및 튜닝", reason: "프루닝 조건 미이해 - 복습 필요로 표시됨", score: 15 },
  { concept: "3층 스키마 구조", subject: "데이터 모델링의 이해", reason: "3월 이후 미복습 - 오답 기록 있음", score: 10 },
];

// ── Calendar ──────────────────────────────────────────────────────────────────

const STUDY_DAYS_2026_06 = [2, 5, 12, 17, 20];
const STUDY_DAYS_2026_05 = [5, 14, 25];
const STUDY_DAYS_2026_04 = [8, 21];
const STUDY_DAYS_2026_03 = [15, 25];

function sessionForDate(dateStr: string) {
  return MOCK_SESSIONS.find((s) => s.session_date === dateStr);
}

function buildCalendarDay(year: number, month: number, day: number) {
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const session = sessionForDate(dateStr);
  if (!session) return null;
  return {
    date: dateStr,
    problemCount: session.problems.length,
    averageUnderstanding: calcAvgUnderstanding(session),
    reviewRequiredCount: calcReviewCount(session),
    concepts: session.problems.flatMap((p) => p.concepts).slice(0, 4),
    speakers: session.speakers,
    completed: true,
  };
}

export function getMockCalendar(year: number, month: number) {
  const studyDayMap: Record<string, number[]> = {
    "2026-6": STUDY_DAYS_2026_06,
    "2026-5": STUDY_DAYS_2026_05,
    "2026-4": STUDY_DAYS_2026_04,
    "2026-3": STUDY_DAYS_2026_03,
  };
  const days = (studyDayMap[`${year}-${month}`] ?? [])
    .map((d) => buildCalendarDay(year, month, d))
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const totalProblems = days.reduce((s, d) => s + (d?.problemCount ?? 0), 0);
  const reviewCount = days.reduce((s, d) => s + (d?.reviewRequiredCount ?? 0), 0);

  const result: import("@/domain/types").CalendarResponse = {
    year,
    month,
    days,
    summary: { studyStreak: days.length, totalProblemCount: totalProblems, reviewRequiredCount: reviewCount },
  };
  return result;
}

// ── Weak Concepts ─────────────────────────────────────────────────────────────

export const MOCK_WEAK_CONCEPTS: WeakConcept[] = [
  { name: "GROUPING SETS와 GROUPING 함수", subject: "SQL 기본 및 활용", totalProblems: 3, weakCountByParticipant: { 세은: 1, 수철: 2 }, scoreByParticipant: { 세은: 30, 수철: 10 }, averageScore: 20, lastReviewDate: "2026-05-25", recommend: true },
  { name: "파티셔닝 (Range/Hash Partition)", subject: "SQL 고급 활용 및 튜닝", totalProblems: 2, weakCountByParticipant: { 세은: 1 }, scoreByParticipant: { 세은: 40 }, averageScore: 40, lastReviewDate: "2026-06-17", recommend: true },
  { name: "3층 스키마 구조", subject: "데이터 모델링의 이해", totalProblems: 2, weakCountByParticipant: { 세은: 2 }, scoreByParticipant: { 세은: 10 }, averageScore: 10, lastReviewDate: "2026-03-15", recommend: true },
  { name: "윈도우 프레임 (ROWS/RANGE BETWEEN)", subject: "SQL 기본 및 활용", totalProblems: 3, weakCountByParticipant: { 세은: 1, 수철: 2 }, scoreByParticipant: { 세은: 45, 수철: 15 }, averageScore: 30, lastReviewDate: "2026-06-05", recommend: true },
  { name: "M:N 관계 해소", subject: "데이터 모델링의 이해", totalProblems: 2, weakCountByParticipant: { 세은: 1, 수철: 2 }, scoreByParticipant: { 세은: 50, 수철: 10 }, averageScore: 30, lastReviewDate: "2026-03-25", recommend: true },
  { name: "NATURAL JOIN / USING절 제약", subject: "SQL 기본 및 활용", totalProblems: 2, weakCountByParticipant: { 수철: 1 }, scoreByParticipant: { 수철: 50 }, averageScore: 50, lastReviewDate: "2026-05-05", recommend: false },
  { name: "복합 인덱스 선두 컬럼", subject: "SQL 고급 활용 및 튜닝", totalProblems: 2, weakCountByParticipant: { 수철: 2 }, scoreByParticipant: { 수철: 25 }, averageScore: 25, lastReviewDate: "2026-06-12", recommend: false },
  { name: "ORDER BY NULL 정렬 순서", subject: "SQL 기본 및 활용", totalProblems: 2, weakCountByParticipant: { 세은: 1, 수철: 2 }, scoreByParticipant: { 세은: 50, 수철: 10 }, averageScore: 30, lastReviewDate: "2026-04-08", recommend: false },
  { name: "재귀 CTE (WITH절 재귀)", subject: "SQL 기본 및 활용", totalProblems: 2, weakCountByParticipant: { 세은: 1 }, scoreByParticipant: { 세은: 45 }, averageScore: 45, lastReviewDate: "2026-06-02", recommend: false },
  { name: "이행 함수 종속 / BCNF", subject: "데이터 모델링의 이해", totalProblems: 2, weakCountByParticipant: { 세은: 1 }, scoreByParticipant: { 세은: 50 }, averageScore: 50, lastReviewDate: "2026-04-21", recommend: false },
];

// ── Wrong Answers ─────────────────────────────────────────────────────────────

export const MOCK_WRONG_ANSWERS: WrongAnswerItem[] = [
  { id: "wa1", sessionId: "s13", problemId: "s13-p1", problemNumber: 1, sessionDate: "2026-03-15", book: "SQLP 기본서 - 데이터 모델 개요", person: "세은", concepts: ["개념적 모델링", "논리적 모델링", "물리적 모델링"], understanding: "모름", missed: ["논리적 모델링", "물리적 모델링"], errors: ["논리/물리 모델링의 순서를 혼동"], explanation: "데이터 모델링 3단계의 순서는 개념 → 논리 → 물리이며, 각 단계의 산출물을 명확히 구분해야 합니다.", isCorrect: false, reviewRequired: true },
  { id: "wa2", sessionId: "s13", problemId: "s13-p2", problemNumber: 2, sessionDate: "2026-03-15", book: "SQLP 기본서 - 데이터 모델 개요", person: "세은", concepts: ["3층 스키마", "외부 스키마", "내부 스키마"], understanding: "모름", missed: ["3층 스키마", "논리적 독립성", "물리적 독립성"], errors: ["외부 스키마가 최하위 계층이라고 오답"], explanation: "ANSI/SPARC 3층 스키마: 외부 스키마(사용자 뷰) → 개념 스키마(통합 뷰) → 내부 스키마(물리적 저장). 외부가 최상위.", isCorrect: false, reviewRequired: true },
  { id: "wa4", sessionId: "s12", problemId: "s12-p1", problemNumber: 1, sessionDate: "2026-03-25", book: "SQLP 기본서 - ERD와 관계", person: "세은", concepts: ["ERD", "엔터티", "속성"], understanding: "모름", missed: ["ERD 표기법", "관계 표기"], errors: ["엔터티와 속성을 ERD에서 동일하게 표기한다고 오답"], explanation: "ERD에서 엔터티는 사각형, 속성은 타원, 관계는 마름모(IE 표기법에서는 선과 기호)로 구분하여 표기합니다.", isCorrect: false, reviewRequired: true },
  { id: "wa5", sessionId: "s12", problemId: "s12-p2", problemNumber: 2, sessionDate: "2026-03-25", book: "SQLP 기본서 - ERD와 관계", person: "수철", concepts: ["M:N 관계", "교차 엔터티", "관계 해소"], understanding: "모름", missed: ["M:N 관계 해소", "교차 엔터티"], errors: ["M:N 관계를 직접 구현 가능하다고 오답"], explanation: "관계형 DB에서 M:N 관계는 직접 구현 불가. 교차 엔터티(관계 테이블)를 통해 1:N + N:1로 해소해야 합니다.", isCorrect: false, reviewRequired: true },
  { id: "wa6", sessionId: "s11", problemId: "s11-p1", problemNumber: 1, sessionDate: "2026-04-08", book: "SQLP 기본서 - SQL 기본 문법", person: "수철", concepts: ["SQL 실행 순서", "SELECT", "FROM"], understanding: "모름", missed: ["SQL 실행 순서"], errors: ["SELECT가 FROM보다 먼저 실행된다고 오답"], explanation: "SQL 실행 순서: FROM → ON → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT", isCorrect: false, reviewRequired: true },
  { id: "wa7", sessionId: "s11", problemId: "s11-p4", problemNumber: 4, sessionDate: "2026-04-08", book: "SQLP 기본서 - SQL 기본 문법", person: "세은", concepts: ["ORDER BY", "NULL 정렬"], understanding: "애매", missed: ["NULL 기본 정렬 순서"], errors: ["Oracle에서 NULL이 오름차순 시 맨 앞에 온다고 오답"], explanation: "Oracle: ASC 정렬 시 NULL이 마지막(NULLS LAST가 기본), DESC 시 NULL이 처음. SQL Server는 반대. DBMS 차이 암기 필요.", isCorrect: false, reviewRequired: true },
  { id: "wa8", sessionId: "s11", problemId: "s11-p4", problemNumber: 4, sessionDate: "2026-04-08", book: "SQLP 기본서 - SQL 기본 문법", person: "수철", concepts: ["NULL 정렬", "NULLS FIRST", "NULLS LAST"], understanding: "모름", missed: ["NULL 정렬", "NULLS FIRST", "NULLS LAST"], errors: ["DBMS와 무관하게 NULL이 항상 마지막이라고 오답"], explanation: "DBMS마다 NULL 정렬 기본값이 다릅니다. Oracle: ASC=마지막/DESC=처음, SQL Server/MySQL: ASC=처음/DESC=마지막.", isCorrect: false, reviewRequired: true },
  { id: "wa9", sessionId: "s10", problemId: "s10-p1", problemNumber: 1, sessionDate: "2026-04-21", book: "SQLP 기본서 - 데이터 정규화", person: "세은", concepts: ["함수 종속", "완전 함수 종속"], understanding: "애매", missed: ["완전 함수 종속 조건"], errors: ["복합키의 일부에만 종속된 경우를 완전 종속이라고 오답"], explanation: "완전 함수 종속: 기본키 전체에 종속. 부분 함수 종속: 복합키의 일부에만 종속. 2NF는 부분 함수 종속 제거.", isCorrect: false, reviewRequired: true },
  { id: "wa10", sessionId: "s9", problemId: "s9-p1", problemNumber: 1, sessionDate: "2026-05-05", book: "SQLP 실전문제 - JOIN 완전정복", person: "수철", concepts: ["CROSS JOIN", "FULL OUTER JOIN"], understanding: "애매", missed: ["CROSS JOIN 결과 행 수"], errors: ["CROSS JOIN과 FULL OUTER JOIN 혼동"], explanation: "CROSS JOIN: 두 테이블의 카테시안 곱 (m×n 행). FULL OUTER JOIN: 두 테이블의 모든 행 포함 (m+n-일치 행). 전혀 다른 개념.", isCorrect: false, reviewRequired: true },
  { id: "wa12", sessionId: "s8", problemId: "s8-p3", problemNumber: 3, sessionDate: "2026-05-14", book: "SQLP 실전문제 - DML과 트랜잭션", person: "수철", concepts: ["Lock", "Row Lock", "Table Lock"], understanding: "모름", missed: ["Row Lock", "Table Lock", "Lock 해제 조건"], errors: ["ROLLBACK이 Lock을 즉시 해제하지 않는다고 오답"], explanation: "COMMIT 또는 ROLLBACK 시 해당 트랜잭션의 모든 Lock이 해제됩니다. ROLLBACK도 Lock을 해제합니다.", isCorrect: false, reviewRequired: true },
  { id: "wa13", sessionId: "s7", problemId: "s7-p4", problemNumber: 4, sessionDate: "2026-05-25", book: "SQLP 실전문제 - 서브쿼리", person: "세은", concepts: ["GROUPING SETS", "GROUPING 함수"], understanding: "애매", missed: ["GROUPING 함수 반환값"], errors: ["GROUPING 함수가 NULL 컬럼에 1을 반환한다는 것을 놓침"], explanation: "GROUPING() 함수: 소계/합계를 위해 NULL로 채워진 컬럼에 1, 실제 데이터가 있는 컬럼에 0 반환.", isCorrect: false, reviewRequired: true },
  { id: "wa14", sessionId: "s7", problemId: "s7-p4", problemNumber: 4, sessionDate: "2026-05-25", book: "SQLP 실전문제 - 서브쿼리", person: "수철", concepts: ["GROUPING SETS", "ROLLUP 비교"], understanding: "모름", missed: ["GROUPING SETS", "GROUPING 함수"], errors: ["GROUPING SETS와 ROLLUP 결과를 동일시"], explanation: "GROUPING SETS는 원하는 집계 조합만 지정, ROLLUP은 계층적 소계 자동 생성. 생성되는 행 구성이 다릅니다.", isCorrect: false, reviewRequired: true },
  { id: "wa16", sessionId: "s5", problemId: "s5-p2", problemNumber: 2, sessionDate: "2026-06-05", book: "SQLP 실전문제 - 윈도우 함수", person: "세은", concepts: ["ROWS BETWEEN", "RANGE BETWEEN"], understanding: "애매", missed: ["RANGE BETWEEN 기본값"], errors: ["RANGE BETWEEN의 기본 동작을 ROWS와 동일하게 판단"], explanation: "ORDER BY 있을 때 기본 프레임: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. CURRENT ROW는 동일 값 전체 포함.", isCorrect: false, reviewRequired: true },
  { id: "wa17", sessionId: "s5", problemId: "s5-p2", problemNumber: 2, sessionDate: "2026-06-05", book: "SQLP 실전문제 - 윈도우 함수", person: "수철", concepts: ["ROWS BETWEEN", "RANGE BETWEEN", "윈도우 프레임"], understanding: "모름", missed: ["ROWS BETWEEN", "RANGE BETWEEN"], errors: ["윈도우 프레임 문법 자체를 모름"], explanation: "윈도우 프레임: ROWS(물리적 행 수 기준) vs RANGE(논리적 값 범위 기준). 기본값과 UNBOUNDED PRECEDING/FOLLOWING 암기 필요.", isCorrect: false, reviewRequired: true },
  { id: "wa20", sessionId: "s3", problemId: "s3-p2", problemNumber: 2, sessionDate: "2026-06-12", book: "SQLP 실전문제 - 인덱스 설계", person: "수철", concepts: ["인덱스 스킵 스캔", "함수기반 인덱스"], understanding: "모름", missed: ["함수기반 인덱스", "인덱스 스킵 스캔"], errors: ["일반 인덱스와 함수기반 인덱스 차이를 구분하지 못함"], explanation: "함수기반 인덱스: WHERE UPPER(col) = 'A' 같이 함수가 적용된 컬럼에 인덱스 생성. 인덱스 스킵 스캔: 선두 컬럼 없어도 사용 가능(Oracle).", isCorrect: false, reviewRequired: true },
  { id: "wa22", sessionId: "s2", problemId: "s2-p5", problemNumber: 5, sessionDate: "2026-06-17", book: "SQLP 기출문제 2024 (1과목)", person: "세은", concepts: ["파티셔닝", "Hash Partition", "파티션 프루닝"], understanding: "애매", missed: ["Hash Partition 프루닝", "파티션 프루닝 조건"], errors: ["Hash Partition에서도 프루닝이 항상 된다고 오답"], explanation: "Hash Partition: 등치 조건(=)일 때만 프루닝. Range Partition: 범위 조건에서도 프루닝 가능. List Partition: 명시적 값에서 프루닝.", isCorrect: false, reviewRequired: true },
  { id: "wa24", sessionId: "s1", problemId: "s1-p5", problemNumber: 5, sessionDate: "2026-06-20", book: "SQLP 기출문제 2024 (2과목)", person: "수철", concepts: ["Index Range Scan", "Index Full Scan", "선택도"], understanding: "애매", missed: ["Index Full Scan 선택 기준"], errors: ["선택도 기준 혼동"], explanation: "선택도가 낮으면(고유값 많음) Index Range Scan 유리. Index Full Scan은 테이블 풀스캔 대신 인덱스 전체를 읽는 방식으로 소트 작업 절약 목적.", isCorrect: false, reviewRequired: true },
];

// ── Growth Report ─────────────────────────────────────────────────────────────

export const MOCK_GROWTH_REPORT: GrowthReport = {
  title: "최근 4주 학습 성장 리포트",
  period: { label: "최근 4주", start: "2026-05-29", end: "2026-06-25" },
  summary: "최근 4주간 평균 이해도가 42%에서 68%로 26%p 향상되었습니다. JOIN과 윈도우 함수 영역에서 눈에 띄는 성장을 보였지만, 파티셔닝과 GROUPING 함수 영역은 여전히 집중 복습이 필요합니다.",
  metrics: [
    { key: "avg_understanding", label: "평균 이해도", current: 68, previous: 42, delta: 26, unit: "%" },
    { key: "weekly_problems", label: "주간 평균 문제 수", current: 14, previous: 8, delta: 6, unit: "문제" },
    { key: "review_count", label: "복습 필요 항목", current: 31, previous: 47, delta: -16, unit: "개" },
    { key: "study_streak", label: "연속 학습일", current: 12, previous: 5, delta: 7, unit: "일" },
  ],
  improvedConcepts: [
    { id: "ic1", name: "INNER JOIN / OUTER JOIN", subject: "SQL 기본 및 활용", delta: 55, score: 95 },
    { id: "ic2", name: "RANK / DENSE_RANK / ROW_NUMBER", subject: "SQL 기본 및 활용", delta: 48, score: 88 },
    { id: "ic3", name: "COMMIT / ROLLBACK / SAVEPOINT", subject: "SQL 기본 및 활용", delta: 40, score: 90 },
    { id: "ic4", name: "복합 인덱스 설계", subject: "SQL 고급 활용 및 튜닝", delta: 35, score: 75 },
    { id: "ic5", name: "정규화 (1NF/2NF/3NF)", subject: "데이터 모델링의 이해", delta: 30, score: 80 },
  ],
  weakConcepts: [
    { id: "wc1", name: "GROUPING SETS / GROUPING 함수", subject: "SQL 기본 및 활용", delta: 5, score: 20 },
    { id: "wc2", name: "파티셔닝 (Range/Hash)", subject: "SQL 고급 활용 및 튜닝", delta: -2, score: 15 },
    { id: "wc3", name: "3층 스키마 구조", subject: "데이터 모델링의 이해", delta: 8, score: 10 },
    { id: "wc4", name: "LAG / LEAD 함수 고급 활용", subject: "SQL 기본 및 활용", delta: 10, score: 25 },
  ],
  trend: [
    { label: "3/15-3/21", value: 22 },
    { label: "3/22-3/28", value: 35 },
    { label: "4/1-4/7", value: 38 },
    { label: "4/8-4/14", value: 42 },
    { label: "4/15-4/21", value: 50 },
    { label: "4/22-4/28", value: 52 },
    { label: "5/1-5/7", value: 55 },
    { label: "5/8-5/14", value: 58 },
    { label: "5/15-5/21", value: 60 },
    { label: "5/22-5/28", value: 62 },
    { label: "5/29-6/4", value: 63 },
    { label: "6/5-6/11", value: 65 },
    { label: "6/12-6/18", value: 66 },
    { label: "6/19-6/25", value: 68 },
  ],
  recommendations: [
    { id: "r1", title: "GROUPING SETS 집중 복습", reason: "세은·수철 모두 오답 - 2회 연속 실수 구간" },
    { id: "r2", title: "파티셔닝 유형별 프루닝 조건 암기", reason: "Hash/Range/List Partition별 프루닝 조건 정리 필요" },
    { id: "r3", title: "3층 스키마 다시 시작", reason: "3월 이후 미복습 - 기초 개념 재정립 권장" },
  ],
};

// ── Study Comparison ──────────────────────────────────────────────────────────

export const MOCK_STUDY_COMPARISON: StudyComparisonResponse = {
  title: "SQLP 스터디 멤버 이해도 비교 (2026-06 기준)",
  members: [
    { name: "세은", averageUnderstanding: 72, goodCount: 28, vagueCount: 18, unknownCount: 9 },
    { name: "수철", averageUnderstanding: 53, goodCount: 14, vagueCount: 20, unknownCount: 18 },
  ],
  rows: [
    { id: 1, concept: "INNER JOIN / OUTER JOIN", subject: "SQL 기본 및 활용", understandings: { 세은: "잘함", 수철: "잘함" } },
    { id: 2, concept: "윈도우 함수 RANK/DENSE_RANK", subject: "SQL 기본 및 활용", understandings: { 세은: "잘함", 수철: "잘함" } },
    { id: 3, concept: "GROUPING SETS", subject: "SQL 기본 및 활용", understandings: { 세은: "애매", 수철: "모름" } },
    { id: 4, concept: "ROLLUP / CUBE", subject: "SQL 기본 및 활용", understandings: { 세은: "잘함", 수철: "애매" } },
    { id: 5, concept: "CONNECT BY 계층형 질의", subject: "SQL 기본 및 활용", understandings: { 세은: "애매", 수철: "모름" } },
    { id: 6, concept: "LAG / LEAD 함수", subject: "SQL 기본 및 활용", understandings: { 세은: "잘함", 수철: "애매" } },
    { id: 7, concept: "ROWS/RANGE BETWEEN 프레임", subject: "SQL 기본 및 활용", understandings: { 세은: "애매", 수철: "모름" } },
    { id: 8, concept: "EXISTS / IN 서브쿼리", subject: "SQL 기본 및 활용", understandings: { 세은: "잘함", 수철: "애매" } },
    { id: 9, concept: "복합 인덱스 선두 컬럼", subject: "SQL 고급 활용 및 튜닝", understandings: { 세은: "잘함", 수철: "애매" } },
    { id: 10, concept: "NL Join / Hash Join", subject: "SQL 고급 활용 및 튜닝", understandings: { 세은: "잘함", 수철: "잘함" } },
    { id: 11, concept: "파티셔닝 프루닝", subject: "SQL 고급 활용 및 튜닝", understandings: { 세은: "애매", 수철: "모름" } },
    { id: 12, concept: "Bind Variable / 파싱", subject: "SQL 고급 활용 및 튜닝", understandings: { 세은: "잘함", 수철: "애매" } },
    { id: 13, concept: "옵티마이저 CBO/RBO", subject: "SQL 고급 활용 및 튜닝", understandings: { 세은: "잘함", 수철: "잘함" } },
    { id: 14, concept: "정규화 1NF/2NF/3NF", subject: "데이터 모델링의 이해", understandings: { 세은: "잘함", 수철: "애매" } },
    { id: 15, concept: "반정규화 적용 기준", subject: "데이터 모델링의 이해", understandings: { 세은: "잘함", 수철: "애매" } },
    { id: 16, concept: "ERD 표기법", subject: "데이터 모델링의 이해", understandings: { 세은: "애매", 수철: "모름" } },
    { id: 17, concept: "식별/비식별 관계", subject: "데이터 모델링의 이해", understandings: { 세은: "애매", 수철: "애매" } },
    { id: 18, concept: "3층 스키마", subject: "데이터 모델링의 이해", understandings: { 세은: "모름", 수철: "모름" } },
  ],
};

// ── Concept Detail ────────────────────────────────────────────────────────────

const CONCEPT_DETAIL_MAP: Record<string, ConceptDetail> = {
  default: {
    id: "1",
    name: "GROUPING SETS와 GROUPING 함수",
    subject: "SQL 기본 및 활용",
    chapter: "3장. SQL 활용",
    section: "3.2 그룹 함수",
    summary: "GROUPING SETS는 원하는 집계 조합만 명시적으로 지정하는 그룹 함수입니다. ROLLUP/CUBE와 달리 계층 구조 없이 필요한 집계 행만 생성합니다. GROUPING() 함수는 해당 컬럼이 집계를 위해 NULL로 채워진 경우 1, 실제 데이터인 경우 0을 반환합니다.",
    easyExplanation: "GROUPING SETS는 '이 조합들로만 집계해줘'라고 골라서 지정하는 것입니다. 예를 들어 (부서별), (직급별), (전체) 세 가지 집계가 필요할 때 각각 쿼리를 UNION ALL 하는 대신 GROUPING SETS((부서), (직급), ())로 한 번에 구할 수 있습니다.",
    keywords: ["GROUPING SETS", "GROUPING 함수", "다차원 집계", "소계", "합계", "ROLLUP", "CUBE"],
    examples: [
      {
        title: "GROUPING SETS 기본 사용",
        code: `SELECT dept, job, SUM(sal)\nFROM emp\nGROUP BY GROUPING SETS((dept, job), (dept), ());`,
        description: "(부서+직급), (부서), (전체합계) 세 가지 집계를 한 번에 조회",
      },
      {
        title: "GROUPING 함수로 소계 행 구분",
        code: `SELECT \n  CASE WHEN GROUPING(dept) = 1 THEN '전체' ELSE dept END AS dept,\n  CASE WHEN GROUPING(job) = 1 THEN '소계' ELSE job END AS job,\n  SUM(sal)\nFROM emp\nGROUP BY GROUPING SETS((dept, job), (dept), ());`,
        description: "GROUPING()이 1인 경우(소계 행)를 구분하여 레이블 변경",
      },
    ],
    commonMistakes: [
      "GROUPING SETS와 ROLLUP/CUBE의 결과 행 수를 동일하게 생각하는 실수",
      "GROUPING() 함수가 NULL 값에 항상 1을 반환한다고 오해 - 집계용 NULL에만 1 반환",
      "GROUPING SETS(())의 빈 괄호가 전체 합계를 의미함을 모름",
    ],
    memorizationPoints: [
      "GROUPING(col) = 1 → 집계를 위한 NULL (소계/합계 행)",
      "GROUPING(col) = 0 → 실제 데이터 값 (일반 행)",
      "ROLLUP(a,b) = GROUPING SETS((a,b),(a),())",
      "CUBE(a,b) = GROUPING SETS((a,b),(a),(b),())",
    ],
    relatedConcepts: [
      { id: "2", name: "ROLLUP" },
      { id: "3", name: "CUBE" },
      { name: "GROUP BY" },
      { name: "집계 함수" },
    ],
  },
};

export function getMockConceptDetail(id: string | number): ConceptDetail {
  return CONCEPT_DETAIL_MAP[String(id)] ?? { ...CONCEPT_DETAIL_MAP.default, id: String(id) };
}

// ── Mock Comments ─────────────────────────────────────────────────────────────
// 참여자 ID는 sessions.ts에서 MOCK_SESSIONS 순서대로 할당된다.
// s1: 세은=1, 수철=2 (문제당 +2)
// s2: 세은=11..15 (세은만)
// s3: 세은=16, 수철=17 (문제당 +2)

// 목 댓글 작성자: 세은(is_mine=true, author_id=0), 수철(1)

export const MOCK_COMMENTS_INIT: Record<number, Comment[]> = {
  // ── s1-p1: CASE WHEN / NULL 처리 / DECODE ──────────────────────────────────
  // 세은(잘함) id=1
  1: [
    { id: 101, content: "이 문제 핵심 잘 짚었다. DECODE NULL 처리 차이 나도 헷갈렸었어.", author_id: 1, author_name: "수철", created_at: "2026-06-20T10:30:00Z", is_mine: false },
    { id: 103, content: "DECODE(col, NULL, '없음', '있음') 이렇게 쓸 때 col이 NULL이면 '없음'이 나와. CASE WHEN col IS NULL THEN과 같아!", author_id: 0, author_name: "세은", created_at: "2026-06-20T11:00:00Z", is_mine: true },
    { id: 104, content: "오 그래서 DECODE가 NULL 비교할 때는 예외적으로 = 가 동작하는 거구나!", author_id: 1, author_name: "수철", created_at: "2026-06-20T11:15:00Z", is_mine: false },
  ],
  // 수철(애매) id=2
  2: [
    { id: 201, content: "NULL 비교는 항상 IS NULL / IS NOT NULL 써! = 연산자로 비교하면 항상 FALSE야.", author_id: 0, author_name: "세은", created_at: "2026-06-20T10:32:00Z", is_mine: true },
    { id: 203, content: "이번엔 진짜 외웠다... 다음엔 안 틀릴게!", author_id: 1, author_name: "수철", created_at: "2026-06-20T11:05:00Z", is_mine: false },
    { id: 204, content: "DECODE에서만 NULL == NULL이 true라는 것도 같이 외워줘!", author_id: 0, author_name: "세은", created_at: "2026-06-20T11:20:00Z", is_mine: true },
  ],
  // ── s1-p2: GROUP BY / ROLLUP / CUBE ──────────────────────────────────────
  // 세은(잘함) id=3
  3: [
    { id: 401, content: "ROLLUP이랑 CUBE 차이 어떻게 외웠어?", author_id: 1, author_name: "수철", created_at: "2026-06-20T10:35:00Z", is_mine: false },
    { id: 402, content: "ROLLUP은 왼→오 점진적 집계, CUBE는 모든 컬럼 조합! n개면 2^n 소계 행 생성.", author_id: 0, author_name: "세은", created_at: "2026-06-20T10:55:00Z", is_mine: true },
  ],
  // 수철(애매) id=4
  4: [
    { id: 501, content: "CUBE(A,B)면 (), (A), (B), (A,B) 이렇게 4가지 소계 다 만들어. ROLLUP이랑 다르게 순서 상관없어.", author_id: 0, author_name: "세은", created_at: "2026-06-20T10:36:00Z", is_mine: true },
    { id: 502, content: "아 그래서 ROLLUP(A,B)이랑 ROLLUP(B,A)가 다르고 CUBE는 같은 거구나!", author_id: 1, author_name: "수철", created_at: "2026-06-20T11:00:00Z", is_mine: false },
    { id: 504, content: "수철아 ROLLUP(A,B) = GROUPING SETS((A,B),(A),()) 라고 외워두면 편해!", author_id: 0, author_name: "세은", created_at: "2026-06-20T11:40:00Z", is_mine: true },
  ],
  // ── s1-p3: 실행계획 / NL Join / Hash Join ──────────────────────────────────
  // 세은(잘함) id=5
  5: [
    { id: 701, content: "NL은 이중 루프, Hash는 해시 테이블 구축 맞지? 설명 정말 명쾌하다.", author_id: 1, author_name: "수철", created_at: "2026-06-20T10:38:00Z", is_mine: false },
    { id: 702, content: "맞아~ NL은 인덱스 있을 때 유리, Hash는 대용량 equi-join에 유리!", author_id: 0, author_name: "세은", created_at: "2026-06-20T10:58:00Z", is_mine: true },
  ],
  // 수철(잘함) id=6
  6: [
    { id: 801, content: "수철이도 조인 완벽하게 이해했네!", author_id: 0, author_name: "세은", created_at: "2026-06-20T10:39:00Z", is_mine: true },
    { id: 803, content: "Sort Merge는 양쪽 정렬 후 병합이라 정렬된 데이터에 유리, Hash는 정렬 없이 해시값으로 매핑!", author_id: 1, author_name: "수철", created_at: "2026-06-20T11:22:00Z", is_mine: false },
  ],
  // ── s1-p4: 식별자 / 주식별자 / 외래키 ────────────────────────────────────
  // 세은(잘함) id=7
  7: [
    { id: 1001, content: "주식별자 NULL 불가, 외래키 NULL 가능 - 이거 시험 단골 포인트야.", author_id: 1, author_name: "수철", created_at: "2026-06-20T10:41:00Z", is_mine: false },
    { id: 1002, content: "맞아! 외래키는 선택적 관계에서 NULL 허용. CASCADE/SET NULL/RESTRICT 옵션도 같이 외워둬.", author_id: 0, author_name: "세은", created_at: "2026-06-20T11:01:00Z", is_mine: true },
    { id: 1004, content: "정확해! ON DELETE CASCADE는 같이 삭제, ON DELETE SET NULL은 NULL로, ON DELETE RESTRICT는 막아줘.", author_id: 0, author_name: "세은", created_at: "2026-06-20T11:48:00Z", is_mine: true },
  ],
  // 수철(애매) id=8
  8: [
    { id: 1101, content: "외래키 NULL 허용 조건: 선택적 관계일 때 FK가 NULL 가질 수 있어.", author_id: 0, author_name: "세은", created_at: "2026-06-20T10:42:00Z", is_mine: true },
    { id: 1102, content: "아 필수 참여 관계면 NOT NULL, 선택 참여면 NULL 허용이구나!", author_id: 1, author_name: "수철", created_at: "2026-06-20T11:05:00Z", is_mine: false },
  ],
  // ── s1-p5: 인덱스 스캔 / Index Range Scan / Index Full Scan ──────────────
  // 세은(잘함) id=9
  9: [
    { id: 1301, content: "Index Range Scan 선택 기준이 뭐야? 선택도?", author_id: 1, author_name: "수철", created_at: "2026-06-20T10:44:00Z", is_mine: false },
    { id: 1302, content: "= , BETWEEN, IN, LIKE 'abc%' 같은 범위 조건일 때 Range Scan. Full Scan은 대부분 데이터 읽을 때 유리해.", author_id: 0, author_name: "세은", created_at: "2026-06-20T11:04:00Z", is_mine: true },
  ],
  // 수철(애매) id=10
  10: [
    { id: 1401, content: "선택도 기준 헷갈리면: 결과가 5~10% 이하면 인덱스, 그 이상이면 Full Scan이 효율적이라고 기억해!", author_id: 0, author_name: "세은", created_at: "2026-06-20T10:45:00Z", is_mine: true },
    { id: 1403, content: "아 그래서 통계 정보 최신화가 중요하구나! DBMS_STATS 같은 거?", author_id: 1, author_name: "수철", created_at: "2026-06-20T11:35:00Z", is_mine: false },
    { id: 1404, content: "맞아! Oracle이면 DBMS_STATS.GATHER_TABLE_STATS 쓰면 돼.", author_id: 0, author_name: "세은", created_at: "2026-06-20T11:50:00Z", is_mine: true },
  ],
  // ── s2-p1: 정규화 / 1NF / 2NF / 3NF ────────────────────────────────────
  // 세은(잘함) id=11
  11: [
    { id: 1601, content: "BCNF는 '모든 결정자가 후보키'여야 해. 3NF는 이행 종속만 제거하면 되는데 BCNF는 더 엄격해.", author_id: 0, author_name: "세은", created_at: "2026-06-17T10:50:00Z", is_mine: true },
  ],
  // ── s2-p2: 반정규화 / 테이블 병합 / 컬럼 중복 ───────────────────────────
  // 세은(잘함) id=12
  12: [
    { id: 1802, content: "조회 빈도 높고, JOIN 복잡하거나, 집계 많을 때! 단 무결성 유지 비용도 고려해야 해.", author_id: 0, author_name: "세은", created_at: "2026-06-17T10:54:00Z", is_mine: true },
  ],
  // ── s2-p3: OUTER JOIN ────────────────────────────────────────────────────
  // 세은(잘함) id=13
  13: [
    { id: 2002, content: "LEFT OUTER JOIN은 왼쪽 테이블 전부 + 오른쪽은 매칭될 때만. 매칭 안 되면 NULL.", author_id: 0, author_name: "세은", created_at: "2026-06-17T10:56:00Z", is_mine: true },
  ],
  // ── s2-p4: 서브쿼리 / 스칼라 서브쿼리 / 인라인 뷰 ───────────────────────
  // 세은(잘함) id=14
  14: [
    { id: 2202, content: "입력값이 같으면 재실행 없이 캐시된 결과 반환해. 입력 다양성 낮을수록 효과적이야!", author_id: 0, author_name: "세은", created_at: "2026-06-17T10:58:00Z", is_mine: true },
    { id: 2302, content: "인라인 뷰는 FROM 절 서브쿼리고, 스칼라는 SELECT 절 서브쿼리지!", author_id: 0, author_name: "세은", created_at: "2026-06-17T11:02:00Z", is_mine: true },
  ],
  // ── s2-p5: 파티셔닝 / Range Partition / Hash Partition ───────────────────
  // 세은(애매) id=15
  15: [
    { id: 2402, content: "이 문제 함정이 Hash Partition도 프루닝된다고 착각하는 거였어. 다음엔 꼭 맞힐게.", author_id: 0, author_name: "세은", created_at: "2026-06-17T11:00:00Z", is_mine: true },
    { id: 2501, content: "파티셔닝과 인덱스는 완전히 다른 개념이야. 파티셔닝은 테이블을 물리적으로 분리하는 것!", author_id: 0, author_name: "세은", created_at: "2026-06-17T10:41:00Z", is_mine: true },
    { id: 2502, content: "Range, Hash, List, Composite - 4가지 파티션 유형 외워두자!", author_id: 0, author_name: "세은", created_at: "2026-06-17T11:05:00Z", is_mine: true },
  ],
  // ── s3-p1: 복합 인덱스 / 선두 컬럼 ────────────────────────────────────
  // 세은(잘함) id=16
  16: [
    { id: 2601, content: "복합 인덱스 선두 컬럼 없이 Range Scan 안 된다는 거 완벽히 이해했네!", author_id: 1, author_name: "수철", created_at: "2026-06-12T10:30:00Z", is_mine: false },
    { id: 2602, content: "선두 컬럼 조건 없으면 Index Full Scan이나 Table Full Scan으로 빠져. 인덱스 설계할 때 이게 핵심이야!", author_id: 0, author_name: "세은", created_at: "2026-06-12T10:50:00Z", is_mine: true },
  ],
  // 수철(애매) id=17
  17: [
    { id: 2701, content: "선두 컬럼 없이도 인덱스 사용된다고 생각한 게 함정이었어. 이제 제대로 이해함!", author_id: 1, author_name: "수철", created_at: "2026-06-12T10:32:00Z", is_mine: false },
    { id: 2702, content: "Index Skip Scan이라는 예외도 있어. 선두 컬럼 유니크 값이 적으면 스킵 스캔 가능!", author_id: 0, author_name: "세은", created_at: "2026-06-12T10:52:00Z", is_mine: true },
    { id: 2703, content: "오 그런 예외가 있구나. 시험에 나올 수도 있겠다.", author_id: 1, author_name: "수철", created_at: "2026-06-12T11:10:00Z", is_mine: false },
  ],
  // ── s3-p3: Bind Variable / 하드파싱 / 소프트파싱 ──────────────────────
  // 세은(잘함) id=20
  20: [
    { id: 3001, content: "바인드 변수 없이 리터럴로 쓰면 매번 하드파싱 → 라이브러리 캐시 공유 불가.", author_id: 0, author_name: "세은", created_at: "2026-06-12T10:35:00Z", is_mine: true },
    { id: 3002, content: "그래서 Spring/MyBatis 같은 프레임워크가 PreparedStatement로 바인드 변수 쓰는 거구나!", author_id: 1, author_name: "수철", created_at: "2026-06-12T10:55:00Z", is_mine: false },
  ],
  // 수철(애매) id=21
  21: [
    { id: 3101, content: "하드파싱 발생 조건 정리: ①SQL 최초 실행 ②바인드 변수 없이 리터럴 사용 ③오브젝트 변경 후 자동 무효화.", author_id: 0, author_name: "세은", created_at: "2026-06-12T10:36:00Z", is_mine: true },
    { id: 3102, content: "소프트파싱은 이미 캐시된 실행계획 재사용 - CPU 절약!", author_id: 1, author_name: "수철", created_at: "2026-06-12T11:00:00Z", is_mine: false },
    { id: 3103, content: "이 부분 추가 학습 필요할 것 같아. 실습으로 확인해볼게.", author_id: 1, author_name: "수철", created_at: "2026-06-12T11:20:00Z", is_mine: false },
  ],
};
