import type {
  AuthResponse,
  LoginRequest,
} from "@/domain/interfaces/auth.interface";
import type { User } from "@/domain/interfaces/user.interface";
import { fetchWithAuth, fetchWithoutAuth } from "@/shared/api/api";

interface AuthMeResponse {
  user: User;
}

export class AuthRepository {
  login(payload: LoginRequest) {
    return fetchWithoutAuth<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  }

  logout(refreshToken: string) {
    return fetchWithAuth<{ success: boolean }>("/auth/logout", {
      method: "POST",
      body: { refreshToken },
    });
  }

  getCurrentUser() {
    return fetchWithAuth<AuthMeResponse>("/auth/me").then(
      (response) => response.user,
    );
  }
}
