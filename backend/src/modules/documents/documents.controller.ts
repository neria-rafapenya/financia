import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DocumentsService } from './documents.service';
import { ProcessDocumentPipelineDto } from './dto/process-document-pipeline.dto';
import { ProcessLlmDto } from './dto/process-llm.dto';
import { ProcessOcrDto } from './dto/process-ocr.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentsService.upload(user.userId, file, uploadDocumentDto);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('pipeline')
  processPipeline(
    @CurrentUser() user: AuthenticatedUser,
    @Body() processDocumentPipelineDto: ProcessDocumentPipelineDto,
    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentsService.processUploadPipeline(
      user.userId,
      file,
      processDocumentPipelineDto,
    );
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.list(user.userId);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) documentId: number,
  ) {
    return this.documentsService.getById(user.userId, documentId);
  }

  @Get(':id/file')
  async getFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) documentId: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.documentsService.getFile(user.userId, documentId);

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', String(file.fileSizeBytes));
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.originalFilename)}"`,
    );

    return new StreamableFile(file.buffer);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) documentId: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(
      user.userId,
      documentId,
      updateDocumentDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) documentId: number,
  ) {
    return this.documentsService.remove(user.userId, documentId);
  }

  @Post(':id/process-ocr')
  processOcr(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) documentId: number,
    @Body() processOcrDto: ProcessOcrDto,
  ) {
    return this.documentsService.processOcr(
      user.userId,
      documentId,
      processOcrDto,
    );
  }

  @Post(':id/process-llm')
  processLlm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) documentId: number,
    @Body() processLlmDto: ProcessLlmDto,
  ) {
    return this.documentsService.processLlm(
      user.userId,
      documentId,
      processLlmDto,
    );
  }

  @Post(':id/verify')
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) documentId: number,
    @Body() verifyDocumentDto: VerifyDocumentDto,
  ) {
    return this.documentsService.verify(
      user.userId,
      documentId,
      verifyDocumentDto,
    );
  }
}
