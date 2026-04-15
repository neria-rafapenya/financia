import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PayersModule } from './modules/payers/payers.module';
import { IncomesModule } from './modules/incomes/incomes.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { RecurringPaymentsModule } from './modules/recurring-payments/recurring-payments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { TaxModule } from './modules/tax/tax.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { SimulationsModule } from './modules/simulations/simulations.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { LlmModule } from './modules/llm/llm.module';
import { RulesModule } from './modules/rules/rules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    AuthModule,
    UsersModule,
    PayersModule,
    IncomesModule,
    ExpensesModule,
    RecurringPaymentsModule,
    DocumentsModule,
    ContractsModule,
    TaxModule,
    AlertsModule,
    SimulationsModule,
    OcrModule,
    LlmModule,
    RulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
