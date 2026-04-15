CREATE DATABASE IF NOT EXISTS financia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE financia;

CREATE TABLE IF NOT EXISTS finan_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_user_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  tax_id VARCHAR(20) NULL,
  social_security_number VARCHAR(32) NULL,
  address_line_1 VARCHAR(255) NULL,
  address_line_2 VARCHAR(255) NULL,
  postal_code VARCHAR(20) NULL,
  city VARCHAR(100) NULL,
  province VARCHAR(100) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Spain',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_finan_user_profiles_user_id (user_id),
  CONSTRAINT fk_finan_user_profiles_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_expense_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  default_deductibility_status ENUM('DEDUCTIBLE','NON_DEDUCTIBLE','REVIEWABLE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  rule_scope ENUM('DOCUMENT','EXPENSE','INCOME','TAX','CONTRACT','ALERT') NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_payers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  payer_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NULL,
  payer_type ENUM('EMPLOYER','CLIENT','PUBLIC_BODY','OTHER') NOT NULL DEFAULT 'EMPLOYER',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_payers_user_id (user_id),
  CONSTRAINT fk_finan_payers_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_contracts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  payer_id BIGINT NULL,
  contract_type ENUM('EMPLOYMENT','FREELANCE','RENTAL','INSURANCE','OTHER') NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  gross_salary_monthly DECIMAL(12,2) NULL,
  net_salary_monthly DECIMAL(12,2) NULL,
  exclusivity_flag TINYINT(1) NOT NULL DEFAULT 0,
  non_compete_flag TINYINT(1) NOT NULL DEFAULT 0,
  workday_type ENUM('FULL_TIME','PART_TIME','OTHER') NULL,
  status ENUM('ACTIVE','INACTIVE','EXPIRED','DRAFT') NOT NULL DEFAULT 'ACTIVE',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_contracts_user_id (user_id),
  KEY idx_finan_contracts_payer_id (payer_id),
  CONSTRAINT fk_finan_contracts_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id),
  CONSTRAINT fk_finan_contracts_payer
    FOREIGN KEY (payer_id) REFERENCES finan_payers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_income_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  payer_id BIGINT NOT NULL,
  contract_id BIGINT NULL,
  income_type ENUM('PAYSLIP','BONUS','FREELANCE_INVOICE','RETENTION_CERTIFICATE','OTHER') NOT NULL,
  period_year INT NOT NULL,
  period_month INT NULL,
  gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NULL,
  irpf_withheld DECIMAL(12,2) NULL,
  social_security_amount DECIMAL(12,2) NULL,
  flexible_compensation_amount DECIMAL(12,2) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_income_records_user_id (user_id),
  KEY idx_finan_income_records_payer_id (payer_id),
  KEY idx_finan_income_records_contract_id (contract_id),
  CONSTRAINT fk_finan_income_records_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id),
  CONSTRAINT fk_finan_income_records_payer
    FOREIGN KEY (payer_id) REFERENCES finan_payers(id),
  CONSTRAINT fk_finan_income_records_contract
    FOREIGN KEY (contract_id) REFERENCES finan_contracts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_payslip_lines (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  income_record_id BIGINT NOT NULL,
  line_type ENUM('EARNING','DEDUCTION','INFORMATIONAL') NOT NULL,
  concept VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_finan_payslip_lines_income_record_id (income_record_id),
  CONSTRAINT fk_finan_payslip_lines_income_record
    FOREIGN KEY (income_record_id) REFERENCES finan_income_records(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_expenses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  category_id BIGINT NULL,
  payer_id BIGINT NULL,
  expense_date DATE NOT NULL,
  concept VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL,
  vat_amount DECIMAL(12,2) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  source_type ENUM('MANUAL','OCR','LLM','IMPORT') NOT NULL DEFAULT 'MANUAL',
  deductibility_status ENUM('DEDUCTIBLE','NON_DEDUCTIBLE','REVIEWABLE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  business_use_percent DECIMAL(5,2) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_expenses_user_id (user_id),
  KEY idx_finan_expenses_category_id (category_id),
  KEY idx_finan_expenses_payer_id (payer_id),
  CONSTRAINT fk_finan_expenses_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id),
  CONSTRAINT fk_finan_expenses_category
    FOREIGN KEY (category_id) REFERENCES finan_expense_categories(id),
  CONSTRAINT fk_finan_expenses_payer
    FOREIGN KEY (payer_id) REFERENCES finan_payers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_recurring_payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  category_id BIGINT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency ENUM('MONTHLY','QUARTERLY','BIANNUAL','YEARLY') NOT NULL,
  next_due_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  deductibility_status ENUM('DEDUCTIBLE','NON_DEDUCTIBLE','REVIEWABLE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_recurring_payments_user_id (user_id),
  KEY idx_finan_recurring_payments_category_id (category_id),
  CONSTRAINT fk_finan_recurring_payments_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id),
  CONSTRAINT fk_finan_recurring_payments_category
    FOREIGN KEY (category_id) REFERENCES finan_expense_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_insurance_policies (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  policy_type ENUM('HEALTH','LIABILITY','HOME','LIFE','AUTO','OTHER') NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  policy_number VARCHAR(100) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  monthly_cost DECIMAL(12,2) NULL,
  annual_cost DECIMAL(12,2) NULL,
  coverage_summary TEXT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_insurance_policies_user_id (user_id),
  CONSTRAINT fk_finan_insurance_policies_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_rentals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(100) NULL,
  region VARCHAR(100) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Spain',
  monthly_rent DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  landlord_name VARCHAR(255) NULL,
  landlord_tax_id VARCHAR(50) NULL,
  is_primary_home TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_rentals_user_id (user_id),
  CONSTRAINT fk_finan_rentals_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_documents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  document_type ENUM(
    'PAYSLIP',
    'RETENTION_CERTIFICATE',
    'CONTRACT',
    'INVOICE',
    'RECEIPT',
    'RENTAL_DOCUMENT',
    'INSURANCE_DOCUMENT',
    'TAX_DOCUMENT',
    'SCREENSHOT',
    'OTHER'
  ) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT NULL,
  document_date DATE NULL,
  status ENUM('UPLOADED','OCR_PROCESSED','LLM_PROCESSED','VERIFIED','ERROR') NOT NULL DEFAULT 'UPLOADED',
  linked_entity_type VARCHAR(100) NULL,
  linked_entity_id BIGINT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_documents_user_id (user_id),
  CONSTRAINT fk_finan_documents_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_document_ocr_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT NOT NULL,
  ocr_provider VARCHAR(100) NOT NULL,
  raw_text LONGTEXT NOT NULL,
  confidence_score DECIMAL(5,2) NULL,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_finan_document_ocr_results_document_id (document_id),
  CONSTRAINT fk_finan_document_ocr_results_document
    FOREIGN KEY (document_id) REFERENCES finan_documents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_document_llm_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT NOT NULL,
  ocr_result_id BIGINT NULL,
  llm_provider VARCHAR(100) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  prompt_version VARCHAR(50) NULL,
  raw_response LONGTEXT NOT NULL,
  parsed_json JSON NULL,
  confidence_summary VARCHAR(50) NULL,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_finan_document_llm_results_document_id (document_id),
  KEY idx_finan_document_llm_results_ocr_result_id (ocr_result_id),
  CONSTRAINT fk_finan_document_llm_results_document
    FOREIGN KEY (document_id) REFERENCES finan_documents(id),
  CONSTRAINT fk_finan_document_llm_results_ocr
    FOREIGN KEY (ocr_result_id) REFERENCES finan_document_ocr_results(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_document_field_values (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT NULL,
  source ENUM('OCR','LLM','RULE','MANUAL') NOT NULL,
  confidence_level ENUM('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_document_field_values_document_id (document_id),
  CONSTRAINT fk_finan_document_field_values_document
    FOREIGN KEY (document_id) REFERENCES finan_documents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_rule_executions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_id BIGINT NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id BIGINT NOT NULL,
  execution_result ENUM('PASS','FAIL','WARNING','INFO') NOT NULL,
  execution_message TEXT NULL,
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_finan_rule_executions_rule_id (rule_id),
  CONSTRAINT fk_finan_rule_executions_rule
    FOREIGN KEY (rule_id) REFERENCES finan_rules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  alert_type ENUM('RETENTION','DOCUMENT','CONTRACT','PAYMENT','TAX','SYSTEM') NOT NULL,
  severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  linked_entity_type VARCHAR(100) NULL,
  linked_entity_id BIGINT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_resolved TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  KEY idx_finan_alerts_user_id (user_id),
  CONSTRAINT fk_finan_alerts_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_simulations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  simulation_type ENUM('NEW_JOB','RETENTION_CHANGE','FREELANCE_PERIOD','NEW_RECURRING_COST','CUSTOM') NOT NULL,
  input_payload JSON NOT NULL,
  result_payload JSON NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_finan_simulations_user_id (user_id),
  CONSTRAINT fk_finan_simulations_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finan_tax_years (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  fiscal_year INT NOT NULL,
  total_work_income DECIMAL(12,2) NULL,
  total_irpf_withheld DECIMAL(12,2) NULL,
  total_deductible_expenses DECIMAL(12,2) NULL,
  total_non_deductible_expenses DECIMAL(12,2) NULL,
  estimated_tax_result DECIMAL(12,2) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_finan_tax_years_user_year (user_id, fiscal_year),
  CONSTRAINT fk_finan_tax_years_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;