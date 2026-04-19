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
