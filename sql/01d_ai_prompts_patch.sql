USE financia;

CREATE TABLE IF NOT EXISTS finan_ai_prompts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  prompt_code VARCHAR(100) NOT NULL,
  prompt_scope ENUM('DOCUMENT_OCR','DOCUMENT_LLM') NOT NULL,
  provider VARCHAR(100) NOT NULL,
  document_type VARCHAR(100) NULL,
  version VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  system_prompt LONGTEXT NOT NULL,
  user_prompt_template LONGTEXT NOT NULL,
  output_format VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_finan_ai_prompts_code_version (prompt_code, version),
  KEY idx_finan_ai_prompts_lookup (prompt_scope, provider, document_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;