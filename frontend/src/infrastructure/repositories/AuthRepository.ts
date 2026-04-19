import type {
  AuthResponse,
  LoginRequest,
} from "@/domain/interfaces/auth.interface";
import type {
  ChangePasswordInput,
  UpdateCurrentUserInput,
  User,
} from "@/domain/interfaces/user.interface";
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

  updateCurrentUser(payload: UpdateCurrentUserInput) {
    return fetchWithAuth<AuthMeResponse>("/users/me", {
      method: "PATCH",
      body: payload,
    }).then((response) => response.user);
  }

  changePassword(payload: ChangePasswordInput) {
    return fetchWithAuth<{ success: boolean }>("/users/me/password", {
      method: "PATCH",
      body: payload,
    });
  }
}
