/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 API 서버 base URL (예: http://localhost:8000) */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
