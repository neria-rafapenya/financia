# FINANCIA — Especificación funcional y técnica

## 1. Resumen

FINANCIA es una aplicación personal para centralizar, interpretar y controlar la información financiera, laboral y fiscal de un usuario.

El objetivo no es crear una plataforma comercial genérica, sino una **herramienta personal** que permita tener trazabilidad completa sobre:

- nóminas
- contratos
- certificados de retenciones
- gastos deducibles y no deducibles
- pagos periódicos
- alquiler
- seguros
- autónomos
- documentación laboral y fiscal
- simulaciones de impacto económico y fiscal

El punto más fuerte del sistema será la **ingesta documental inteligente**:

- subida de imágenes, capturas, PDFs y documentos varios
- OCR para extraer texto y datos estructurados
- interpretación con LLM
- verificación por reglas
- clasificación documental
- trazabilidad de lo que el sistema ha entendido

La aplicación debe ayudar a responder preguntas como:

- cuánto cobro realmente cada mes
- cuánto me están reteniendo de verdad
- qué pagador me está reteniendo poco
- qué gastos son deducibles y cuáles no
- qué pagos periódicos tengo
- qué documentos tengo y cuándo vencen
- qué impacto tendría aceptar otro trabajo
- si me conviene hacerme autónomo unos meses
- cuánto debería reservar para no llevarme un susto en la renta

---

## 2. Objetivos del producto

### 2.1 Objetivo principal

Disponer de un sistema personal que unifique información económica, laboral, fiscal y documental en una sola aplicación, con capacidad de análisis asistido por IA.

### 2.2 Objetivos secundarios

- Consolidar ingresos de varios pagadores.
- Detectar retenciones insuficientes.
- Registrar y clasificar gastos.
- Diferenciar gastos deducibles, no deducibles y revisables.
- Almacenar y consultar documentación personal/laboral/fiscal.
- Analizar nóminas, contratos y certificados mediante OCR + LLM.
- Simular escenarios futuros.
- Generar alertas de riesgo o revisión.

---

## 3. Alcance funcional

### 3.1 Módulo de autenticación

Autenticación básica por usuario para uso personal.

Funciones:

- registro o alta manual inicial de usuario
- login con email y contraseña
- recuperación de contraseña
- refresh token
- gestión de sesiones
- cierre de sesión

No se orienta a multiempresa ni a perfiles comerciales complejos. Se plantea como una app de uso personal con un modelo de usuario principal.

### 3.2 Módulo de ingresos

Permite registrar, visualizar y analizar:

- nóminas
- ingresos por pagador
- ingresos extraordinarios
- ingresos por autónomo
- pagas extra
- retribución flexible
- retenciones de IRPF
- cotizaciones

Salidas:

- bruto mensual
- neto mensual
- neto anual
- retención efectiva
- comparativa por pagador
- alertas de pagadores con retención baja o nula

### 3.3 Módulo de gastos

Registro de gastos individuales y recurrentes.

Tipos de gasto:

- vivienda/alquiler
- suministros
- seguros
- salud
- gestoría
- cuotas profesionales
- transporte
- suscripciones
- autónomos
- impuestos
- gastos personales
- gastos laborales

Clasificación:

- deducible
- no deducible
- revisable
- pendiente de validar

### 3.4 Módulo de pagos periódicos

Permite modelar obligaciones recurrentes:

- alquiler
- internet
- móvil
- seguros
- gestoría
- autónomos
- suscripciones
- cuotas
- préstamos

Debe permitir:

- periodicidad mensual, trimestral, anual
- fecha estimada de cargo
- alertas de vencimiento
- previsión de caja mensual

### 3.5 Módulo documental

Repositorio central de documentación:

- nóminas
- contratos laborales
- certificados de retenciones
- alquiler
- seguros
- justificantes
- facturas
- recibos
- documentos fiscales
- capturas de pantalla
- imágenes
- PDFs

Funciones:

- subida de archivos
- etiquetado automático
- clasificación documental
- extracción de campos
- búsqueda por contenido
- vinculación a entidades del sistema
- versionado básico

### 3.6 Módulo OCR + interpretación por LLM

Este es el punto diferencial más importante del sistema.

#### Flujo general

