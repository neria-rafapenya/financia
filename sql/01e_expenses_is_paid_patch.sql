USE financia;

ALTER TABLE finan_expenses
  ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 1
  AFTER vat_amount;

-- Normalizacion inicial recomendada:
-- los gastos manuales historicos pasan a pendiente de pago por defecto,
-- mientras que OCR/LLM/IMPORT quedan pagados al asumir que vienen de un cargo ya realizado.
UPDATE finan_expenses
SET is_paid = CASE
  WHEN source_type = 'MANUAL' THEN 0
  ELSE 1
END;

-- Opcional: marca como pagados los historicos manuales que ya sabes que estaban abonados.
-- Descomenta y ajusta segun tus criterios reales.

-- UPDATE finan_expenses
-- SET is_paid = 1
-- WHERE source_type = 'MANUAL'
--   AND concept LIKE '%alquiler%';

-- UPDATE finan_expenses
-- SET is_paid = 1
-- WHERE source_type = 'MANUAL'
--   AND concept LIKE '%suscrip%';

-- UPDATE finan_expenses
-- SET is_paid = 1
-- WHERE source_type = 'MANUAL'
--   AND expense_date < '2026-01-01';