const fallbackApiBaseUrl = "http://localhost:3000/api";

const metaEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }
).env;

export const env = {
  appName: metaEnv?.VITE_APP_NAME ?? "FINANCIA",
  apiBaseUrl: metaEnv?.VITE_API_BASE_URL ?? fallbackApiBaseUrl,
  defaultLocale: metaEnv?.VITE_DEFAULT_LOCALE ?? "es",
};