1. El usuario sube una imagen, captura o PDF.
2. El sistema ejecuta OCR para extraer texto.
3. El texto extraído se normaliza.
4. Un LLM interpreta el documento.
5. Un motor de reglas verifica lo interpretado.
6. Se generan datos estructurados, alertas y trazabilidad.

#### Casos principales

##### Nóminas

Extracción de:

- empresa/pagador
- periodo
- bruto
- neto
- IRPF
- seguridad social
- devengos
- deducciones
- retribución flexible

##### Certificados de retenciones

Extracción de:

- pagador
- total retribuciones
- total retenciones
- ejercicio fiscal

##### Contratos

Extracción de:

- empresa
- tipo de contrato
- salario
- duración
- jornada
- exclusividad
- no competencia
- cláusulas relevantes

##### Facturas y gastos

Extracción de:

- proveedor
- fecha
- concepto
- importe
- IVA
- categoría de gasto
- posible deducibilidad

##### Recibos de alquiler y seguros

Extracción de:

- arrendador/aseguradora
- fecha
- importe
- periodicidad
- vencimiento

#### Trazabilidad requerida

El sistema debe guardar:

- texto OCR original
- JSON interpretado por LLM
- resultado final validado por reglas
- campos con confianza alta/media/baja
- observaciones o conflictos detectados

#### Principio de diseño

El LLM **interpreta**, pero no decide de forma ciega.

La decisión final debe basarse en:

- reglas verificables
- contexto de negocio
- trazabilidad documental
- posibilidad de revisión manual por el usuario

### 3.7 Módulo de contratos y relaciones laborales

Permite registrar y analizar:

- contratos actuales
- contratos pasados
- relación con pagadores
- cláusulas sensibles
- fechas de inicio/fin
- anexos y renovaciones

Alertas posibles:

- exclusividad detectada
- no competencia detectada
- vencimiento próximo
- ausencia de documento firmado

### 3.8 Módulo fiscal

Seguimiento y apoyo a la declaración, sin sustituir el cálculo oficial de la AEAT.

Funciones:

- control de ingresos por pagador
- control de retenciones
- gastos potencialmente deducibles
- gastos no deducibles
- previsión de impacto fiscal
- alertas de varios pagadores
- alertas de retención insuficiente
- agrupación por ejercicio fiscal

### 3.9 Módulo de simulación

Permite simular escenarios:

- aceptar nuevo trabajo
- cambiar porcentaje de retención
- añadir actividad de autónomo
- introducir seguro RC
- añadir pagos periódicos
- comparar varios escenarios

Resultados:

- neto mensual estimado
- coste fijo mensual estimado
- previsión de liquidez
- impacto fiscal orientativo
- alertas generadas

### 3.10 Módulo de alertas

Alertas de sistema:

- pagador con retención cero o baja
- documento vencido o próximo a vencer
- gasto sin clasificar
- contrato sin revisar
- póliza a punto de caducar
- exceso de pagos fijos
- ingresos no conciliados

---

## 4. Stack tecnológico

## 4.1 Frontend

- **React**
- **Vite**
- **TypeScript**
- React Router
- Zustand o Context API para estado de sesión y filtros
- React Query para caché y sincronización con backend
- librería de UI ligera o componentes propios

### Justificación

- encaja con el stack habitual
- velocidad de desarrollo alta
- arquitectura clara para paneles, formularios y dashboards
- buena integración con subida documental y flujos de revisión

## 4.2 Backend

- **NestJS**
- TypeScript
- arquitectura modular
- servicios y repositorios bien separados
- autenticación JWT con refresh tokens
- motor de reglas propio
- integración con servicios OCR y LLM

### Módulos backend propuestos

- AuthModule
- UsersModule
- PayersModule
- IncomesModule
- ExpensesModule
- RecurringPaymentsModule
- DocumentsModule
- ContractsModule
- TaxModule
- AlertsModule
- SimulationsModule
- OcrModule
- LlmModule
- RulesModule

## 4.3 Base de datos

- **MySQL**
- convención obligatoria de tablas con prefijo `finan_`

## 4.4 Almacenamiento de archivos

- almacenamiento local en desarrollo
- S3 compatible o almacenamiento cloud en entornos posteriores

## 4.5 OCR

Opciones posibles:

- Tesseract para pruebas iniciales
- Google Vision / AWS Textract / Azure Document Intelligence para evolución posterior

