import { Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import { parseStoredJson, toIsoDateTime } from '../../common/serializers';
import { ExpensesService } from '../expenses/expenses.service';
import { IncomesService } from '../incomes/incomes.service';
import { TaxService } from '../tax/tax.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { GetAnnualTaxReturnEstimateDto } from './dto/get-annual-tax-return-estimate.dto';

interface SimulationRow extends RowDataPacket {
  id: number;
  userId: number;
  title: string;
  simulationType: string;
  inputPayload: unknown;
  resultPayload: unknown;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface TaxBracketEstimate {
  lowerBound: number;
  upperBound: number | null;
  rate: number;
  taxableAmount: number;
  quota: number;
}

interface AnnualTaxReturnSimulationInput {
  declarationMode: 'INDIVIDUAL' | 'JOINT';
  dependentChildrenCount: number;
  annualPensionContributionAmount: number;
  annualDonationAmount: number;
  annualHousingDeductionAmount: number;
  applyReviewableExpenses: boolean;
}

export interface AnnualTaxReturnEstimate {
  profile: {
    fullName: string;
    taxId: string | null;
    hasValidTaxId: boolean;
  };
  fiscalYear: number;
  simulationInput: AnnualTaxReturnSimulationInput;
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
    resultType: 'TO_PAY' | 'TO_REFUND' | 'BALANCED';
    brackets: TaxBracketEstimate[];
  };
  sourceSummary: {
    incomeRecordCount: number;
    expenseRecordCount: number;
    taxObligationCount: number;
  };
  assumptions: string[];
}

@Injectable()
export class SimulationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly incomesService: IncomesService,
    private readonly expensesService: ExpensesService,
    private readonly taxService: TaxService,
  ) {}

  async list(userId: number) {
    const rows = await this.databaseService.query<SimulationRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          title,
          simulation_type AS simulationType,
          input_payload AS inputPayload,
          result_payload AS resultPayload,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_simulations
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [userId],
    );

    return rows.map((row) => this.mapSimulation(row));
  }

  async getById(userId: number, simulationId: number) {
    const rows = await this.databaseService.query<SimulationRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          title,
          simulation_type AS simulationType,
          input_payload AS inputPayload,
          result_payload AS resultPayload,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_simulations
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [simulationId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Simulation not found');
    }

    return this.mapSimulation(rows[0]);
  }

  async create(userId: number, createSimulationDto: CreateSimulationDto) {
    const result = await this.databaseService.execute(
      `
        INSERT INTO finan_simulations (
          user_id, title, simulation_type, input_payload, result_payload, notes
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        createSimulationDto.title.trim(),
        createSimulationDto.simulationType,
        JSON.stringify(createSimulationDto.inputPayload),
        createSimulationDto.resultPayload
          ? JSON.stringify(createSimulationDto.resultPayload)
          : null,
        createSimulationDto.notes?.trim() ?? null,
      ],
    );

    return this.getById(userId, result.insertId);
  }

  async getAnnualTaxReturnEstimate(
    userId: number,
    filter: GetAnnualTaxReturnEstimateDto,
  ): Promise<AnnualTaxReturnEstimate> {
    const fiscalYear = filter.year ?? new Date().getUTCFullYear();
    const simulationInput: AnnualTaxReturnSimulationInput = {
      declarationMode: filter.declarationMode ?? 'INDIVIDUAL',
      dependentChildrenCount: filter.dependentChildrenCount ?? 0,
      annualPensionContributionAmount: this.roundAmount(
        filter.annualPensionContributionAmount ?? 0,
      ),
      annualDonationAmount: this.roundAmount(filter.annualDonationAmount ?? 0),
      annualHousingDeductionAmount: this.roundAmount(
        filter.annualHousingDeductionAmount ?? 0,
      ),
      applyReviewableExpenses: filter.applyReviewableExpenses ?? false,
    };
    const [profile, incomesOverview, expensesOverview, taxOverview] =
      await Promise.all([
        this.taxService.getUserTaxIdentity(userId),
        this.incomesService.getPeriodOverview(userId, { year: fiscalYear }),
        this.expensesService.getPeriodOverview(userId, { year: fiscalYear }),
        this.taxService.getPeriodOverview(userId, { year: fiscalYear }),
      ]);

    const employmentIncome = incomesOverview.items
      .filter((item) => item.incomeType !== 'FREELANCE_INVOICE')
      .reduce((sum, item) => sum + item.effectiveAmount, 0);
    const economicActivityIncome = incomesOverview.items
      .filter((item) => item.incomeType === 'FREELANCE_INVOICE')
      .reduce((sum, item) => sum + item.effectiveAmount, 0);
    const deductibleAmount = expensesOverview.items
      .filter(
        (item) =>
          item.source === 'MANUAL' && item.deductibilityStatus === 'DEDUCTIBLE',
      )
      .reduce((sum, item) => sum + item.amount, 0);
    const reviewableAmount = expensesOverview.items
      .filter(
        (item) =>
          item.source === 'MANUAL' && item.deductibilityStatus === 'REVIEWABLE',
      )
      .reduce((sum, item) => sum + item.amount, 0);
    const nonDeductibleAmount = expensesOverview.items
      .filter(
        (item) =>
          item.source === 'MANUAL' &&
          item.deductibilityStatus === 'NON_DEDUCTIBLE',
      )
      .reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = employmentIncome + economicActivityIncome;
    const socialSecurityAmount =
      incomesOverview.totals.totalSocialSecurityAmount;
    const irpfWithheld = incomesOverview.totals.totalIrpfWithheld;
    const deductibleAmountUsed =
      deductibleAmount +
      (simulationInput.applyReviewableExpenses ? reviewableAmount : 0);
    const pensionContributionReductionAmount = Math.min(
      simulationInput.annualPensionContributionAmount,
      1500,
    );
    const personalMinimumAmount = 5550;
    const childrenMinimumAmount = this.calculateChildrenMinimum(
      simulationInput.dependentChildrenCount,
    );
    const declarationReductionAmount =
      simulationInput.declarationMode === 'JOINT' ? 3400 : 0;
    const totalPersonalAndFamilyMinimum =
      personalMinimumAmount +
      childrenMinimumAmount +
      declarationReductionAmount;
    const preMinimumTaxableBase = Math.max(
      0,
      totalIncome -
        socialSecurityAmount -
        deductibleAmountUsed -
        pensionContributionReductionAmount,
    );
    const estimatedTaxableBase = Math.max(
      0,
      preMinimumTaxableBase - totalPersonalAndFamilyMinimum,
    );
    const brackets = this.calculateProgressiveTaxBrackets(estimatedTaxableBase);
    const grossQuota = this.roundAmount(
      brackets.reduce((sum, bracket) => sum + bracket.quota, 0),
    );
    const donationDeductionAmount = Math.min(
      grossQuota,
      this.calculateDonationDeduction(simulationInput.annualDonationAmount),
    );
    const housingDeductionAmount = Math.min(
      Math.max(grossQuota - donationDeductionAmount, 0),
      simulationInput.annualHousingDeductionAmount,
    );
    const totalCreditsAmount = this.roundAmount(
      donationDeductionAmount + housingDeductionAmount,
    );
    const estimatedQuota = this.roundAmount(
      Math.max(grossQuota - totalCreditsAmount, 0),
    );
    const estimatedResult = this.roundAmount(estimatedQuota - irpfWithheld);
    const estimatedNetAfterTax = this.roundAmount(totalIncome - estimatedQuota);
    const resultType =
      estimatedResult > 0
        ? 'TO_PAY'
        : estimatedResult < 0
          ? 'TO_REFUND'
          : 'BALANCED';

    return {
      profile,
      fiscalYear,
      simulationInput,
      income: {
        employmentIncome: this.roundAmount(employmentIncome),
        economicActivityIncome: this.roundAmount(economicActivityIncome),
        totalIncome: this.roundAmount(totalIncome),
        irpfWithheld: this.roundAmount(irpfWithheld),
        socialSecurityAmount: this.roundAmount(socialSecurityAmount),
      },
      expenses: {
        deductibleAmount: this.roundAmount(deductibleAmount),
        reviewableAmount: this.roundAmount(reviewableAmount),
        nonDeductibleAmount: this.roundAmount(nonDeductibleAmount),
        taxObligationsAmount: this.roundAmount(taxOverview.totals.totalAmount),
        deductibleAmountUsed: this.roundAmount(deductibleAmountUsed),
      },
      reductions: {
        socialSecurityAmount: this.roundAmount(socialSecurityAmount),
        pensionContributionReductionAmount: this.roundAmount(
          pensionContributionReductionAmount,
        ),
        personalMinimumAmount: this.roundAmount(personalMinimumAmount),
        childrenMinimumAmount: this.roundAmount(childrenMinimumAmount),
        declarationReductionAmount: this.roundAmount(
          declarationReductionAmount,
        ),
        totalPersonalAndFamilyMinimum: this.roundAmount(
          totalPersonalAndFamilyMinimum,
        ),
      },
      credits: {
        donationDeductionAmount: this.roundAmount(donationDeductionAmount),
        housingDeductionAmount: this.roundAmount(housingDeductionAmount),
        totalCreditsAmount,
      },
      calculation: {
        preMinimumTaxableBase: this.roundAmount(preMinimumTaxableBase),
        grossQuota,
        estimatedTaxableBase: this.roundAmount(estimatedTaxableBase),
        estimatedQuota,
        estimatedNetAfterTax,
        estimatedResult: Math.abs(estimatedResult),
        resultType,
        brackets,
      },
      sourceSummary: {
        incomeRecordCount: incomesOverview.totals.recordCount,
        expenseRecordCount: expensesOverview.items.filter(
          (item) => item.source === 'MANUAL',
        ).length,
        taxObligationCount: taxOverview.totals.recordCount,
      },
      assumptions: [
        'Estimación simplificada basada en los datos ya registrados en el ejercicio y en los ajustes manuales de esta pantalla.',
        'La base previa descuenta Seguridad Social, gastos deducibles y, si lo indicas, gastos revisables aún no confirmados.',
        'Se aplican mínimos personales y familiares básicos, junto con una reducción general para declaración conjunta.',
        'Las aportaciones a pensiones se limitan a un máximo anual simplificado de 1.500 euros en esta simulación.',
        'Las deducciones de vivienda y donativos se aplican como créditos directos sobre la cuota estimada, sin modelar todavía casuísticas autonómicas específicas.',
        'Las obligaciones de IVA e IRPF derivadas de facturas emitidas se muestran como referencia, pero no reducen la base general del IRPF.',
      ],
    };
  }

  private mapSimulation(row: SimulationRow) {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      simulationType: row.simulationType,
      inputPayload: parseStoredJson<Record<string, unknown>>(row.inputPayload),
      resultPayload: parseStoredJson<Record<string, unknown>>(
        row.resultPayload,
      ),
      notes: row.notes,
      createdAt: toIsoDateTime(row.createdAt),
      updatedAt: toIsoDateTime(row.updatedAt),
    };
  }

  private calculateProgressiveTaxBrackets(taxableBase: number) {
    const brackets = [
      { lowerBound: 0, upperBound: 12450, rate: 0.19 },
      { lowerBound: 12450, upperBound: 20200, rate: 0.24 },
      { lowerBound: 20200, upperBound: 35200, rate: 0.3 },
      { lowerBound: 35200, upperBound: 60000, rate: 0.37 },
      { lowerBound: 60000, upperBound: 300000, rate: 0.45 },
      { lowerBound: 300000, upperBound: null, rate: 0.47 },
    ];

    return brackets
      .map((bracket) => {
        const ceiling = bracket.upperBound ?? Number.POSITIVE_INFINITY;
        const taxableAmount = Math.max(
          0,
          Math.min(taxableBase, ceiling) - bracket.lowerBound,
        );

        return {
          ...bracket,
          taxableAmount: this.roundAmount(taxableAmount),
          quota: this.roundAmount(taxableAmount * bracket.rate),
        } satisfies TaxBracketEstimate;
      })
      .filter((bracket) => bracket.taxableAmount > 0);
  }

  private calculateChildrenMinimum(childrenCount: number) {
    if (childrenCount <= 0) {
      return 0;
    }

    const childrenMinimums = [2400, 2700, 4000];

    return Array.from({ length: childrenCount }, (_, index) => {
      if (index <= 2) {
        return childrenMinimums[index];
      }

      return 4500;
    }).reduce((sum, amount) => sum + amount, 0);
  }

  private calculateDonationDeduction(donationAmount: number) {
    if (donationAmount <= 0) {
      return 0;
    }

    const firstTierAmount = Math.min(donationAmount, 250);
    const remainingAmount = Math.max(donationAmount - 250, 0);

    return this.roundAmount(firstTierAmount * 0.8 + remainingAmount * 0.4);
  }

  private roundAmount(value: number) {
    return Number(value.toFixed(2));
  }
}
