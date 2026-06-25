/**
 * 참여자 코멘트 관련 API 호출.
 *
 * 참여자(participant)별 코멘트 목록 조회/등록, 개별 코멘트 삭제 엔드포인트를 제공한다.
 */

import { apiClient } from "./client";
import { PARTICIPANT_COMMENTS_ENDPOINT, COMMENT_DETAIL_ENDPOINT } from "./endpoints";
import type { Comment } from "@/domain/types";

/**
 * 특정 참여자의 코멘트 목록을 조회한다. (인증 필요)
 *
 * @param participantId 참여자 id
 */
export function fetchComments(participantId: number): Promise<Comment[]> {
  return apiClient.get<Comment[]>(PARTICIPANT_COMMENTS_ENDPOINT(participantId));
}

/**
 * 특정 참여자에 코멘트를 등록한다. (인증 필요)
 *
 * @param participantId 참여자 id
 * @param content 코멘트 내용
 */
export function createComment(participantId: number, content: string): Promise<Comment> {
  return apiClient.post<Comment>(PARTICIPANT_COMMENTS_ENDPOINT(participantId), { content });
}

/**
 * 코멘트를 삭제한다. (인증 필요)
 *
 * @param commentId 코멘트 id
 */
export function deleteComment(commentId: number): Promise<{ ok: boolean }> {
  return apiClient.del<{ ok: boolean }>(COMMENT_DETAIL_ENDPOINT(commentId));
}
