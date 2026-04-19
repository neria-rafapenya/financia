const fallbackApiBaseUrl = "http://localhost:3000/api";
export const env = {
    appName: import.meta.env.VITE_APP_NAME ?? "FINANCIA",
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl,
    defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE ?? "es",
};
