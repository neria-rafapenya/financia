import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { GetTaxPeriodDto } from './dto/get-tax-period.dto';
import { TaxService } from './tax.service';

@UseGuards(JwtAuthGuard)
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('obligations')
  getPeriodOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: GetTaxPeriodDto,
  ) {
    return this.taxService.getPeriodOverview(user.userId, filter);
  }
}
