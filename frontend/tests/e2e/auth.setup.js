import { expect, test as setup } from "@playwright/test";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, } from "../../src/shared/config/auth";
import { authFilePath, authUserStorageKey, getApiBaseUrl, getAppBaseUrl, getCredentials, } from "./utils/auth";
setup("authenticate for private routes", async ({ browser, request }) => {
    const loginResponse = await request.post(`${getApiBaseUrl()}/auth/login`, {
        data: getCredentials(),
    });
    expect(loginResponse.ok()).toBeTruthy();
    const authResponse = (await loginResponse.json());
    const context = await browser.newContext();
    await context.addCookies([
        {
            name: ACCESS_TOKEN_COOKIE,
            value: authResponse.tokens.accessToken,
            url: getAppBaseUrl(),
            sameSite: "Lax",
        },
        {
            name: REFRESH_TOKEN_COOKIE,
            value: authResponse.tokens.refreshToken,
            url: getAppBaseUrl(),
            sameSite: "Lax",
        },
    ]);
    const page = await context.newPage();
    await page.addInitScript(({ storageKey, user }) => {
        globalThis.localStorage.setItem(storageKey, JSON.stringify(user));
    }, {
        storageKey: authUserStorageKey,
        user: authResponse.user,
    });
    await page.goto(`${getAppBaseUrl()}/documents`);
    await expect(page).toHaveURL(/\/documents$/, { timeout: 15_000 });
    await context.storageState({ path: authFilePath });
    await context.close();
});
