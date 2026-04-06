/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_NGSPICE_API_URL?: string;
  readonly VITE_DIGITAL_SIM_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
