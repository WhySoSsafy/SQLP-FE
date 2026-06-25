/**
 * 이해도(understanding) 값 통일 유틸. ([113])
 *
 * 이 프로젝트의 이해도 choices(백엔드 저장/검증 계약)는 "잘함" | "애매" | "모름"이다.
 *   - 설계 문서: "이해도 값: 잘함, 애매, 모름"
 *   - domain/types.ts `UNDERSTANDING_VALUES`, domain/validation.ts, mockup-data/*.json 모두 동일
 *   - 즉 화면 표시 label == API 전송 value == 잘함/애매/모름 (별도 변환 테이블 불필요)
 *
 * 다만 사용자가 붙여넣는 분석 JSON에는 영어(low/medium/high)·숫자·낮음/보통/높음 등
 * 변형 값이 올 수 있으므로, validate / 세션 POST로 보내기 전에 표준 choices로 normalize 한다.
 */

import type { Understanding } from "./types";

/**
 * 임의의 이해도 입력을 표준 choices(잘함/애매/모름)로 변환한다.
 * 인식 가능한 변형만 매핑하고, 알 수 없는 값은 null을 반환한다. (억지 변환 금지)
 */
export function normalizeUnderstandingValue(input: unknown): Understanding | null {
  if (typeof input === "number") {
    if (input === 3) return "잘함";
    if (input === 2) return "애매";
    if (input === 1 || input === 0) return "모름";
    return null; // 0~100 점수형 등은 임의로 단정하지 않는다.
  }
  if (typeof input !== "string") return null;

  switch (input.trim().toLowerCase()) {
    case "잘함":
    case "이해":
    case "이해함":
    case "understand":
    case "understood":
    case "good":
    case "high":
    case "높음":
    case "상":
    case "3":
      return "잘함";
    case "애매":
    case "vague":
    case "medium":
    case "mid":
    case "보통":
    case "중":
    case "2":
      return "애매";
    case "모름":
    case "unknown":
    case "none":
    case "low":
    case "낮음":
    case "하":
    case "1":
    case "0":
      return "모름";
    default:
      return null;
  }
}

/**
 * 화면 표시용 한글 label.
 * 이미 표준값이거나 변형값이면 표준 label로, 표준화 불가하면 원본 문자열(없으면 "-")을 반환한다.
 * (현재 API는 표준값을 내려주므로 사실상 그대로 표시되며, 영어/변형 값이 와도 방어적으로 한글 표시)
 */
export function understandingLabel(value: unknown): string {
  const normalized = normalizeUnderstandingValue(value);
  if (normalized) return normalized;
  return typeof value === "string" && value.trim().length > 0 ? value : "-";
}

/**
 * 이해도 배지/태그 색상 톤. 세 값(잘함/애매/모름)이 항상 서로 다른 색을 갖도록 한다.
 * - 잘함(이해) → 초록, 애매 → 주황, 모름 → 빨강
 * 변형 값("이해" 등)도 normalize를 거치므로 모름과 같은 색으로 빠지지 않는다.
 * 표준화 불가한 값은 회색(중립)으로 표시해 빨강(모름)과 섞이지 않게 한다.
 */
export interface UnderstandingTone {
  bg: string;
  color: string;
}

export function understandingTone(value: unknown): UnderstandingTone {
  switch (normalizeUnderstandingValue(value)) {
    case "잘함":
      return { bg: "#DCFCE7", color: "#15803D" }; // green
    case "애매":
      return { bg: "#FFEDD5", color: "#C2410C" }; // orange
    case "모름":
      return { bg: "#FEE2E2", color: "#B91C1C" }; // red
    default:
      return { bg: "#F3F4F6", color: "#6B7280" }; // neutral gray
  }
}

/**
 * 분석 JSON(파싱된 객체)의 problems[].participants[].understanding 값을 표준 choices로 normalize 한다.
 * (`/api/analysis/validate/` 검증과 `/api/sessions/` 저장 payload에 표준값이 들어가도록 전송 전 사용)
 *
 * 구조가 예상과 다르면 원본을 그대로 두고, 인식 가능한 understanding 값만 표준화한다. (방어적)
 */
export function normalizeAnalysisUnderstanding(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const root = input as Record<string, unknown>;
  if (!Array.isArray(root.problems)) return input;

  return {
    ...root,
    problems: root.problems.map((problem) => {
      if (!problem || typeof problem !== "object") return problem;
      const prob = problem as Record<string, unknown>;
      if (!Array.isArray(prob.participants)) return problem;

      return {
        ...prob,
        participants: prob.participants.map((participant) => {
          if (!participant || typeof participant !== "object") return participant;
          const part = participant as Record<string, unknown>;
          if (!("understanding" in part)) return participant;
          const normalized = normalizeUnderstandingValue(part.understanding);
          return normalized ? { ...part, understanding: normalized } : participant;
        }),
      };
    }),
  };
}
