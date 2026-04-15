USE financia;

INSERT INTO finan_users (email, password_hash, full_name, is_active)
VALUES (
  'rafa@rafapenya.com',
  SHA2('JRK441e22', 256),
  'Rafa Pena',
  1
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  is_active = VALUES(is_active);

INSERT INTO finan_user_profiles (
  user_id,
  tax_id,
  social_security_number,
  address_line_1,
  address_line_2,
  postal_code,
  city,
  province,
  country
)
SELECT
  user_record.id,
  '43735032A',
  '25/00484240/73',
  'C/ Velazquez 2',
  '1-7',
  '43830',
  'Torredembarra',
  'Tarragona',
  'Spain'
FROM finan_users AS user_record
WHERE user_record.email = 'rafa@rafapenya.com'
ON DUPLICATE KEY UPDATE
  tax_id = VALUES(tax_id),
  social_security_number = VALUES(social_security_number),
  address_line_1 = VALUES(address_line_1),
  address_line_2 = VALUES(address_line_2),
  postal_code = VALUES(postal_code),
  city = VALUES(city),
  province = VALUES(province),
  country = VALUES(country);

INSERT INTO finan_payers (
  user_id,
  payer_name,
  tax_id,
  payer_type,
  notes
)
SELECT
  user_record.id,
  'TECNOLOGIAS PLEXUS S.L.',
  'B15726177',
  'EMPLOYER',
  'CCC 08/2112996/71. CL Isidro Parga Pondal LOC, 15890 Santiago de Compostela, A Coruna.'
FROM finan_users AS user_record
WHERE user_record.email = 'rafa@rafapenya.com'
  AND NOT EXISTS (
    SELECT 1
    FROM finan_payers AS existing_payer
    WHERE existing_payer.user_id = user_record.id
      AND existing_payer.tax_id = 'B15726177'
  );

INSERT INTO finan_income_records (
  user_id,
  payer_id,
  contract_id,
  income_type,
  period_year,
  period_month,
  gross_amount,
  net_amount,
  irpf_withheld,
  social_security_amount,
  flexible_compensation_amount,
  notes
)
SELECT
  user_record.id,
  payer_record.id,
  NULL,
  'PAYSLIP',
  income_seed.period_year,
  income_seed.period_month,
  income_seed.gross_amount,
  income_seed.net_amount,
  income_seed.irpf_withheld,
  income_seed.social_security_amount,
  income_seed.flexible_compensation_amount,
  income_seed.notes
FROM finan_users AS user_record
INNER JOIN finan_payers AS payer_record
  ON payer_record.user_id = user_record.id
  AND payer_record.tax_id = 'B15726177'
INNER JOIN (
  SELECT 2026 AS period_year, 1 AS period_month, 3200.00 AS gross_amount, 2528.00 AS net_amount, 410.00 AS irpf_withheld, 262.00 AS social_security_amount, 0.00 AS flexible_compensation_amount, 'Nomina de prueba enero 2026' AS notes
  UNION ALL
  SELECT 2026, 2, 3200.00, 2528.00, 410.00, 262.00, 0.00, 'Nomina de prueba febrero 2026'
  UNION ALL
  SELECT 2026, 3, 3250.00, 2560.50, 420.50, 269.00, 0.00, 'Nomina de prueba marzo 2026'
) AS income_seed
WHERE user_record.email = 'rafa@rafapenya.com'
  AND NOT EXISTS (
    SELECT 1
    FROM finan_income_records AS existing_income
    WHERE existing_income.user_id = user_record.id
      AND existing_income.payer_id = payer_record.id
      AND existing_income.income_type = 'PAYSLIP'
      AND existing_income.period_year = income_seed.period_year
      AND existing_income.period_month = income_seed.period_month
  );