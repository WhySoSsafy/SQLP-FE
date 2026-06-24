/**
 * 학습 세션 관련 API 호출.
 *
 * 학습 세션(AI 분석 결과 JSON) 목록 조회와 등록 엔드포인트 호출을 한곳에 모은다.
 * 데이터 계층(domain/storage.ts)은 이 함수를 호출만 하고,
 * HTTP·엔드포인트 경로·응답 타입은 api 계층이 책임진다. (auth.ts와 같은 패턴)
 */

import { apiClient } from "./client";
import { SESSIONS_ENDPOINT } from "./endpoints";
import type { LearningSession, Understanding } from "@/domain/types";

// BE → FE 이해도 값 변환 (BE: "이해"/"애매"/"모름", FE: "잘함"/"애매"/"모름")
function mapUnderstanding(val: string): Understanding {
  if (val === "이해") return "잘함";
  if (val === "애매") return "애매";
  return "모름";
}

/**
 * 내 학습 세션 전체 목록을 조회한다. (인증 필요)
 * 실패 시 ApiError를 throw하며, 폴백 처리는 호출부가 담당한다.
 * BE 리스트 엔드포인트는 problems 필드를 포함하지 않으므로 빈 배열로 초기화한다.
 */
export async function fetchSessions(): Promise<LearningSession[]> {
  const raw = await apiClient.get<any[]>(SESSIONS_ENDPOINT);
  return raw.map((item) => ({
    id: item.id,
    session_date: item.session_date ?? "",
    book: item.book ?? "",
    speakers: item.speakers ?? [],
    problems: item.problems ?? [],
    created_at: item.created_at ?? "",
  }));
}

/** 특정 세션의 문제 포함 전체 상세 데이터를 조회한다. */
export async function fetchSessionDetail(id: string): Promise<LearningSession> {
  const item = await apiClient.get<any>(`${SESSIONS_ENDPOINT}${id}/`);
  return {
    id: item.id,
    session_date: item.session_date ?? "",
    book: item.book ?? "",
    speakers: item.speakers ?? [],
    created_at: item.created_at ?? "",
    problems: (item.problems ?? []).map((p: any) => ({
      id: p.id ?? String(p.problem_number),
      problem_number: p.problem_number,
      subject_area: p.subject_area ?? "",
      concepts: p.concepts ?? [],
      solution_summary: p.solution_summary ?? "",
      participants: (p.participants ?? []).map((pt: any) => ({
        name: pt.name,
        is_correct: pt.is_correct,
        understanding: mapUnderstanding(pt.understanding),
        concepts_covered: pt.concepts_covered ?? [],
        concepts_missed: pt.concepts_missed ?? [],
        errors: pt.errors ?? [],
        review_required: pt.review_required ?? false,
      })),
    })),
  };
}

/**
 * 검증을 마친 학습 세션을 등록한다. (인증 필요)
 * 중복 세션 등 검증 실패 시 백엔드가 ApiError(code: DUPLICATE_SESSION 등)를 내려준다.
 *
 * TODO(backend): 등록 응답 본문이 생성된 세션 전체(서버 발급 id 포함)인지 확정되면 타입을 재확인한다.
 */
export function createSession(session: LearningSession): Promise<LearningSession> {
  return apiClient.post<LearningSession>(SESSIONS_ENDPOINT, session);
}
