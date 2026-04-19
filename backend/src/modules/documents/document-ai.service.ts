import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFParse } from 'pdf-parse';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

interface DocumentForAi {
  id: number;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  storagePath: string;
}

interface PromptContext {
  systemPrompt?: string;
  userPrompt?: string;
  outputFormat?: string | null;
  version?: string | null;
}

interface PayerCandidate {
  id: number;
  payerName: string;
  taxId: string | null;
  payerType: string;
}

const supportedDocumentTypes = new Set([
  'PAYSLIP',
  'RETENTION_CERTIFICATE',
  'CONTRACT',
  'INVOICE',
  'RECEIPT',
  'RENTAL_DOCUMENT',
  'INSURANCE_DOCUMENT',
  'TAX_DOCUMENT',
  'SCREENSHOT',
  'OTHER',
]);

const OCR_ROTATION_STEPS = [0, 90, 180, 270] as const;
const MIN_MEANINGFUL_OCR_SCORE = 80;
const TESSERACT_RETRY_CONFIDENCE_THRESHOLD = 55;

interface OcrAttemptResult {
  rawText: string;
  confidenceScore: number | null;
  score: number;
}

@Injectable()
export class DocumentAiService {
  constructor(private readonly configService: ConfigService) {}

  async extractText(params: {
    provider: string;
    document: DocumentForAi;
    fileBuffer: Buffer;
    manualRawText?: string;
  }) {
    if (params.manualRawText?.trim()) {
      return {
        ocrProvider: 'manual',
        rawText: params.manualRawText.trim(),
        confidenceScore: 100,
      };
    }

    if (
      params.document.mimeType.startsWith('text/') ||
      params.document.mimeType === 'application/json'
    ) {
      return {
        ocrProvider: 'plain-text',
        rawText: params.fileBuffer.toString('utf8').trim(),
        confidenceScore: 100,
      };
    }

    if (params.document.mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: params.fileBuffer });
      const parsedPdf = await parser.getText();
      await parser.destroy();

