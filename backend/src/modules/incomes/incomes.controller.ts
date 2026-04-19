import {
  Body,
  Controller,
  Delete,
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
import { CreateIncomeDto } from './dto/create-income.dto';
import { GetIncomePeriodDto } from './dto/get-income-period.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomesService } from './incomes.service';

@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.incomesService.list(user.userId);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.incomesService.summary(user.userId);
  }

  @Get('period')
  getPeriod(
    @CurrentUser() user: AuthenticatedUser,
    @Query() getIncomePeriodDto: GetIncomePeriodDto,
  ) {
    return this.incomesService.getPeriodOverview(
      user.userId,
      getIncomePeriodDto,
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createIncomeDto: CreateIncomeDto,
  ) {
    return this.incomesService.create(user.userId, createIncomeDto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) incomeId: number,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    return this.incomesService.update(user.userId, incomeId, updateIncomeDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) incomeId: number,
  ) {
    return this.incomesService.remove(user.userId, incomeId);
  }
}
