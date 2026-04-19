USE financia;

INSERT INTO finan_expense_categories (code, name, default_deductibility_status)
VALUES
  ('HOUSING_RENT', 'Alquiler y vivienda', 'NON_DEDUCTIBLE'),
  ('UTILITIES', 'Suministros', 'NON_DEDUCTIBLE'),
  ('INSURANCE', 'Seguros', 'REVIEWABLE'),
  ('HEALTH', 'Salud', 'REVIEWABLE'),
  ('TAX_ADVISORY', 'Gestoria y asesoria', 'REVIEWABLE'),
  ('PROFESSIONAL_FEES', 'Cuotas profesionales', 'DEDUCTIBLE'),
  ('TRANSPORT', 'Transporte', 'REVIEWABLE'),
  ('SUBSCRIPTIONS', 'Suscripciones', 'REVIEWABLE'),
  ('SELF_EMPLOYED', 'Autonomos', 'DEDUCTIBLE'),
  ('TAXES', 'Impuestos', 'NON_DEDUCTIBLE'),
  ('PERSONAL', 'Gastos personales', 'NON_DEDUCTIBLE'),
  ('WORK_EXPENSES', 'Gastos laborales', 'REVIEWABLE'),
  ('TRAINING', 'Formacion', 'REVIEWABLE'),
  ('HARDWARE', 'Hardware y equipo', 'REVIEWABLE'),
  ('SOFTWARE', 'Software', 'REVIEWABLE'),
  ('BANKING', 'Comisiones bancarias', 'REVIEWABLE')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  default_deductibility_status = VALUES(default_deductibility_status);

