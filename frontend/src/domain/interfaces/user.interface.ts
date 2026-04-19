export interface User {
  id: number;
  email: string;
  fullName: string;
  taxId: string | null;
  hasValidTaxId: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCurrentUserInput {
  fullName?: string;
  taxId?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
