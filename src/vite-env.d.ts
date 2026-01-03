/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROUP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
