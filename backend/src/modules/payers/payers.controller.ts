import {
  Body,
  Controller,
  Delete,
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
import { CreatePayerDto } from './dto/create-payer.dto';
import { UpdatePayerDto } from './dto/update-payer.dto';
import { PayersService } from './payers.service';

@UseGuards(JwtAuthGuard)
@Controller('payers')
export class PayersController {
  constructor(private readonly payersService: PayersService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.payersService.list(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createPayerDto: CreatePayerDto,
  ) {
    return this.payersService.create(user.userId, createPayerDto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) payerId: number,
    @Body() updatePayerDto: UpdatePayerDto,
  ) {
    return this.payersService.update(user.userId, payerId, updatePayerDto);
  }

  @Delete(':id')
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) payerId: number,
  ) {
    return this.payersService.delete(user.userId, payerId);
  }
}
