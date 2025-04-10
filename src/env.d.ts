/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_API_URL: string
  readonly VITE_AI_API_KEY: string
  readonly VITE_AI_API_SECRET: string
  readonly VITE_AI_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}