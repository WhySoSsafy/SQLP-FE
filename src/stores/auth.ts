import { defineStore } from "pinia";
import { ref } from "vue";
import {
  apiClient,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  LOGIN_ENDPOINT,
} from "@/api";
import type { LoginResponse, User } from "@/api";

/**
 * 인증 스토어.
 *
 * 핵심 책임은 access/refresh 토큰의 저장·삭제와 인증 상태 판단이다.
 * - 로그인 상태는 access 토큰 존재 여부로 판단한다(새로고침 시에도 토큰만 있으면 복원).
 * - user는 로그인 응답에 포함될 때만 보관하는 부가 정보다.
 *
 * 토큰 저장소(localStorage 등)는 api/tokens.ts가 캡슐화하므로 여기서는 직접 다루지 않는다.
 */
export const useAuthStore = defineStore("auth", () => {
  // 앤 시작 시 토큰이 남아있으면 로그인 상태로 복원한다.
  const isLoggedIn = ref(!!getAccessToken());

  // TODO(backend): 로그인 응답에 user가 없으면 null로 유지된다.
  //   추후 필요 시 GET /api/users/me/ 로 보강할 수 있다.
  const user = ref<User | null>(null);

  /**
   * 이메일/비밀번호로 로그인한다.
   * 성공 시 access/refresh 토큰을 저장하고 user(있으면)를 보관한다.
   * 실패 시 ApiError를 그대로 throw하므로 호출부에서 메시지를 처리한다.
   */
  async function login(email: string, password: string): Promise<void> {
    const result = await apiClient.post<LoginResponse>(
      LOGIN_ENDPOINT,
      { email, password },
      { skipAuth: true },
    );

    setAccessToken(result.access);
    setRefreshToken(result.refresh);
    // 응답에 user가 없으면 null 유지(위 TODO 참고).
    user.value = result.user ?? null;
    isLoggedIn.value = true;
  }

  /** 로그아웃. 토큰을 모두 비우고 인증 상태를 초기화한다. */
  function logout(): void {
    clearTokens();
    user.value = null;
    isLoggedIn.value = false;
  }

  return { isLoggedIn, user, login, logout };
});
