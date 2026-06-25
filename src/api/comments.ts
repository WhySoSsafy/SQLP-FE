/**
 * 참여자 코멘트 관련 API 호출.
 *
 * [test/mock-mode] 백엔드 없이 in-memory 스토어로 동작한다.
 * MOCK_COMMENTS_INIT으로 초기 댓글을 채워두고, 작성/삭제는 스토어에 반영된다.
 * 새로고침하면 초기 상태로 돌아온다.
 *
 * 목 현재 사용자: 세은 (author_id: 0) — is_mine: true 로 표시된다.
 */

import type { Comment } from "@/domain/types";
import { MOCK_COMMENTS_INIT } from "@/mocks/data";

const MOCK_AUTHOR_ID = 0;
const MOCK_AUTHOR_NAME = "세은";

// 초기 댓글 데이터를 복사해 뮤터블 스토어 생성 (배열도 shallow copy해 공유 참조 방지)
const _store: Record<number, Comment[]> = {};
for (const [k, v] of Object.entries(MOCK_COMMENTS_INIT)) {
  _store[Number(k)] = [...v];
}

let _nextCommentId = 9000;

export function fetchComments(participantId: number): Promise<Comment[]> {
  return Promise.resolve([...(_store[participantId] ?? [])]);
}

export function createComment(participantId: number, content: string): Promise<Comment> {
  const newComment: Comment = {
    id: _nextCommentId++,
    content,
    author_id: MOCK_AUTHOR_ID,
    author_name: MOCK_AUTHOR_NAME,
    created_at: new Date().toISOString(),
    is_mine: true,
  };
  _store[participantId] = [...(_store[participantId] ?? []), newComment];
  return Promise.resolve(newComment);
}

export function deleteComment(commentId: number): Promise<{ ok: boolean }> {
  for (const pid of Object.keys(_store)) {
    const arr = _store[Number(pid)];
    const idx = arr.findIndex((c) => c.id === commentId);
    if (idx !== -1) {
      _store[Number(pid)] = arr.filter((c) => c.id !== commentId);
      break;
    }
  }
  return Promise.resolve({ ok: true });
}
