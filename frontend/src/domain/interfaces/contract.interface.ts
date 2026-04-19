export type ContractType =
  | "EMPLOYMENT"
  | "FREELANCE"
  | "RENTAL"
  | "INSURANCE"
  | "OTHER";

export type ContractWorkdayType = "FULL_TIME" | "PART_TIME" | "OTHER";

export type ContractStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "DRAFT";

export interface ContractRecord {
  id: number;
  userId: number;
  payerId: number | null;
  contractType: ContractType;
  title: string;
  startDate: string | null;
  endDate: string | null;
  grossSalaryMonthly: number | null;
  netSalaryMonthly: number | null;
  exclusivityFlag: boolean;
  nonCompeteFlag: boolean;
  workdayType: ContractWorkdayType | null;
  status: ContractStatus;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateContractInput {
  payerId?: number | null;
  contractType: ContractType;
  title: string;
  startDate?: string;
  endDate?: string;
  grossSalaryMonthly?: number | null;
  netSalaryMonthly?: number | null;
  exclusivityFlag?: boolean;
  nonCompeteFlag?: boolean;
  workdayType?: ContractWorkdayType | null;
  status?: ContractStatus;
  notes?: string;
}

export interface UpdateContractInput {
  payerId?: number | null;
  contractType?: ContractType;
  title?: string;
  startDate?: string | null;
  endDate?: string | null;
  grossSalaryMonthly?: number | null;
  netSalaryMonthly?: number | null;
  exclusivityFlag?: boolean;
  nonCompeteFlag?: boolean;
  workdayType?: ContractWorkdayType | null;
  status?: ContractStatus;
  notes?: string | null;
}
