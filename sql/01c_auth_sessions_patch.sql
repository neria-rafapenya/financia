USE financia;

CREATE TABLE IF NOT EXISTS finan_user_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  KEY idx_finan_user_sessions_user_id (user_id),
  KEY idx_finan_user_sessions_expires_at (expires_at),
  CONSTRAINT fk_finan_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;