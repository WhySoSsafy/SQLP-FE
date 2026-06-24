/**
 * 개념 요약 JSON 정규화. ([112] 개념 요약 페이지 / [114] JSON 업로드 공용)
 *
 * 백엔드 응답이나 AI가 생성한 개념 JSON의 필드명이 화면 표준 타입(ConceptDetail)과
 * 다를 수 있어( 예: title↔name, sqlExamples↔examples, mistakePoints↔commonMistakes,
 * memoryPoints↔memorizationPoints, 예시 explanation↔description, 관련개념 title↔name ),
 * 두 표기를 모두 받아 ConceptDetail로 방어적으로 변환한다.
 *
 * 알 수 없는/빈 값은 제외하고, 없는 필드는 undefined로 둔다. (화면에서 섹션 자체를 숨김)
 */

import type { ConceptDetail, ConceptExample, RelatedConcept } from "./types";

const str = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const pickStr = (...values: unknown[]): string | undefined => {
  for (const v of values) {
    const s = str(v);
    if (s) return s;
  }
  return undefined;
};

const strArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const list = value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return list.length ? list : undefined;
};

const pickId = (value: unknown): string | number | undefined =>
  typeof value === "string" || typeof value === "number" ? value : undefined;

function normalizeExamples(...candidates: unknown[]): ConceptExample[] | undefined {
  const raw = candidates.find((c) => Array.isArray(c));
  if (!Array.isArray(raw)) return undefined;
  const list = raw
    .map((item): ConceptExample | null => {
      if (typeof item === "string") return str(item) ? { code: item } : null;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const ex: ConceptExample = {
          title: str(o.title),
          code: str(o.code),
          description: pickStr(o.description, o.explanation),
        };
        return ex.title || ex.code || ex.description ? ex : null;
      }
      return null;
    })
    .filter((x): x is ConceptExample => x !== null);
  return list.length ? list : undefined;
}

function normalizeRelated(value: unknown): RelatedConcept[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .map((item): RelatedConcept | null => {
      if (typeof item === "string") return str(item) ? { name: item } : null;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const name = pickStr(o.name, o.title);
        if (!name) return null;
        return { id: pickId(o.id), name };
      }
      return null;
    })
    .filter((x): x is RelatedConcept => x !== null);
  return list.length ? list : undefined;
}

/** 임의의 개념 JSON(파싱된 객체/응답)을 화면 표준 ConceptDetail로 정규화한다. */
export function normalizeConceptJson(input: unknown): ConceptDetail {
  if (!input || typeof input !== "object") return {};
  const o = input as Record<string, unknown>;

  return {
    id: pickId(o.id),
    name: pickStr(o.name, o.title),
    subject: str(o.subject),
    chapter: str(o.chapter),
    section: str(o.section),
    summary: str(o.summary),
    easyExplanation: pickStr(o.easyExplanation, o.easy_explanation),
    keywords: strArray(o.keywords),
    examples: normalizeExamples(o.examples, o.sqlExamples),
    commonMistakes: strArray(o.commonMistakes) ?? strArray(o.mistakePoints),
    memorizationPoints: strArray(o.memorizationPoints) ?? strArray(o.memoryPoints),
    relatedConcepts: normalizeRelated(o.relatedConcepts),
  };
}

/** 화면에 표시할 의미 있는 개념 데이터가 하나라도 있는지. */
export function hasConceptContent(concept: ConceptDetail): boolean {
  return !!(
    concept.name ||
    concept.summary ||
    concept.easyExplanation ||
    concept.keywords?.length ||
    concept.examples?.length ||
    concept.commonMistakes?.length ||
    concept.memorizationPoints?.length ||
    concept.relatedConcepts?.length
  );
}
