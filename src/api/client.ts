/**
 * 공통 HTTP API 클라이언트.
 *
 * 백엔드(Django REST) 호출의 기반이 되는 얇은 fetch 래퍼다.
 * - baseURL은 환경변수(VITE_API_BASE_URL)로 관리한다.
 * - JSON 요청/응답을 기본 처리한다.
 * - access token이 있으면 Authorization: Bearer {token} 헤더를 자동으로 붙인다.
 * - 실패는 모두 ApiError로 변환해 throw한다.
 *
 * refresh token 재발급 로직은 [102] JWT 토큰 관리 작업에서 추가한다.
 * 여기서는 request() 한 곳에서 응답을 가로챌 수 있는 구조까지만 준비한다.
 *
 * 사용 예시:
 *   import { apiClient } from "@/api";
 *   const sessions = await apiClient.get<SessionSummary[]>("/api/sessions/");
 *   const result = await apiClient.post("/api/analysis/validate/", payload);
 *   await apiClient.post("/api/auth/login/", { email, password }, { skipAuth: true });
 */

import { getAccessToken } from "./tokens";
import {
  toApiError,
  toApiErrorFromNetwork,
  toApiErrorFromParse,
  toApiErrorFromResponse,
} from "./errors";
import type { HttpMethod, RequestOptions } from "./types";

/**
 * API 서버 base URL.
 * 개발 편의를 위해 환경변수가 없으면 로컬 서버를 기본값으로 쓰되,
 * production 빌드에서 누락되면 (브라우저가 자기 localhost를 호출하는) 장애로 이어지므로 경고한다.
 */
function resolveBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv) return fromEnv;

  if (import.meta.env.PROD) {
    console.error(
      "[api] VITE_API_BASE_URL이 설정되지 않았습니다. production 빌드에서는 반드시 지정해야 합니다.",
    );
  }
  return "http://localhost:8000";
}

export const API_BASE_URL: string = resolveBaseUrl();

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  // baseURL 끝의 "/"와 path 시작의 "/"가 겹치지 않게 정리한다.
  const base = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // path에 이미 query string이 있을 수 있으므로 URL 객체로 안전하게 병합한다.
  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.append(key, String(value));
    }
  }

  return url.toString();
}

function buildHeaders(options: RequestOptions, hasBody: boolean): Headers {
  const headers = new Headers();

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  // 인증 헤더 주입 (skipAuth가 아니고 토큰이 있을 때만).
  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value);
    }
  }

  return headers;
}

/**
 * 응답 body를 파싱한다. JSON이면 객체로, 본문이 없으면 null로 반환한다.
 * @param strict true(성공 응답)면 JSON 파싱 실패 시 throw하고, false(에러 응답)면 원문 text로 폴백한다.
 */
async function parseBody(response: Response, strict: boolean): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (error) {
      // 성공 응답인데 JSON이 깨졌다면 호출부가 T로 신뢰할 수 없으므로 에러로 변환한다.
      if (strict) throw toApiErrorFromParse(response.status, error);
      // 에러 응답이면 envelope 파싱 실패여도 상태 코드 기반 처리를 위해 원문을 넘긴다.
      return text;
    }
  }

  return text;
}

/**
 * 모든 요청이 거쳐가는 단일 진입점.
 * 이후 토큰 재발급/재시도 로직은 이 함수에서 확장한다.
 */
async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const hasBody = body !== undefined && method !== "GET";
  const url = buildUrl(path, options.query);
  const headers = buildHeaders(options, hasBody);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    // 네트워크 단절, CORS, 요청 취소 등.
    throw toApiErrorFromNetwork(error);
  }

  if (!response.ok) {
    const errorBody = await parseBody(response, false);
    throw toApiErrorFromResponse(response.status, errorBody);
  }

  return (await parseBody(response, true)) as T;
}

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, options);
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, body, options);
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, body, options);
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PATCH", path, body, options);
  },
  del<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, options);
  },
};

// 임의의 에러를 화면에서 쓰기 좋은 ApiError로 정규화할 때 사용한다.
export { toApiError };
