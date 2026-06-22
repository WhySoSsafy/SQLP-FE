/**
 * 인증 토큰 저장소.
 *
 * 토큰 저장 방식은 아직 확정 전이라 임시로 localStorage를 사용한다.
 * 이후 [102] JWT 토큰 관리 작업에서 저장 위치/갱신 전략이 바뀔 수 있으므로,
 * 다른 코드는 localStorage 키를 직접 다루지 말고 반드시 아래 함수만 사용한다.
 */

const ACCESS_TOKEN_KEY = "sqlp_ai_coach.access_token.v1";
const REFRESH_TOKEN_KEY = "sqlp_ai_coach.refresh_token.v1";

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // 저장소 접근 실패는 치명적이지 않으므로 무시한다.
  }
}

export function getRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // 저장소 접근 실패는 치명적이지 않으므로 무시한다.
  }
}

/** access/refresh 토큰을 모두 제거한다. (로그아웃, 인증 만료 시 사용) */
export function clearTokens(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // 저장소 접근 실패는 치명적이지 않으므로 무시한다.
  }
}
