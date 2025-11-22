/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_QUOTE?: string;
  readonly VITE_APP_TEST_MODE?: string;
  readonly VITE_API_SECRET_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
