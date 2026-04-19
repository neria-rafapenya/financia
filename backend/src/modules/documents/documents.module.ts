import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentAiService } from './document-ai.service';
import { DocumentPromptService } from './document-prompt.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentStorageService,
    DocumentAiService,
    DocumentPromptService,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