      return {
        ocrProvider: 'pdf-parse',
        rawText: parsedPdf.text.trim(),
        confidenceScore: null,
      };
    }

    if (params.provider === 'openai') {
      return this.extractTextWithOpenAi(params.document, params.fileBuffer);
    }

    if (params.provider !== 'tesseract') {
      throw new BadRequestException(
        `Unsupported OCR provider: ${params.provider}`,
      );
    }

    if (!params.document.mimeType.startsWith('image/')) {
      throw new BadRequestException(
        'Tesseract OCR currently supports image documents only',
      );
    }

    return this.extractTextWithTesseract(params.fileBuffer);
  }

  async interpretDocument(params: {
    provider: string;
    modelName?: string;
    document: DocumentForAi;
    rawText: string;
    manualRawResponse?: string;
    manualParsedJson?: Record<string, unknown>;
    manualConfidenceSummary?: string;
    instructions?: string;
    prompt?: PromptContext | null;
  }) {
    if (params.manualRawResponse?.trim()) {
      return {
        llmProvider: 'manual',
        modelName: params.modelName ?? 'manual',
        rawResponse: params.manualRawResponse,
        parsedJson: params.manualParsedJson ?? null,
        confidenceSummary: params.manualConfidenceSummary ?? 'MANUAL',
      };
    }

    if (params.provider === 'openai') {
      return this.interpretWithOpenAi(params);
    }

    const preview = params.rawText.slice(0, 400);

    return {
      llmProvider: 'mock',
      modelName: params.modelName ?? 'mock',
      rawResponse: JSON.stringify(
        {
          documentType: params.document.documentType,
          originalFilename: params.document.originalFilename,
          preview,
          extractedFields: {},
        },
        null,
        2,
      ),
      parsedJson: {
        documentType: params.document.documentType,
        originalFilename: params.document.originalFilename,
        preview,
        extractedFields: {},
      },
      confidenceSummary: 'LOW',
    };
  }

  async classifyDocument(params: {
    provider: string;
    modelName?: string;
    document: DocumentForAi;
    rawText: string;
    prompt?: PromptContext | null;
  }) {
    if (params.provider === 'openai') {
      return this.classifyWithOpenAi(params);
    }

    const documentType = this.inferDocumentTypeFromKeywords(
      params.document.originalFilename,
      params.rawText,
    );

    return {
      documentType,
      rawResponse: JSON.stringify(
        {
          documentType,
          confidenceSummary: 'LOW',
          reasoning:
            'Clasificacion heuristica local basada en nombre de archivo y palabras clave.',
        },
        null,
        2,
      ),
      parsedJson: {
        documentType,
        confidenceSummary: 'LOW',
        reasoning:
          'Clasificacion heuristica local basada en nombre de archivo y palabras clave.',
      },
      confidenceSummary: 'LOW',
      reasoning:
        'Clasificacion heuristica local basada en nombre de archivo y palabras clave.',
    };
  }

  async matchPayer(params: {
    provider: string;
    modelName?: string;
    document: DocumentForAi;
    rawText: string;
    parsedJson?: Record<string, unknown> | null;
    payers: PayerCandidate[];
  }) {
    if (!params.payers.length) {
      return {
        payerId: null,
        rawResponse: null,
        parsedJson: null,
        confidenceSummary: null,
        reasoning: null,
      };
    }

    if (params.provider === 'openai') {
      return this.matchPayerWithOpenAi(params);
    }

    return this.matchPayerHeuristically(params);
  }

  private async extractTextWithOpenAi(
    document: DocumentForAi,
    fileBuffer: Buffer,
  ) {
    if (!document.mimeType.startsWith('image/')) {
      throw new BadRequestException(
        'OpenAI OCR currently supports image documents only in this implementation',
      );
    }

    const baseBuffer = await this.prepareImageForOpenAi(fileBuffer);
    const rotatedBuffers = await this.buildRotatedImageVariants(baseBuffer);
    const firstAttempt = await this.extractTextWithOpenAiOnce(
      document,
      rotatedBuffers[0],
    );

    if (!this.shouldRetryOpenAiOcr(firstAttempt.rawText)) {
      return firstAttempt;
    }

    let bestAttempt = {
      ...firstAttempt,
      score: this.scoreOpenAiAttempt(firstAttempt.rawText),
    };

    for (const rotatedBuffer of rotatedBuffers.slice(1)) {
      const candidateAttempt = await this.extractTextWithOpenAiOnce(
        document,
        rotatedBuffer,
      );
      const candidateScore = this.scoreOpenAiAttempt(candidateAttempt.rawText);

      if (candidateScore > bestAttempt.score) {
        bestAttempt = {
          ...candidateAttempt,
          score: candidateScore,
        };
      }
    }

    return {
      ocrProvider: 'openai',
      rawText: bestAttempt.rawText,
      confidenceScore: null,
    };
  }

  private async extractTextWithOpenAiOnce(
    document: DocumentForAi,
    fileBuffer: Buffer,
  ) {
    const payload = {
      model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4.1-mini'),
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Transcribe exactly all visible text from the document image. Return plain text only, without markdown or explanations.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Documento ${document.documentType}. Transcribe el contenido completo.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${document.mimeType};base64,${fileBuffer.toString('base64')}`,
              },
            },
          ],
        },
      ],
    };

    const response = await this.callOpenAi(payload);
    const rawText = response.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      throw new InternalServerErrorException(
        'OpenAI OCR returned an empty response',
      );
    }

    return {
      ocrProvider: 'openai',
      rawText,
      confidenceScore: null,
    };
  }

  private async extractTextWithTesseract(fileBuffer: Buffer) {
    const baseBuffer = await this.prepareImageForTesseract(fileBuffer);
    const rotatedBuffers = await this.buildRotatedImageVariants(baseBuffer);
    let bestAttempt: OcrAttemptResult | null = null;

    for (const [index, rotatedBuffer] of rotatedBuffers.entries()) {
      const result = await Tesseract.recognize(rotatedBuffer, 'spa+eng');
      const rawText = result.data.text.trim();
      const confidenceScore = Number(result.data.confidence.toFixed(2));
      const candidateAttempt = {
        rawText,
        confidenceScore,
        score: this.scoreTesseractAttempt(rawText, confidenceScore),
      } satisfies OcrAttemptResult;

      if (!bestAttempt || candidateAttempt.score > bestAttempt.score) {
        bestAttempt = candidateAttempt;
      }

      if (
        index === 0 &&
        !this.shouldRetryTesseractOcr(rawText, confidenceScore)
      ) {
        break;
      }
    }

    return {
      ocrProvider: 'tesseract',
      rawText: bestAttempt?.rawText ?? '',
      confidenceScore: bestAttempt?.confidenceScore ?? null,
    };
  }

  private async prepareImageForOpenAi(fileBuffer: Buffer) {
    return sharp(fileBuffer, { failOn: 'none' }).rotate().png().toBuffer();
  }

  private async prepareImageForTesseract(fileBuffer: Buffer) {
    return sharp(fileBuffer, { failOn: 'none' })
      .rotate()
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
  }

  private async buildRotatedImageVariants(fileBuffer: Buffer) {
    const variants: Buffer[] = [fileBuffer];

    for (const rotationStep of OCR_ROTATION_STEPS.slice(1)) {
      variants.push(
        await sharp(fileBuffer, { failOn: 'none' })
          .rotate(rotationStep)
          .png()
          .toBuffer(),
      );
    }

    return variants;
  }

  private shouldRetryOpenAiOcr(rawText: string) {
    return this.scoreOpenAiAttempt(rawText) < MIN_MEANINGFUL_OCR_SCORE;
  }

  private shouldRetryTesseractOcr(
    rawText: string,
    confidenceScore: number | null,
  ) {
    return (
      (confidenceScore ?? 0) < TESSERACT_RETRY_CONFIDENCE_THRESHOLD ||
      this.scoreOpenAiAttempt(rawText) < MIN_MEANINGFUL_OCR_SCORE
    );
  }

  private scoreOpenAiAttempt(rawText: string) {
    const normalizedText = rawText.split(/\s+/).filter(Boolean).join(' ');

    if (!normalizedText) {
      return 0;
    }

    const tokenCount = normalizedText.split(' ').filter(Boolean).length;
    return normalizedText.length + tokenCount * 4;
  }

  private scoreTesseractAttempt(
    rawText: string,
    confidenceScore: number | null,
  ) {
    return (confidenceScore ?? 0) * 10 + this.scoreOpenAiAttempt(rawText);
  }

  private async interpretWithOpenAi(params: {
    modelName?: string;
    document: DocumentForAi;
    rawText: string;
    manualParsedJson?: Record<string, unknown>;
    manualConfidenceSummary?: string;
    instructions?: string;
    prompt?: PromptContext | null;
  }) {
    const model =
      params.modelName ??
      this.configService.get<string>('OPENAI_MODEL', 'gpt-4.1-mini');
    const payload = {
      model,
      temperature: 0.1,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content:
            params.prompt?.systemPrompt ??
            'Eres un extractor documental financiero. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary.',
        },
        {
          role: 'user',
          content:
            params.prompt?.userPrompt ?? this.buildDefaultUserPrompt(params),
        },
      ],
    };

    const response = await this.callOpenAi(payload);
    const rawResponse = response.choices?.[0]?.message?.content?.trim();

    if (!rawResponse) {
      throw new InternalServerErrorException(
        'OpenAI LLM returned an empty response',
      );
    }

    let parsedJson: Record<string, unknown> | null = null;

    try {
      parsedJson = JSON.parse(rawResponse) as Record<string, unknown>;
    } catch {
      parsedJson = params.manualParsedJson ?? null;
    }

    return {
      llmProvider: 'openai',
      modelName: model,
      rawResponse,
      parsedJson,
      confidenceSummary:
        params.manualConfidenceSummary ??
        (typeof parsedJson?.confidenceSummary === 'string'
          ? parsedJson.confidenceSummary
          : 'MEDIUM'),
    };
  }

  private async classifyWithOpenAi(params: {
    modelName?: string;
    document: DocumentForAi;
    rawText: string;
    prompt?: PromptContext | null;
  }) {
    const model =
      params.modelName ??
      this.configService.get<string>('OPENAI_MODEL', 'gpt-4.1-mini');
    const payload = {
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            params.prompt?.systemPrompt ??
            'Clasifica documentos financieros. Devuelve siempre un JSON valido con las claves: documentType, confidenceSummary y reasoning. documentType debe ser uno de: PAYSLIP, RETENTION_CERTIFICATE, CONTRACT, INVOICE, RECEIPT, RENTAL_DOCUMENT, INSURANCE_DOCUMENT, TAX_DOCUMENT, SCREENSHOT, OTHER.',
        },
        {
          role: 'user',
          content:
            params.prompt?.userPrompt ??
            [
              `Nombre de archivo: ${params.document.originalFilename}`,
              `Tipo actual declarado: ${params.document.documentType}`,
              'Tipos documentales permitidos: PAYSLIP, RETENTION_CERTIFICATE, CONTRACT, INVOICE, RECEIPT, RENTAL_DOCUMENT, INSURANCE_DOCUMENT, TAX_DOCUMENT, SCREENSHOT, OTHER',
              'Texto OCR:',
              params.rawText,
            ].join('\n\n'),
        },
      ],
    };

    const response = await this.callOpenAi(payload);
    const rawResponse = response.choices?.[0]?.message?.content?.trim();

    if (!rawResponse) {
      throw new InternalServerErrorException(
        'OpenAI classifier returned an empty response',
      );
    }

    let parsedJson: Record<string, unknown> | null = null;

    try {
      parsedJson = JSON.parse(rawResponse) as Record<string, unknown>;
    } catch {
      parsedJson = null;
    }

    const documentType = this.normalizeDocumentType(
      typeof parsedJson?.documentType === 'string'
        ? parsedJson.documentType
        : null,
    );

    return {
      documentType,
      rawResponse,
      parsedJson,
      confidenceSummary:
        typeof parsedJson?.confidenceSummary === 'string'
          ? parsedJson.confidenceSummary
          : 'MEDIUM',
      reasoning:
        typeof parsedJson?.reasoning === 'string' ? parsedJson.reasoning : null,
    };
  }

  private async matchPayerWithOpenAi(params: {
    modelName?: string;
    document: DocumentForAi;
    rawText: string;
    parsedJson?: Record<string, unknown> | null;
    payers: PayerCandidate[];
  }) {
    const model =
      params.modelName ??
      this.configService.get<string>('OPENAI_MODEL', 'gpt-4.1-mini');
    const payload = {
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Eres un conciliador documental. Debes decidir si un documento financiero pertenece a uno de los pagadores existentes. Devuelve siempre JSON con payerId, confidenceSummary y reasoning. payerId debe ser uno de los IDs disponibles o null si no hay coincidencia fiable.',
        },
        {
          role: 'user',
          content: [
            `Nombre de archivo: ${params.document.originalFilename}`,
            `Tipo documental: ${params.document.documentType}`,
            'Pagadores disponibles:',
            JSON.stringify(params.payers, null, 2),
            'Campos extraídos:',
            JSON.stringify(params.parsedJson?.extractedFields ?? {}, null, 2),
            'Texto OCR:',
            params.rawText,
          ].join('\n\n'),
        },
      ],
    };

    const response = await this.callOpenAi(payload);
    const rawResponse = response.choices?.[0]?.message?.content?.trim();

    if (!rawResponse) {
      throw new InternalServerErrorException(
        'OpenAI payer matcher returned an empty response',
      );
    }

    let parsedJson: Record<string, unknown> | null = null;

    try {
      parsedJson = JSON.parse(rawResponse) as Record<string, unknown>;
    } catch {
      parsedJson = null;
    }

    const payerId = this.normalizeMatchedPayerId(
      parsedJson?.payerId,
      params.payers,
    );

    return {
      payerId,
      rawResponse,
      parsedJson,
      confidenceSummary:
        typeof parsedJson?.confidenceSummary === 'string'
          ? parsedJson.confidenceSummary
          : null,
      reasoning:
        typeof parsedJson?.reasoning === 'string' ? parsedJson.reasoning : null,
    };
  }

  private matchPayerHeuristically(params: {
    document: DocumentForAi;
    rawText: string;
    parsedJson?: Record<string, unknown> | null;
    payers: PayerCandidate[];
  }) {
    const haystack = this.normalizeForMatch(
      [
        params.document.originalFilename,
        params.rawText,
        JSON.stringify(params.parsedJson?.extractedFields ?? {}),
      ].join('\n'),
    );

    const rankedPayers = params.payers
      .map((payer) => {
        let score = 0;
        const normalizedPayerName = this.normalizeForMatch(payer.payerName);
        const normalizedTaxId = payer.taxId
          ? this.normalizeForMatch(payer.taxId)
          : null;

        if (normalizedPayerName && haystack.includes(normalizedPayerName)) {
          score += 3;
        }

        const payerNameTokens = normalizedPayerName
          .split(' ')
          .filter((token) => token.length >= 4);

        for (const token of payerNameTokens) {
          if (haystack.includes(token)) {
            score += 1;
          }
        }

        if (normalizedTaxId && haystack.includes(normalizedTaxId)) {
          score += 4;
        }

        return {
          payer,
          score,
        };
      })
      .filter((candidate) => candidate.score > 0)
      .sort(
        (leftCandidate, rightCandidate) =>
          rightCandidate.score - leftCandidate.score,
      );

    const bestCandidate = rankedPayers[0];
    const secondCandidate = rankedPayers[1];

    if (!bestCandidate) {
      return {
        payerId: null,
        rawResponse: null,
        parsedJson: null,
        confidenceSummary: null,
        reasoning: null,
      };
    }

    const isConfidentMatch =
      bestCandidate.score >= 3 &&
      (!secondCandidate || bestCandidate.score > secondCandidate.score);

    return {
      payerId: isConfidentMatch ? bestCandidate.payer.id : null,
      rawResponse: null,
      parsedJson: null,
      confidenceSummary: isConfidentMatch ? 'MEDIUM' : 'LOW',
      reasoning: isConfidentMatch
        ? 'Asociacion heuristica basada en coincidencias de nombre o identificador fiscal.'
        : 'No existe una coincidencia heuristica suficientemente fiable.',
    };
  }

  private async callOpenAi(payload: Record<string, unknown>) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new BadRequestException('OPENAI_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!response.ok) {
      throw new InternalServerErrorException(
        json.error?.message ?? 'OpenAI request failed',
      );
    }

    return json;
  }

  private buildDefaultUserPrompt(params: {
    document: DocumentForAi;
    rawText: string;
    instructions?: string;
  }) {
    return [
      `Tipo documental: ${params.document.documentType}`,
      `Nombre de archivo: ${params.document.originalFilename}`,
      params.instructions?.trim()
        ? `Instrucciones: ${params.instructions.trim()}`
        : null,
      'Texto OCR:',
      params.rawText,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private normalizeDocumentType(value: string | null) {
    if (!value) {
      return 'OTHER';
    }

    const normalized = value.trim().toUpperCase();
    const aliases: Record<string, string> = {
      PAYSLIP: 'PAYSLIP',
      NOMINA: 'PAYSLIP',
      CONTRACT: 'CONTRACT',
      CONTRATO: 'CONTRACT',
      INVOICE: 'INVOICE',
      FACTURA: 'INVOICE',
      RECEIPT: 'RECEIPT',
      TICKET: 'RECEIPT',
      RETENTION_CERTIFICATE: 'RETENTION_CERTIFICATE',
      CERTIFICADO_RETENCIONES: 'RETENTION_CERTIFICATE',
      RENTAL_DOCUMENT: 'RENTAL_DOCUMENT',
      ALQUILER: 'RENTAL_DOCUMENT',
      INSURANCE_DOCUMENT: 'INSURANCE_DOCUMENT',
      SEGURO: 'INSURANCE_DOCUMENT',
      TAX_DOCUMENT: 'TAX_DOCUMENT',
      SCREENSHOT: 'SCREENSHOT',
      OTHER: 'OTHER',
    };

    const mapped = aliases[normalized] ?? normalized;
    return supportedDocumentTypes.has(mapped) ? mapped : 'OTHER';
  }

  private inferDocumentTypeFromKeywords(filename: string, rawText: string) {
    const haystack = `${filename}\n${rawText}`.toLowerCase();

    if (
      /nomina|devengos|deducciones|seguridad social|liquido a percibir/.test(
        haystack,
      )
    ) {
      return 'PAYSLIP';
    }

    if (/contrato|clausula|empleador|trabajador|firmado/.test(haystack)) {
      return 'CONTRACT';
    }

    if (/ticket|total|iva|importe|tpv|gracias por su compra/.test(haystack)) {
      return 'RECEIPT';
    }

    if (/factura|base imponible|cuota iva|numero de factura/.test(haystack)) {
      return 'INVOICE';
    }

    if (/retenciones|irpf retenido|certificado/.test(haystack)) {
      return 'RETENTION_CERTIFICATE';
    }

    return 'OTHER';
  }

  private normalizeMatchedPayerId(value: unknown, payers: PayerCandidate[]) {
    const numericValue = Number(value);

    if (!Number.isInteger(numericValue)) {
      return null;
    }

    return payers.some((payer) => payer.id === numericValue)
      ? numericValue
      : null;
  }

  private normalizeForMatch(value: string) {
    return value
      .normalize('NFD')
      .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
      .toLowerCase()
      .trim();
  }
}
