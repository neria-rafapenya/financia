USE financia;

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