export interface AnnualTaxReturnEstimateBracket {
    lowerBound: number;
    upperBound: number | null;
    rate: number;
    taxableAmount: number;
    quota: number;
}
export interface AnnualTaxReturnEstimate {
    profile: {
        fullName: string;
        taxId: string | null;
        hasValidTaxId: boolean;
    };
    fiscalYear: number;
    simulationInput: {
        declarationMode: "INDIVIDUAL" | "JOINT";
        dependentChildrenCount: number;
        annualPensionContributionAmount: number;
        annualDonationAmount: number;
        annualHousingDeductionAmount: number;
        applyReviewableExpenses: boolean;
    };
    income: {
        employmentIncome: number;
        economicActivityIncome: number;
        totalIncome: number;
        irpfWithheld: number;
        socialSecurityAmount: number;
    };
    expenses: {
        deductibleAmount: number;
        reviewableAmount: number;
        nonDeductibleAmount: number;
        taxObligationsAmount: number;
        deductibleAmountUsed: number;
    };
    reductions: {
        socialSecurityAmount: number;
        pensionContributionReductionAmount: number;
        personalMinimumAmount: number;
        childrenMinimumAmount: number;
        declarationReductionAmount: number;
        totalPersonalAndFamilyMinimum: number;
    };
    credits: {
        donationDeductionAmount: number;
        housingDeductionAmount: number;
        totalCreditsAmount: number;
    };
    calculation: {
        preMinimumTaxableBase: number;
        grossQuota: number;
        estimatedTaxableBase: number;
        estimatedQuota: number;
        estimatedNetAfterTax: number;
        estimatedResult: number;
        resultType: "TO_PAY" | "TO_REFUND" | "BALANCED";
        brackets: AnnualTaxReturnEstimateBracket[];
    };
    sourceSummary: {
        incomeRecordCount: number;
        expenseRecordCount: number;
        taxObligationCount: number;
    };
    assumptions: string[];
}
export interface AnnualTaxReturnEstimateFilters {
    year: number;
    declarationMode?: "INDIVIDUAL" | "JOINT";
    dependentChildrenCount?: number;
    annualPensionContributionAmount?: number;
    annualDonationAmount?: number;
    annualHousingDeductionAmount?: number;
    applyReviewableExpenses?: boolean;
}
