export interface Payer {
    id: number;
    userId: number;
    payerName: string;
    taxId: string | null;
    payerType: "EMPLOYER" | "CLIENT" | "PUBLIC_BODY" | "OTHER";
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface CreatePayerPayload {
    payerName: string;
    taxId?: string;
    payerType: Payer["payerType"];
    notes?: string;
}
