import { Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';

interface DocumentPromptRow extends RowDataPacket {
  promptCode: string;
  provider: string;
  documentType: string | null;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputFormat: string | null;
}

export interface ResolvedDocumentPrompt {
  promptCode: string;
  provider: string;
  documentType: string | null;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputFormat: string | null;
}

@Injectable()
export class DocumentPromptService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findActiveLlmPrompt(params: {
    provider: string;
    documentType: string;
    version?: string;
  }): Promise<ResolvedDocumentPrompt | null> {
    try {
      const rows = await this.databaseService.query<DocumentPromptRow[]>(
        `
          SELECT
            prompt_code AS promptCode,
            provider,
            document_type AS documentType,
            version,
            system_prompt AS systemPrompt,
            user_prompt_template AS userPromptTemplate,
            output_format AS outputFormat
          FROM finan_ai_prompts
          WHERE prompt_scope = 'DOCUMENT_LLM'
            AND is_active = 1
            AND prompt_code <> 'DOCUMENT_LLM_CLASSIFIER'
            AND provider IN (?, 'default')
            AND (document_type = ? OR document_type IS NULL)
            AND (? IS NULL OR version = ?)
          ORDER BY
            CASE WHEN provider = ? THEN 0 ELSE 1 END,
            CASE WHEN document_type = ? THEN 0 ELSE 1 END,
            updated_at DESC,
            id DESC
          LIMIT 1
        `,
        [
          params.provider,
          params.documentType,
          params.version ?? null,
          params.version ?? null,
          params.provider,
          params.documentType,
        ],
      );

      if (!rows.length) {
        return null;
      }

      return rows[0];
    } catch (error) {
      const databaseError = error as { code?: string };

      if (databaseError.code === 'ER_NO_SUCH_TABLE') {
        return null;
      }

      throw error;
    }
  }

  async findPromptByCode(params: {
    provider: string;
    promptCode: string;
    version?: string;
  }): Promise<ResolvedDocumentPrompt | null> {
    try {
      const rows = await this.databaseService.query<DocumentPromptRow[]>(
        `
          SELECT
            prompt_code AS promptCode,
            provider,
            document_type AS documentType,
            version,
            system_prompt AS systemPrompt,
            user_prompt_template AS userPromptTemplate,
            output_format AS outputFormat
          FROM finan_ai_prompts
          WHERE prompt_scope = 'DOCUMENT_LLM'
            AND prompt_code = ?
            AND is_active = 1
            AND provider IN (?, 'default')
            AND (? IS NULL OR version = ?)
          ORDER BY
            CASE WHEN provider = ? THEN 0 ELSE 1 END,
            updated_at DESC,
            id DESC
          LIMIT 1
        `,
        [
          params.promptCode,
          params.provider,
          params.version ?? null,
          params.version ?? null,
          params.provider,
        ],
      );

      if (!rows.length) {
        return null;
      }

      return rows[0];
    } catch (error) {
      const databaseError = error as { code?: string };

      if (databaseError.code === 'ER_NO_SUCH_TABLE') {
        return null;
      }

      throw error;
    }
  }
}
