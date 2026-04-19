export const authFilePath = "tests/e2e/.auth/user.json";
export const authUserStorageKey = "financia.auth.user";
const defaultEmail = "rafa@rafapenya.com";
const defaultPassword = "JRK441e22";
export function getCredentials() {
    return {
        email: process.env.PLAYWRIGHT_E2E_EMAIL ?? defaultEmail,
        password: process.env.PLAYWRIGHT_E2E_PASSWORD ?? defaultPassword,
    };
}
export function getAppBaseUrl() {
    return process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
}
export function getApiBaseUrl() {
    return process.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
}
