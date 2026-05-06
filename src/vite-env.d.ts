/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
  /**
   * "true" 일 때 프로덕션 빌드에도 `/dev/*` 라우트를 포함시킨다 (스테이징/프리뷰용).
   * 미설정 또는 "false" 면 dev 모드(`import.meta.env.DEV`)에서만 활성.
   */
  readonly VITE_ENABLE_DEV_ROUTES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
