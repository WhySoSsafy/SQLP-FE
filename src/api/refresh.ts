/**
 * access 토큰 재발급(single-flight).
 *
 * access 토큰이 만료되면 여러 요청이 동시에 401을 받는다. 이때 refresh API를
 * 요청 수만큼 호출하면 안 되므로, 진행 중인 refresh Promise를 모듈 변수 하나로
 * 공유한다. 첫 호출만 실제 refresh를 띄우고 나머지는 같은 Promise를 await한다.
 *
 * refresh 호출 자체는 skipAuth로 보내 client.ts의 401 → 재발급 분기를 타지 않게 하여
 * 재귀(refresh가 또 refresh를 부르는) 호출을 막는다.
 *
 * 이 모듈은 router/Pinia store를 알지 못한다. 세션이 최종 만료되면
 * onAuthExpired 콜백으로 "만료 발생"만 알리고, 실제 logout/화면 이동은
 * main.ts에서 setOnAuthExpired로 연결한다.
 */

import { apiClient } from "./client";
import { ApiError } from "./errors";
import { REFRESH_ENDPOINT } from "./endpoints";
import { getRefreshToken, setAccessToken, clearTokens } from "./tokens";

/** 세션 만료 시 호출되는 콜백. 기본은 no-op이며 main.ts에서 주입한다. */
let onAuthExpired: () => void = () => {};

/**
 * 세션 만료 시 실행할 동작을 등록한다. (예: auth.logout() + router.push('login'))
 * API 계층의 router/store 직접 의존을 피하기 위한 결합 해제 지점이다.
 */
export function setOnAuthExpired(handler: () => void): void {
  onAuthExpired = handler;
}

/** 토큰을 비우고 "세션 만료"를 외부에 통지한다. */
function expireSession(): void {
  clearTokens();
  onAuthExpired();
}

/** 진행 중인 refresh 요청. 동시 401이 들어와도 이 Promise를 공유한다. */
let inFlight: Promise<string> | null = null;

/**
 * access 토큰을 재발급한다. 동시에 호출돼도 실제 refresh 요청은 한 번만 나간다.
 * 성공 시 새 access 토큰 문자열을 반환하고, 실패 시 세션을 만료시키고 throw한다.
 */
export function refreshAccessToken(): Promise<string> {
  if (inFlight) return inFlight;

  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    // refresh 토큰이 없으면 재발급 자체가 불가능 — 즉시 만료 처리(무한 루프 방지).
    expireSession();
    throw new ApiError({
      status: 401,
      code: "NO_REFRESH_TOKEN",
      message: "로그인이 필요합니다.",
    });
  }

  try {
    // skipAuth로 보내 401 재발급 분기를 타지 않게 한다(재귀 방지).
    const result = await apiClient.post<{ access: string }>(
      REFRESH_ENDPOINT,
      { refresh },
      { skipAuth: true },
    );
    setAccessToken(result.access);
    return result.access;
  } catch (error) {
    // refresh 토큰까지 만료/무효 → 더 이상 자동 복구 불가. 세션 만료 처리.
    expireSession();
    throw error;
  }
}
