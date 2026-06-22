/**
 * API 에러 처리.
 *
 * 네트워크 오류, 백엔드 에러 envelope, JSON 파싱 실패 등 모든 실패를
 * 화면에서 다루기 쉬운 단일 ApiError 형태로 변환한다.
 */

import type { ApiErrorEnvelope, ApiFieldError } from "./types";

export class ApiError extends Error {
  /** HTTP 상태 코드. 네트워크 오류 등 응답이 없으면 0. */
  readonly status: number;
  /** 백엔드 에러 코드 (예: VALIDATION_ERROR). 없으면 "UNKNOWN". */
  readonly code: string;
  /** 백엔드가 내려준 필드별 검증 에러 목록. */
  readonly fieldErrors: ApiFieldError[];
  /** 원본 에러 객체 (디버깅/로깅용). */
  readonly original: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    fieldErrors?: ApiFieldError[];
    original?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors ?? [];
    this.original = params.original;
  }

  /** 인증 실패(401) 여부 — 토큰 만료/재발급 분기에서 사용. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

/** 응답 body가 백엔드 에러 envelope 형태인지 검사한다. */
function isErrorEnvelope(body: unknown): body is ApiErrorEnvelope {
  if (typeof body !== "object" || body === null) return false;

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.code !== "string") return false;
  if (typeof candidate.message !== "string") return false;
  // errors는 선택 필드지만, 존재한다면 배열이어야 한다.
  if (candidate.errors !== undefined && !Array.isArray(candidate.errors)) {
    return false;
  }

  return true;
}

/**
 * HTTP 에러 응답을 ApiError로 변환한다.
 * 백엔드 envelope이면 code/message/errors를 추출하고, 아니면 상태 코드 기반 기본 메시지를 사용한다.
 */
export function toApiErrorFromResponse(status: number, body: unknown): ApiError {
  if (isErrorEnvelope(body)) {
    return new ApiError({
      status,
      code: body.code,
      message: body.message,
      fieldErrors: body.errors,
      original: body,
    });
  }

  return new ApiError({
    status,
    code: "HTTP_ERROR",
    message: `요청을 처리하지 못했습니다. (HTTP ${status})`,
    original: body,
  });
}

/**
 * 네트워크 오류 등 응답 자체를 받지 못한 경우를 ApiError로 변환한다.
 * 요청 취소(AbortError)는 서버 연결 실패와 성격이 다르므로 별도 코드로 구분한다.
 */
export function toApiErrorFromNetwork(error: unknown): ApiError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError({
      status: 0,
      code: "ABORTED",
      message: "요청이 취소되었습니다.",
      original: error,
    });
  }

  return new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: "서버에 연결하지 못했습니다. 네트워크 상태를 확인해주세요.",
    original: error,
  });
}

/** 응답 본문을 기대한 형식(JSON)으로 해석하지 못한 경우. */
export function toApiErrorFromParse(status: number, error: unknown): ApiError {
  return new ApiError({
    status,
    code: "PARSE_ERROR",
    message: "서버 응답을 해석하지 못했습니다.",
    original: error,
  });
}

/** 임의의 에러를 ApiError로 정규화한다. (이미 ApiError면 그대로 반환) */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return toApiErrorFromNetwork(error);
}
