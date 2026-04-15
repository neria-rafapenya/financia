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