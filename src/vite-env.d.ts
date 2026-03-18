/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_LOGS_ENABLED?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
