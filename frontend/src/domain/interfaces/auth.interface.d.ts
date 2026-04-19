import type { User } from "./user.interface";
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
    tokenType: "Bearer";
}
export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
}
export interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
}
export interface AuthContextValue extends AuthState {
    login: (payload: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}
