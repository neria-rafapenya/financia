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
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.contractsService.list(user.userId);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) contractId: number,
  ) {
    return this.contractsService.getById(user.userId, contractId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createContractDto: CreateContractDto,
  ) {
    return this.contractsService.create(user.userId, createContractDto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) contractId: number,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    return this.contractsService.update(
      user.userId,
      contractId,
      updateContractDto,
    );
  }
}
