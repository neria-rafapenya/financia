import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { GetAnnualTaxReturnEstimateDto } from './dto/get-annual-tax-return-estimate.dto';
import { SimulationsService } from './simulations.service';

@UseGuards(JwtAuthGuard)
@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.simulationsService.list(user.userId);
  }

  @Get('annual-tax-return-estimate')
  getAnnualTaxReturnEstimate(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: GetAnnualTaxReturnEstimateDto,
  ) {
    return this.simulationsService.getAnnualTaxReturnEstimate(
      user.userId,
      filter,
    );
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) simulationId: number,
  ) {
    return this.simulationsService.getById(user.userId, simulationId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createSimulationDto: CreateSimulationDto,
  ) {
    return this.simulationsService.create(user.userId, createSimulationDto);
  }
}
