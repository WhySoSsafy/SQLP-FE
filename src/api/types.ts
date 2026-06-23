/**
 * API 공통 타입.
 *
 * 백엔드(Django)는 모든 에러를 아래와 같은 공통 envelope로 내려준다.
 *   { "ok": false, "code": "VALIDATION_ERROR", "message": "...", "errors": [{ "path": "$.problems[0]", "message": "..." }] }
 * 성공 응답의 형태는 엔드포인트마다 다르므로 각 호출부에서 제네릭으로 지정한다.
 */

/** 백엔드 에러 envelope 내부의 개별 필드 에러 */
export interface ApiFieldError {
  /** 오류 위치 (예: "$.problems[0].subject_area") */
  path: string;
  message: string;
}

/** 백엔드 에러 응답 envelope */
export interface ApiErrorEnvelope {
  ok: false;
  /** 에러 코드 (예: VALIDATION_ERROR, DUPLICATE_SESSION, NOT_FOUND ...) */
  code: string;
  message: string;
  errors?: ApiFieldError[];
}

/** 인증 사용자 정보 (로그인 응답 / GET /api/users/me/) */
export interface User {
  id: number;
  name: string;
  email: string;
}

/** 로그인 요청 (백엔드는 email/password로 인증한다) */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 로그인 응답.
 * user는 백엔드 응답에 포함될 때만 존재하므로 optional로 둔다.
 */
export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}

/** 회원가입 요청 (백엔드는 name/email/password를 받는다. password는 8자 이상) */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * 회원가입 응답.
 * 백엔드는 토큰을 발급하지 않고 생성된 user 정보만 반환한다.
 */
export interface RegisterResponse {
  ok: boolean;
  user: User;
}

/** HTTP 메서드 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** 공통 요청 옵션 */
export interface RequestOptions {
  /** 쿼리 파라미터. undefined/null 값은 자동으로 제외된다. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** 추가 헤더 */
  headers?: Record<string, string>;
  /** true면 Authorization 헤더를 붙이지 않는다. (로그인/회원가입 등) */
  skipAuth?: boolean;
  /** 요청 취소용 signal */
  signal?: AbortSignal;
}