INSERT INTO finan_rules (rule_code, name, rule_scope, description, is_active)
VALUES
  (
    'PAYER_ZERO_RETENTION',
    'Pagador con retencion cero o anormalmente baja',
    'INCOME',
    'Si un pagador registra ingresos pero no aplica IRPF retenido, debe generarse una alerta de severidad alta para revision fiscal.',
    1
  ),
  (
    'MULTIPLE_PAYERS_SAME_YEAR',
    'Multiples pagadores en el mismo ejercicio',
    'TAX',
    'Si el usuario tiene mas de un pagador en un mismo ejercicio fiscal, el sistema debe marcar revision fiscal preventiva.',
    1
  ),
  (
    'EMPLOYER_PAID_HEALTH_INSURANCE',
    'Seguro medico pagado por empresa con posible duplicidad',
    'EXPENSE',
    'Si un gasto sanitario parece estar ya cubierto por la empresa, debe marcarse como no deducible directo o revisable por duplicidad potencial.',
    1
  ),
  (
    'CONTRACT_EXCLUSIVITY_KEYWORDS',
    'Deteccion de exclusividad contractual',
    'CONTRACT',
    'Si el contrato contiene terminos asociados a exclusividad, debe generarse una alerta para revision laboral manual.',
    1
  ),
  (
    'CONTRACT_NON_COMPETE_KEYWORDS',
    'Deteccion de no competencia contractual',
    'CONTRACT',
    'Si el contrato contiene clausulas de no competencia, debe generarse una alerta para revision laboral manual.',
    1
  ),
  (
    'POLICY_EXPIRING_SOON',
    'Poliza proxima a vencimiento',
    'ALERT',
    'Si una poliza vence en menos de 30 dias, el sistema debe generar una alerta preventiva.',
    1
  ),
  (
    'HIGH_FIXED_COST_RATIO',
    'Carga fija mensual elevada',
    'ALERT',
    'Si los pagos periodicos superan un umbral relevante respecto al ingreso neto mensual, debe generarse una alerta de tension de caja.',
    1
  ),
  (
    'UNCLASSIFIED_EXPENSE',
    'Gasto sin clasificar o pendiente de validar',
    'EXPENSE',
    'Si un gasto no tiene categoria valida o su deducibilidad queda en estado desconocido, debe marcarse para revision manual.',
    1
  ),
  (
    'DOCUMENT_PENDING_VERIFICATION',
    'Documento procesado pendiente de verificacion',
    'DOCUMENT',
    'Si un documento pasa por OCR o LLM pero no queda verificado, debe mantenerse visible para revision del usuario.',
    1
  ),
  (
    'CONTRACT_UNSIGNED_OR_MISSING',
    'Contrato ausente o sin firma detectable',
    'CONTRACT',
    'Si existe una relacion contractual activa sin documento firmado o sin evidencia suficiente, debe generarse una alerta de control documental.',
    1
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  rule_scope = VALUES(rule_scope),
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO finan_ai_prompts (
  prompt_code,
  prompt_scope,
  provider,
  document_type,
  version,
  name,
  description,
  system_prompt,
  user_prompt_template,
  output_format,
  is_active
)
VALUES
  (
    'DOCUMENT_LLM_CLASSIFIER',
    'DOCUMENT_LLM',
    'openai',
    NULL,
    'v1',
    'Prompt clasificador documental',
    'Prompt para determinar automaticamente el tipo documental a partir del OCR y del nombre del fichero.',
    'Eres un clasificador documental financiero. Devuelve siempre un JSON objeto valido con las claves: documentType, confidenceSummary y reasoning. documentType debe ser uno de los tipos permitidos recibidos en el contexto.',
    'Nombre de archivo: {{originalFilename}}\n\nTipo actual declarado: {{currentDocumentType}}\n\nTipos documentales permitidos: {{allowedDocumentTypes}}\n\nTexto OCR:\n{{rawText}}',
    'json_object',
    1
  ),
  (
    'DOCUMENT_LLM_DEFAULT',
    'DOCUMENT_LLM',
    'openai',
    NULL,
    'v1',
    'Prompt general de interpretacion documental',
    'Prompt general para interpretar documentos financieros cuando no existe uno especifico por tipo documental.',
    'Eres un extractor documental financiero. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary.',
    'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}',
    'json_object',
    1
  ),
  (
    'DOCUMENT_LLM_CONTRACT',
    'DOCUMENT_LLM',
    'openai',
    'CONTRACT',
    'v1',
    'Prompt de contratos',
    'Prompt especializado para contratos laborales, mercantiles o de servicios.',
    'Eres un extractor experto en contratos. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary. En extractedFields intenta identificar partes, fechas, tipo de contrato, duracion, salario u honorarios, exclusividad, noCompeteFlag y clausulas relevantes.',
    'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}',
    'json_object',
    1
  ),
  (
    'DOCUMENT_LLM_PAYSLIP',
    'DOCUMENT_LLM',
    'openai',
    'PAYSLIP',
    'v1',
    'Prompt de nominas',
    'Prompt especializado para nominas y documentos de salario.',
    'Eres un extractor experto en nominas espanolas. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary. En extractedFields intenta identificar empresa, empleado, periodo, grossAmount, netAmount, irpfWithheld, socialSecurityAmount y lineItems.',
    'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}',
    'json_object',
    1
  ),
  (
    'DOCUMENT_LLM_RECEIPT',
    'DOCUMENT_LLM',
    'openai',
    'RECEIPT',
    'v1',
    'Prompt de tickets y justificantes',
    'Prompt especializado para tickets de compra y justificantes de gasto.',
    'Eres un extractor experto en tickets y justificantes de compra. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary. En extractedFields intenta identificar vendorName, expenseDate, totalAmount, vatAmount, paymentMethod, lineItems y posibles categorias de gasto.',
    'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}',
    'json_object',
    1
  ),
  (
    'DOCUMENT_LLM_INVOICE',
    'DOCUMENT_LLM',
    'openai',
    'INVOICE',
    'v1',
    'Prompt de facturas',
    'Prompt especializado para facturas emitidas o recibidas.',
    'Eres un extractor experto en facturas. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary. En extractedFields intenta identificar invoiceNumber, issueDate, vendorName, customerName, subtotalAmount, vatAmount, totalAmount, currency y conceptos principales.',
    'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}',
    'json_object',
    1
  )
ON DUPLICATE KEY UPDATE
  prompt_scope = VALUES(prompt_scope),
  provider = VALUES(provider),
  document_type = VALUES(document_type),
  name = VALUES(name),
  description = VALUES(description),
  system_prompt = VALUES(system_prompt),
  user_prompt_template = VALUES(user_prompt_template),
  output_format = VALUES(output_format),
  is_active = VALUES(is_active);