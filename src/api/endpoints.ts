/**
 * 백엔드 API 엔드포인트 경로 상수.
 *
 * 백엔드 명세가 아직 확정 전이라 경로가 바뀔 수 있다.
 * 다른 코드는 경로 문자열을 직접 쓰지 말고 반드시 아래 상수를 사용한다.
 * 명세 변경 시 이 파일만 고치면 된다.
 *
 * TODO(backend): 백엔드 최종 명세 확정 시 경로를 재확인/수정한다.
 *   - 현재 값은 SQLP-BE/accounts/urls.py 기준이다.
 */

/** 로그인. POST → { access, refresh, user? } */
export const LOGIN_ENDPOINT = "/api/auth/login/";

/** 회원가입. POST { name, email, password } → { ok, user } (토큰 미발급) */
export const REGISTER_ENDPOINT = "/api/auth/register/";

/** access 토큰 재발급. POST { refresh } → { access } (SimpleJWT TokenRefreshView) */
export const REFRESH_ENDPOINT = "/api/auth/refresh/";

/** 내 정보 조회. GET → User */
export const ME_ENDPOINT = "/api/users/me/";
