/**
 * 인증 관련 API 호출.
 *
 * 로그인 등 인증 엔드포인트 호출을 한곳에 모은다.
 * store는 이 함수를 호출만 하고, HTTP·엔드포인트 경로·응답 타입은 api 계층이 책임진다.
 */

import { apiClient } from "./client";
import { LOGIN_ENDPOINT } from "./endpoints";
import type { LoginRequest, LoginResponse } from "./types";

/**
 * 이메일/비밀번호로 로그인한다. (인증 전 호출이므로 skipAuth)
 * 성공 시 access/refresh 토큰과 user(있으면)를 담은 응답을 반환하고,
 * 실패 시 ApiError를 throw한다. 토큰 저장은 호출부(auth store)가 담당한다.
 */
export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>(LOGIN_ENDPOINT, credentials, {
    skipAuth: true,
  });
}
