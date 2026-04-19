import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AlertsService } from './alerts.service';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.alertsService.list(user.userId);
  }

  @Put(':id/read')
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) alertId: number,
  ) {
    return this.alertsService.markAsRead(user.userId, alertId);
  }

  @Put(':id/resolve')
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) alertId: number,
  ) {
    return this.alertsService.resolve(user.userId, alertId);
  }
}