## 4.6 LLM

Uso orientado a:

- interpretación de texto OCR
- clasificación documental
- resumen de contratos
- extracción de entidades
- explicaciones de riesgos o inconsistencias

El LLM debe devolver JSON estructurado siempre que sea posible.

---

## 5. Arquitectura lógica

## 5.1 Capas

### Frontend

- presentación
- hooks/casos de uso UI
- servicios API
- store local

### Backend

- controllers
- application services
- domain services
- repositories
- integrations OCR/LLM
- rules engine

### Persistencia

- MySQL para datos estructurados
- almacenamiento de ficheros para binarios

## 5.2 Principios

- trazabilidad
- modularidad
- datos estructurados antes que texto libre
- IA como apoyo, no como única fuente de verdad
- revisión manual posible en cualquier paso sensible

---

## 6. Modelo de datos

A continuación se define una propuesta inicial de tablas MySQL. Todas las tablas usan el prefijo `finan_`.

---

## 7. Tablas MySQL

### 7.1 Usuarios y autenticación

```sql
CREATE TABLE finan_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

```sql
CREATE TABLE finan_user_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  CONSTRAINT fk_finan_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
);
```

### 7.2 Pagadores y empleadores

```sql
CREATE TABLE finan_payers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  payer_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NULL,
  payer_type ENUM('EMPLOYER','CLIENT','PUBLIC_BODY','OTHER') NOT NULL DEFAULT 'EMPLOYER',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_finan_payers_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
);
```

### 7.3 Contratos

```sql
CREATE TABLE finan_contracts (
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
  CONSTRAINT fk_finan_contracts_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id),
  CONSTRAINT fk_finan_contracts_payer
    FOREIGN KEY (payer_id) REFERENCES finan_payers(id)
);
```

### 7.4 Ingresos y nóminas

```sql
CREATE TABLE finan_income_records (
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
  CONSTRAINT fk_finan_income_records_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id),
  CONSTRAINT fk_finan_income_records_payer
    FOREIGN KEY (payer_id) REFERENCES finan_payers(id),
  CONSTRAINT fk_finan_income_records_contract
    FOREIGN KEY (contract_id) REFERENCES finan_contracts(id)
);
```

```sql
CREATE TABLE finan_payslip_lines (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  income_record_id BIGINT NOT NULL,
  line_type ENUM('EARNING','DEDUCTION','INFORMATIONAL') NOT NULL,
  concept VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_finan_payslip_lines_income_record
    FOREIGN KEY (income_record_id) REFERENCES finan_income_records(id)
);
```

### 7.5 Gastos y categorías

```sql
CREATE TABLE finan_expense_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  default_deductibility_status ENUM('DEDUCTIBLE','NON_DEDUCTIBLE','REVIEWABLE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

```sql
CREATE TABLE finan_expenses (
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
  CONSTRAINT fk_finan_expenses_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id),
  CONSTRAINT fk_finan_expenses_category
    FOREIGN KEY (category_id) REFERENCES finan_expense_categories(id),
  CONSTRAINT fk_finan_expenses_payer
    FOREIGN KEY (payer_id) REFERENCES finan_payers(id)
);
```

### 7.6 Pagos periódicos

```sql
CREATE TABLE finan_recurring_payments (
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
  CONSTRAINT fk_finan_recurring_payments_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id),
  CONSTRAINT fk_finan_recurring_payments_category
    FOREIGN KEY (category_id) REFERENCES finan_expense_categories(id)
);
```

### 7.7 Seguros

```sql
CREATE TABLE finan_insurance_policies (
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
  CONSTRAINT fk_finan_insurance_policies_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
);
```

### 7.8 Alquileres

```sql
CREATE TABLE finan_rentals (
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
  CONSTRAINT fk_finan_rentals_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
);
```

### 7.9 Documentos

```sql
CREATE TABLE finan_documents (
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
  CONSTRAINT fk_finan_documents_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
);
```

### 7.10 OCR y resultados LLM

```sql
CREATE TABLE finan_document_ocr_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT NOT NULL,
  ocr_provider VARCHAR(100) NOT NULL,
  raw_text LONGTEXT NOT NULL,
  confidence_score DECIMAL(5,2) NULL,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_finan_document_ocr_results_document
    FOREIGN KEY (document_id) REFERENCES finan_documents(id)
);
```

```sql
CREATE TABLE finan_document_llm_results (
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
  CONSTRAINT fk_finan_document_llm_results_document
    FOREIGN KEY (document_id) REFERENCES finan_documents(id),
  CONSTRAINT fk_finan_document_llm_results_ocr
    FOREIGN KEY (ocr_result_id) REFERENCES finan_document_ocr_results(id)
);
```

```sql
CREATE TABLE finan_document_field_values (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT NULL,
  source ENUM('OCR','LLM','RULE','MANUAL') NOT NULL,
  confidence_level ENUM('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_finan_document_field_values_document
    FOREIGN KEY (document_id) REFERENCES finan_documents(id)
);
```

### 7.11 Reglas y validación

```sql
CREATE TABLE finan_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  rule_scope ENUM('DOCUMENT','EXPENSE','INCOME','TAX','CONTRACT','ALERT') NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

```sql
CREATE TABLE finan_rule_executions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_id BIGINT NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id BIGINT NOT NULL,
  execution_result ENUM('PASS','FAIL','WARNING','INFO') NOT NULL,
  execution_message TEXT NULL,
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_finan_rule_executions_rule
    FOREIGN KEY (rule_id) REFERENCES finan_rules(id)
);
```

### 7.12 Alertas

```sql
CREATE TABLE finan_alerts (
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
  CONSTRAINT fk_finan_alerts_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
);
```

### 7.13 Simulaciones

```sql
CREATE TABLE finan_simulations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  simulation_type ENUM('NEW_JOB','RETENTION_CHANGE','FREELANCE_PERIOD','NEW_RECURRING_COST','CUSTOM') NOT NULL,
  input_payload JSON NOT NULL,
  result_payload JSON NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_finan_simulations_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
);
```

### 7.14 Ejercicios fiscales

```sql
CREATE TABLE finan_tax_years (
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
  CONSTRAINT uq_finan_tax_years_user_year UNIQUE (user_id, fiscal_year),
  CONSTRAINT fk_finan_tax_years_user
    FOREIGN KEY (user_id) REFERENCES finan_users(id)
);
```

---

## 8. Relaciones principales

- `finan_users` 1:N `finan_payers`
- `finan_users` 1:N `finan_contracts`
- `finan_users` 1:N `finan_income_records`
- `finan_users` 1:N `finan_expenses`
- `finan_users` 1:N `finan_documents`
- `finan_users` 1:N `finan_alerts`
- `finan_users` 1:N `finan_simulations`
- `finan_payers` 1:N `finan_income_records`
- `finan_contracts` 1:N `finan_income_records`
- `finan_documents` 1:N `finan_document_ocr_results`
- `finan_documents` 1:N `finan_document_llm_results`
- `finan_documents` 1:N `finan_document_field_values`

---

## 9. Flujos principales

### 9.1 Flujo de subida de nómina

1. El usuario sube una imagen o PDF.
2. Se crea registro en `finan_documents`.
3. Se ejecuta OCR y se guarda en `finan_document_ocr_results`.
4. El LLM interpreta y devuelve JSON.
5. Se guarda en `finan_document_llm_results`.
6. Se normalizan campos en `finan_document_field_values`.
7. Reglas verifican incoherencias.
8. Se propone crear o actualizar un `finan_income_record`.
9. Se genera alerta si la retención es anómala.

### 9.2 Flujo de gasto deducible/no deducible

1. El usuario registra un gasto o sube una factura.
2. OCR/LLM extraen concepto e importe.
3. El motor de clasificación propone categoría.
4. El motor de reglas marca estado inicial de deducibilidad.
5. El usuario puede validar o corregir.

### 9.3 Flujo de contrato

1. El usuario sube contrato.
2. OCR/LLM interpretan cláusulas.
3. Se detectan campos relevantes.
4. Se crean alertas si hay exclusividad, no competencia o vencimiento.

---

## 10. Reglas iniciales sugeridas

Ejemplos de reglas a implementar:

- Si un pagador tiene ingresos y retenciones 0, generar alerta de severidad alta.
- Si hay más de un pagador en el mismo ejercicio, marcar revisión fiscal.
- Si un gasto viene como seguro médico pagado por empresa, marcar como no deducible directo por duplicidad potencial.
- Si un documento es contrato y contiene palabras clave de exclusividad, marcar revisión laboral.
- Si una póliza vence en menos de 30 días, generar alerta.
- Si un gasto recurrente supera cierto umbral del ingreso neto mensual, generar alerta de carga fija alta.

---

## 11. API backend propuesta

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Payers

- `GET /payers`
- `POST /payers`
- `PUT /payers/:id`
- `DELETE /payers/:id`

### Contracts

- `GET /contracts`
- `POST /contracts`
- `PUT /contracts/:id`
- `GET /contracts/:id`

### Incomes

- `GET /incomes`
- `POST /incomes`
- `PUT /incomes/:id`
- `GET /incomes/summary`

### Expenses

- `GET /expenses`
- `POST /expenses`
- `PUT /expenses/:id`
- `GET /expenses/summary`

### Recurring payments

- `GET /recurring-payments`
- `POST /recurring-payments`
- `PUT /recurring-payments/:id`

### Documents

- `POST /documents/upload`
- `GET /documents`
- `GET /documents/:id`
- `POST /documents/:id/process-ocr`
- `POST /documents/:id/process-llm`
- `POST /documents/:id/verify`

### Alerts

- `GET /alerts`
- `PUT /alerts/:id/read`
- `PUT /alerts/:id/resolve`

### Simulations

- `GET /simulations`
- `POST /simulations`
- `GET /simulations/:id`

---

## 12. Pantallas frontend sugeridas

- Login
- Dashboard
- Ingresos
- Detalle de pagador
- Nóminas
- Gastos
- Pagos periódicos
- Documentos
- Visor de documento con OCR/LLM
- Contratos
- Seguros
- Alquiler
- Alertas
- Simulador
- Configuración de usuario

---

## 13. Roadmap sugerido

## Fase 1 — MVP estructural

- autenticación
- usuarios
- pagadores
- ingresos manuales
- gastos manuales
- pagos periódicos
- documentos básicos
- dashboard
- alertas simples

## Fase 2 — OCR documental

- OCR de imágenes y PDFs
- extracción de campos de nómina
- extracción de campos de facturas
- visor documental

## Fase 3 — LLM + verificación

- interpretación de nóminas y contratos
- trazabilidad OCR + LLM
- reglas de validación
- propuestas automáticas de clasificación

## Fase 4 — Simulación y previsión

- simulador de escenarios
- estimaciones de impacto fiscal
- alertas preventivas avanzadas

---

## 14. Decisiones clave de diseño

1. **La fuente documental es central**.
   La app no será solo un gestor manual de gastos, sino un sistema que entiende documentos.

2. **OCR + LLM es una capacidad nuclear**.
   Es obligatorio diseñar el sistema para conservar:
   - binario original
   - texto OCR
   - salida LLM
   - verificación final

3. **Las reglas mandan sobre la automatización opaca**.
   El LLM interpreta, pero el sistema debe poder explicar por qué clasificó algo de una determinada forma.

4. **Uso personal, no enfoque masivo**.
   No se priorizan roles empresariales complejos ni una comercialización amplia en el diseño inicial.

5. **Prefijo `finan_` obligatorio**.
   Todas las tablas, convenciones y módulos de persistencia deben respetarlo.

---

## 15. Próximos pasos recomendados

1. Convertir esta especificación en backlog técnico.
2. Crear estructura inicial del monorepo:
   - frontend React + Vite + TypeScript
   - backend NestJS
3. Montar esquema MySQL inicial con tablas `finan_`.
4. Implementar autenticación y CRUD base.
5. Implementar subida documental.
6. Integrar OCR.
7. Integrar pipeline LLM con JSON estructurado.
8. Construir panel de revisión documental.

---

## 16. Conclusión

FINAN debe concebirse como una herramienta personal de control financiero, laboral, fiscal y documental, con un núcleo fuerte de interpretación inteligente de documentos.

Su mayor valor no estará solo en almacenar datos, sino en:

- entender nóminas
- detectar problemas de retención
- clasificar gastos
- centralizar contratos y pólizas
- anticipar impactos fiscales
- responder preguntas prácticas con trazabilidad

La combinación de **NestJS + React Vite TypeScript + MySQL + OCR + LLM** es adecuada para construir una primera versión sólida, extensible y alineada con este objetivo.

Crremos variables de entorno con .env en backend y en frontend
