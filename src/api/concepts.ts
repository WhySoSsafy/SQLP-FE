/**
 * 개념 상세/요약 API 호출.
 *
 * SQLP 교재 PDF를 AI가 개념 단위로 정리한 JSON을 백엔드가 저장/관리하고,
 * 프론트는 이 모듈을 통해 특정 개념 요약 데이터를 받아온다.
 * 화면(view)은 이 함수를 호출만 하고, HTTP·엔드포인트 경로·응답 타입은
 * api 계층이 책임진다. (sessions.ts / analytics.ts / calendar.ts와 같은 패턴)
 */

import { apiClient } from "./client";
import { CONCEPT_DETAIL_ENDPOINT, CONCEPT_CREATE_ENDPOINT } from "./endpoints";
import type { ConceptDetail } from "@/domain/types";

/**
 * 특정 개념의 상세/요약 데이터를 조회한다. (인증 필요)
 * 실패 시 ApiError를 throw하며, 폴백 처리는 호출부가 담당한다.
 *
 * @param id 개념 id (route param)
 */
export function fetchConceptDetail(id: string | number): Promise<ConceptDetail> {
  return apiClient.get<ConceptDetail>(CONCEPT_DETAIL_ENDPOINT(id));
}

/**
 * 새 개념을 등록한다. (인증 필요)
 * 백엔드는 camelCase 키를 그대로 수락하며 추가 키는 무시한다.
 *
 * @param payload 개념 생성 요청 객체 (name/title, subject?, summary?, 등)
 */
export function createConcept(payload: unknown): Promise<unknown> {
  return apiClient.post(CONCEPT_CREATE_ENDPOINT, payload);
}
