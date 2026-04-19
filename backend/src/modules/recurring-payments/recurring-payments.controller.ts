import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateRecurringPaymentDto } from './dto/create-recurring-payment.dto';
import { UpdateRecurringPaymentDto } from './dto/update-recurring-payment.dto';
import { RecurringPaymentsService } from './recurring-payments.service';

@UseGuards(JwtAuthGuard)
@Controller('recurring-payments')
export class RecurringPaymentsController {
  constructor(
    private readonly recurringPaymentsService: RecurringPaymentsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.recurringPaymentsService.list(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createRecurringPaymentDto: CreateRecurringPaymentDto,
  ) {
    return this.recurringPaymentsService.create(
      user.userId,
      createRecurringPaymentDto,
    );
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) recurringPaymentId: number,
    @Body() updateRecurringPaymentDto: UpdateRecurringPaymentDto,
  ) {
    return this.recurringPaymentsService.update(
      user.userId,
      recurringPaymentId,
      updateRecurringPaymentDto,
    );
  }
}
