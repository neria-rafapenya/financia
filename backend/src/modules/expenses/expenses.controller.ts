import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { GetExpensePeriodDto } from './dto/get-expense-period.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.list(user.userId);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.summary(user.userId);
  }

  @Get('period')
  getPeriodOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: GetExpensePeriodDto,
  ) {
    return this.expensesService.getPeriodOverview(user.userId, filter);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(user.userId, createExpenseDto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) expenseId: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(
      user.userId,
      expenseId,
      updateExpenseDto,
    );
  }
}
