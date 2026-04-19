import type {
  AuthTokens,
  LoginRequest,
} from "@/domain/interfaces/auth.interface";
import type {
  ChangePasswordInput,
  UpdateCurrentUserInput,
  User,
} from "@/domain/interfaces/user.interface";
import { AuthRepository } from "@/infrastructure/repositories/AuthRepository";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/shared/config/auth";
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "@/shared/storage/localStorage";
import { getCookie, removeCookie, setCookie } from "@/shared/utils/cookies";
import { isTokenExpired } from "@/shared/utils/jwt";

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login(payload: LoginRequest) {
    const response = await this.repository.login(payload);
    this.persistSession(response.user, response.tokens);
    return response;
  }

  async logout() {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      try {
        await this.repository.logout(refreshToken);
      } catch {
        // noop
      }
    }

    this.clearSession();
  }

  async fetchCurrentUser() {
    const user = await this.repository.getCurrentUser();
    setStoredUser(user);
    return user;
  }

  async updateCurrentUser(payload: UpdateCurrentUserInput) {
    const user = await this.repository.updateCurrentUser(payload);
    setStoredUser(user);
    return user;
  }

  async changePassword(payload: ChangePasswordInput) {
    return this.repository.changePassword(payload);
  }

  hydrateSession() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const user = getStoredUser();

    if (!accessToken || !refreshToken || isTokenExpired(accessToken)) {
      this.clearSession();
      return null;
    }

    if (!user) {
      return {
        user: null,
        tokens: this.buildTokens(accessToken, refreshToken),
      };
    }

    return {
      user,
      tokens: this.buildTokens(accessToken, refreshToken),
    };
  }

  clearSession() {
    removeCookie(ACCESS_TOKEN_COOKIE);
    removeCookie(REFRESH_TOKEN_COOKIE);
    clearStoredUser();
  }

  private persistSession(user: User, tokens: AuthTokens) {
    setCookie(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      tokens.accessTokenExpiresIn,
    );
    setCookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      tokens.refreshTokenExpiresIn,
    );
    setStoredUser(user);
  }

  private buildTokens(accessToken: string, refreshToken: string): AuthTokens {
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: 0,
      refreshTokenExpiresIn: 0,
      tokenType: "Bearer",
    };
  }

  private getAccessToken() {
    const token = getCookie(ACCESS_TOKEN_COOKIE);
    return token ? decodeURIComponent(token) : null;
  }

  private getRefreshToken() {
    const token = getCookie(REFRESH_TOKEN_COOKIE);
    return token ? decodeURIComponent(token) : null;
  }
}
