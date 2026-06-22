import { defineStore } from "pinia";
import { ref } from "vue";

// 로그인 상태만 보관한다. 실제 토큰/인증 연동은 [102] JWT 토큰 관리에서
// 이 스토어를 확장한다(예: api/tokens.ts와 연결).
export const useAuthStore = defineStore("auth", () => {
  const isLoggedIn = ref(false);

  function login() {
    isLoggedIn.value = true;
  }

  function logout() {
    isLoggedIn.value = false;
  }

  return { isLoggedIn, login, logout };
});
