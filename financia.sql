-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 19-04-2026 a las 21:57:33
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `financia`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_ai_prompts`
--

CREATE TABLE `finan_ai_prompts` (
  `id` bigint(20) NOT NULL,
  `prompt_code` varchar(100) NOT NULL,
  `prompt_scope` enum('DOCUMENT_OCR','DOCUMENT_LLM') NOT NULL,
  `provider` varchar(100) NOT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `version` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `system_prompt` longtext NOT NULL,
  `user_prompt_template` longtext NOT NULL,
  `output_format` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_ai_prompts`
--

INSERT INTO `finan_ai_prompts` (`id`, `prompt_code`, `prompt_scope`, `provider`, `document_type`, `version`, `name`, `description`, `system_prompt`, `user_prompt_template`, `output_format`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DOCUMENT_LLM_DEFAULT', 'DOCUMENT_LLM', 'openai', NULL, 'v1', 'Prompt general de interpretacion documental', 'Prompt general para interpretar documentos financieros cuando no existe uno especifico por tipo documental.', 'Eres un extractor documental financiero. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary.', 'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}', 'json_object', 1, '2026-04-15 15:21:55', '2026-04-15 15:21:55'),
(2, 'DOCUMENT_LLM_PAYSLIP', 'DOCUMENT_LLM', 'openai', 'PAYSLIP', 'v1', 'Prompt de nominas', 'Prompt especializado para nominas y documentos de salario.', 'Eres un extractor experto en nominas espanolas. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary. En extractedFields intenta identificar empresa, empleado, periodo, grossAmount, netAmount, irpfWithheld, socialSecurityAmount y lineItems.', 'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}', 'json_object', 1, '2026-04-15 15:21:55', '2026-04-15 15:21:55'),
(3, 'DOCUMENT_LLM_CLASSIFIER', 'DOCUMENT_LLM', 'openai', NULL, 'v1', 'Prompt clasificador documental', 'Prompt para determinar automaticamente el tipo documental a partir del OCR y del nombre del fichero.', 'Eres un clasificador documental financiero. Devuelve siempre un JSON objeto valido con las claves: documentType, confidenceSummary y reasoning. documentType debe ser uno de los tipos permitidos recibidos en el contexto.', 'Nombre de archivo: {{originalFilename}}\n\nTipo actual declarado: {{currentDocumentType}}\n\nTipos documentales permitidos: {{allowedDocumentTypes}}\n\nTexto OCR:\n{{rawText}}', 'json_object', 1, '2026-04-15 20:33:29', '2026-04-15 20:33:29'),
(4, 'DOCUMENT_LLM_CONTRACT', 'DOCUMENT_LLM', 'openai', 'CONTRACT', 'v1', 'Prompt de contratos', 'Prompt especializado para contratos laborales, mercantiles o de servicios.', 'Eres un extractor experto en contratos. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary. En extractedFields intenta identificar partes, fechas, tipo de contrato, duracion, salario u honorarios, exclusividad, noCompeteFlag y clausulas relevantes.', 'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}', 'json_object', 1, '2026-04-15 20:33:29', '2026-04-15 20:33:29'),
(5, 'DOCUMENT_LLM_RECEIPT', 'DOCUMENT_LLM', 'openai', 'RECEIPT', 'v1', 'Prompt de tickets y justificantes', 'Prompt especializado para tickets de compra y justificantes de gasto.', 'Eres un extractor experto en tickets y justificantes de compra. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary. En extractedFields intenta identificar vendorName, expenseDate, totalAmount, vatAmount, paymentMethod, lineItems y posibles categorias de gasto.', 'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}', 'json_object', 1, '2026-04-15 20:33:29', '2026-04-15 20:33:29'),
(6, 'DOCUMENT_LLM_INVOICE', 'DOCUMENT_LLM', 'openai', 'INVOICE', 'v1', 'Prompt de facturas', 'Prompt especializado para facturas emitidas o recibidas.', 'Eres un extractor experto en facturas. Devuelve siempre un JSON objeto valido con las claves: documentType, summary, extractedFields, detectedIssues y confidenceSummary. En extractedFields intenta identificar invoiceNumber, issueDate, vendorName, customerName, subtotalAmount, vatAmount, totalAmount, currency y conceptos principales.', 'Tipo documental: {{documentType}}\n\nNombre de archivo: {{originalFilename}}\n\n{{instructionsBlock}}Texto OCR:\n{{rawText}}', 'json_object', 1, '2026-04-15 20:33:29', '2026-04-15 20:33:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_alerts`
--

CREATE TABLE `finan_alerts` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `alert_type` enum('RETENTION','DOCUMENT','CONTRACT','PAYMENT','TAX','SYSTEM') NOT NULL,
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `linked_entity_type` varchar(100) DEFAULT NULL,
  `linked_entity_id` bigint(20) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `is_resolved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `resolved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_contracts`
--

CREATE TABLE `finan_contracts` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `payer_id` bigint(20) DEFAULT NULL,
  `contract_type` enum('EMPLOYMENT','FREELANCE','RENTAL','INSURANCE','OTHER') NOT NULL,
  `title` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `gross_salary_monthly` decimal(12,2) DEFAULT NULL,
  `net_salary_monthly` decimal(12,2) DEFAULT NULL,
  `exclusivity_flag` tinyint(1) NOT NULL DEFAULT 0,
  `non_compete_flag` tinyint(1) NOT NULL DEFAULT 0,
  `workday_type` enum('FULL_TIME','PART_TIME','OTHER') DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','EXPIRED','DRAFT') NOT NULL DEFAULT 'ACTIVE',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_documents`
--

CREATE TABLE `finan_documents` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `document_type` enum('PAYSLIP','RETENTION_CERTIFICATE','CONTRACT','INVOICE','RECEIPT','RENTAL_DOCUMENT','INSURANCE_DOCUMENT','TAX_DOCUMENT','SCREENSHOT','OTHER') NOT NULL,
  `display_label` varchar(255) DEFAULT NULL,
  `original_filename` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `file_size_bytes` bigint(20) DEFAULT NULL,
  `document_date` date DEFAULT NULL,
  `status` enum('UPLOADED','OCR_PROCESSED','LLM_PROCESSED','VERIFIED','ERROR') NOT NULL DEFAULT 'UPLOADED',
  `linked_entity_type` varchar(100) DEFAULT NULL,
  `linked_entity_id` bigint(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_documents`
--

INSERT INTO `finan_documents` (`id`, `user_id`, `document_type`, `display_label`, `original_filename`, `mime_type`, `storage_path`, `file_size_bytes`, `document_date`, `status`, `linked_entity_type`, `linked_entity_id`, `notes`, `created_at`, `updated_at`) VALUES
(10, 1, 'PAYSLIP', '[Nómina] WAD del 01 al 31 de enero de 2026', 'noÌminas 01.pdf', 'application/pdf', 'storage/documents/1/2026/04/5c03b38b-1b63-4187-8f6f-5da88acbb709.pdf', 11936, NULL, 'LLM_PROCESSED', 'PAYER', 2, NULL, '2026-04-16 23:01:01', '2026-04-17 22:51:16'),
(11, 1, 'PAYSLIP', '[Nómina] WAD del 01 al 28 de febrero de 2026', 'noÌminas 02.pdf', 'application/pdf', 'storage/documents/1/2026/04/0b816848-0d02-4afd-b7be-d304bcda0e09.pdf', 11941, NULL, 'LLM_PROCESSED', 'PAYER', 2, NULL, '2026-04-16 23:30:30', '2026-04-17 22:51:23'),
(12, 1, 'PAYSLIP', '[Nómina] WAD del 01 al 31 de marzo de 2026', 'noÌminas 03.pdf', 'application/pdf', 'storage/documents/1/2026/04/39df0dbf-ffab-4bed-a369-cec283a5fcab.pdf', 11949, NULL, 'LLM_PROCESSED', 'PAYER', 2, NULL, '2026-04-16 23:31:02', '2026-04-17 22:51:30'),
(13, 1, 'PAYSLIP', '[Nómina] PLEXUS diciembre de 2025', 'e_01_xmd_00_plx_plx05174.pdf', 'application/pdf', 'storage/documents/1/2026/04/bef603ea-a9d8-4a7d-8b25-d66f023b5b32.pdf', 20998, '2025-12-01', 'LLM_PROCESSED', 'PAYER', 1, NULL, '2026-04-16 23:31:59', '2026-04-17 22:51:36'),
(14, 1, 'INVOICE', NULL, 'facturaficticia.pdf', 'application/pdf', 'storage/documents/1/2026/04/c4727c5b-dc1b-4c64-907f-0c849e2de097.pdf', 38804, NULL, 'LLM_PROCESSED', 'PAYER', 3, NULL, '2026-04-17 14:49:42', '2026-04-17 15:17:08'),
(15, 1, 'OTHER', '[Documento] Vida Laboral 31 de marzo de 2026', 'vida_laboral.pdf', 'application/pdf', 'storage/documents/1/2026/04/2af48389-3c7d-4e48-9abd-bff837afb988.pdf', 150766, '2026-03-31', 'LLM_PROCESSED', NULL, NULL, NULL, '2026-04-17 20:26:42', '2026-04-17 22:51:50'),
(16, 1, 'OTHER', '[Documento] ABANCA Cuadro amortización abril de 2026', 'CUADRO AMORTIZACION.pdf', 'application/pdf', 'storage/documents/1/2026/04/6bfc9f2d-557c-488c-8754-1373303eb21a.pdf', 13403, '2026-03-31', 'LLM_PROCESSED', NULL, NULL, NULL, '2026-04-17 20:28:46', '2026-04-17 22:52:03'),
(18, 1, 'RECEIPT', '[Ticket o justificante] Taxi Madrid 25/03/2026', 'IMG_20260417_204101.jpg', 'image/jpeg', 'storage/documents/1/2026/04/339e0474-cfe4-459e-91b8-ed2ccb489f64.jpg', 2573247, '2026-03-25', 'LLM_PROCESSED', 'PAYER', 3, NULL, '2026-04-17 20:44:06', '2026-04-19 15:57:28'),
(24, 1, 'INVOICE', '[Factura] Dental Donoso 03/07/2025', '1_IMG_20260419_172445.jpg', 'image/jpeg', 'cloudinary:image:gestor-financia-ai/1_IMG_20260419_172445-8c20d7b3-9ec1-422b-82bf-5b7a66616ee9', 1841937, '2025-07-03', 'LLM_PROCESSED', NULL, NULL, NULL, '2026-04-19 18:54:11', '2026-04-19 18:55:14'),
(25, 1, 'RECEIPT', '[Ticket o justificante] Optica Universitaria 01/12/2025', '2_IMG_20260419_172416.jpg', 'image/jpeg', 'cloudinary:image:gestor-financia-ai/2_IMG_20260419_172416-e787bc9f-150e-44e0-9b27-66a5a8c34271', 2362785, '2025-12-01', 'LLM_PROCESSED', NULL, NULL, NULL, '2026-04-19 18:57:13', '2026-04-19 18:57:59'),
(26, 1, 'RECEIPT', '[Ticket o justificante] Optica Universitaria 01/12/2025', '3_IMG_20260419_172406.jpg', 'image/jpeg', 'cloudinary:image:gestor-financia-ai/3_IMG_20260419_172406-78841105-8cd5-42af-977c-2988b73e9d06', 1799902, '2025-12-01', 'LLM_PROCESSED', NULL, NULL, NULL, '2026-04-19 18:59:09', '2026-04-19 19:00:03'),
(27, 1, 'INVOICE', '[Factura] Óptica Universitaria  25/11/2025', '4_IMG_20260419_172340.jpg', 'image/jpeg', 'cloudinary:image:gestor-financia-ai/4_IMG_20260419_172340-dab9f94d-cab7-4102-aae4-83f1f69cb571', 2332807, '2025-11-25', 'LLM_PROCESSED', NULL, NULL, NULL, '2026-04-19 19:00:18', '2026-04-19 19:00:53'),
(28, 1, 'INVOICE', '[Factura] Óptica & Audiología 25/11/2025', '5_IMG_20260419_172332.jpg', 'image/jpeg', 'cloudinary:image:gestor-financia-ai/5_IMG_20260419_172332-43f23ac7-d666-4b8e-a651-eb37610a130b', 2215041, '2025-11-25', 'LLM_PROCESSED', NULL, NULL, NULL, '2026-04-19 19:01:05', '2026-04-19 19:01:35'),
(29, 1, 'OTHER', '[Documento] ABANCA Servicios Financieros 14/11/2024', '6_IMG_20260419_172304.jpg', 'image/jpeg', 'cloudinary:image:gestor-financia-ai/6_IMG_20260419_172304-a619824b-342f-41f4-80cb-e51aeb27aa5d', 2177593, '2024-11-14', 'LLM_PROCESSED', NULL, NULL, NULL, '2026-04-19 19:01:58', '2026-04-19 19:02:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_document_field_values`
--

CREATE TABLE `finan_document_field_values` (
  `id` bigint(20) NOT NULL,
  `document_id` bigint(20) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `field_value` text DEFAULT NULL,
  `source` enum('OCR','LLM','RULE','MANUAL') NOT NULL,
  `confidence_level` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_document_field_values`
--

INSERT INTO `finan_document_field_values` (`id`, `document_id`, `field_name`, `field_value`, `source`, `confidence_level`, `is_verified`, `created_at`, `updated_at`) VALUES
(9, 14, 'invoiceNumber', '098737726', 'LLM', 'HIGH', 0, '2026-04-17 15:17:08', '2026-04-17 15:17:08'),
(10, 14, 'issueDate', '16/4/26', 'LLM', 'HIGH', 0, '2026-04-17 15:17:08', '2026-04-17 15:17:08'),
(11, 14, 'vendorName', 'Rafa Peña Vargas', 'LLM', 'HIGH', 0, '2026-04-17 15:17:08', '2026-04-17 15:17:08'),
(12, 14, 'customerName', 'SABALA SA', 'LLM', 'HIGH', 0, '2026-04-17 15:17:08', '2026-04-17 15:17:08'),
(13, 14, 'subtotalAmount', '7.920,00', 'LLM', 'HIGH', 0, '2026-04-17 15:17:08', '2026-04-17 15:17:08'),
(14, 14, 'vatAmount', '1.663,20', 'LLM', 'HIGH', 0, '2026-04-17 15:17:08', '2026-04-17 15:17:08'),
(15, 14, 'totalAmount', '9.583,20', 'LLM', 'HIGH', 0, '2026-04-17 15:17:08', '2026-04-17 15:17:08'),
(16, 14, 'currency', 'EUR', 'LLM', 'HIGH', 0, '2026-04-17 15:17:08', '2026-04-17 15:17:08'),
(21, 18, 'vendorName', 'TAXI DEL A.P.C DE MADRID', 'LLM', 'HIGH', 0, '2026-04-17 23:08:08', '2026-04-17 23:08:08'),
(22, 18, 'expenseDate', '2026-03-25', 'LLM', 'HIGH', 0, '2026-04-17 23:08:08', '2026-04-17 23:08:08'),
(23, 18, 'totalAmount', '24.05', 'LLM', 'HIGH', 0, '2026-04-17 23:08:08', '2026-04-17 23:08:08'),
(24, 24, 'invoiceNumber', '0022552075', 'LLM', 'HIGH', 0, '2026-04-19 18:54:23', '2026-04-19 18:54:23'),
(25, 24, 'issueDate', '03/07/2025', 'LLM', 'HIGH', 0, '2026-04-19 18:54:23', '2026-04-19 18:54:23'),
(26, 24, 'vendorName', 'Clínica Dental Donoso', 'LLM', 'HIGH', 0, '2026-04-19 18:54:23', '2026-04-19 18:54:23'),
(27, 24, 'customerName', 'Peña Vargas Rafael', 'LLM', 'HIGH', 0, '2026-04-19 18:54:23', '2026-04-19 18:54:23'),
(28, 24, 'subtotalAmount', '110,00', 'LLM', 'HIGH', 0, '2026-04-19 18:54:23', '2026-04-19 18:54:23'),
(29, 24, 'vatAmount', '0,00', 'LLM', 'HIGH', 0, '2026-04-19 18:54:23', '2026-04-19 18:54:23'),
(30, 24, 'totalAmount', '110,00', 'LLM', 'HIGH', 0, '2026-04-19 18:54:23', '2026-04-19 18:54:23'),
(31, 24, 'currency', 'EUR', 'LLM', 'HIGH', 0, '2026-04-19 18:54:23', '2026-04-19 18:54:23'),
(32, 25, 'vendorName', 'Optica Universitaria', 'LLM', 'HIGH', 0, '2026-04-19 18:57:23', '2026-04-19 18:57:23'),
(33, 25, 'expenseDate', '2025-12-01', 'LLM', 'HIGH', 0, '2026-04-19 18:57:23', '2026-04-19 18:57:23'),
(34, 25, 'totalAmount', '204', 'LLM', 'HIGH', 0, '2026-04-19 18:57:23', '2026-04-19 18:57:23'),
(35, 25, 'vatAmount', '18.55', 'LLM', 'HIGH', 0, '2026-04-19 18:57:23', '2026-04-19 18:57:23'),
(36, 25, 'paymentMethod', 'Account payment (Import a compte)', 'LLM', 'HIGH', 0, '2026-04-19 18:57:23', '2026-04-19 18:57:23'),
(37, 26, 'vendorName', 'Optica Universitaria', 'LLM', 'HIGH', 0, '2026-04-19 18:59:20', '2026-04-19 18:59:20'),
(38, 26, 'expenseDate', '2025-12-01', 'LLM', 'HIGH', 0, '2026-04-19 18:59:20', '2026-04-19 18:59:20'),
(39, 26, 'totalAmount', '204', 'LLM', 'HIGH', 0, '2026-04-19 18:59:20', '2026-04-19 18:59:20'),
(40, 26, 'vatAmount', '18.55', 'LLM', 'HIGH', 0, '2026-04-19 18:59:20', '2026-04-19 18:59:20'),
(41, 26, 'paymentMethod', 'Account payment (Import a compte)', 'LLM', 'HIGH', 0, '2026-04-19 18:59:20', '2026-04-19 18:59:20'),
(42, 27, 'invoiceNumber', '103021565', 'LLM', 'MEDIUM', 0, '2026-04-19 19:00:32', '2026-04-19 19:00:32'),
(43, 27, 'issueDate', '25/11/2025', 'LLM', 'MEDIUM', 0, '2026-04-19 19:00:32', '2026-04-19 19:00:32'),
(44, 27, 'vendorName', 'Óptica Universitaria', 'LLM', 'MEDIUM', 0, '2026-04-19 19:00:32', '2026-04-19 19:00:32'),
(45, 27, 'customerName', 'OPTICA DEL PENEDES', 'LLM', 'MEDIUM', 0, '2026-04-19 19:00:32', '2026-04-19 19:00:32'),
(46, 27, 'subtotalAmount', '458,58€', 'LLM', 'MEDIUM', 0, '2026-04-19 19:00:32', '2026-04-19 19:00:32'),
(47, 27, 'vatAmount', '45,86€', 'LLM', 'MEDIUM', 0, '2026-04-19 19:00:32', '2026-04-19 19:00:32'),
(48, 27, 'totalAmount', '504,44€', 'LLM', 'MEDIUM', 0, '2026-04-19 19:00:32', '2026-04-19 19:00:32'),
(49, 27, 'currency', 'EUR', 'LLM', 'MEDIUM', 0, '2026-04-19 19:00:32', '2026-04-19 19:00:32'),
(50, 28, 'invoiceNumber', '103021567', 'LLM', 'MEDIUM', 0, '2026-04-19 19:01:16', '2026-04-19 19:01:16'),
(51, 28, 'issueDate', '25/11/2025', 'LLM', 'MEDIUM', 0, '2026-04-19 19:01:16', '2026-04-19 19:01:16'),
(52, 28, 'vendorName', 'Óptica & Audiología', 'LLM', 'MEDIUM', 0, '2026-04-19 19:01:16', '2026-04-19 19:01:16'),
(53, 28, 'customerName', 'ORTIGA DEL FENEDES', 'LLM', 'MEDIUM', 0, '2026-04-19 19:01:16', '2026-04-19 19:01:16'),
(54, 28, 'subtotalAmount', '28,36€', 'LLM', 'MEDIUM', 0, '2026-04-19 19:01:16', '2026-04-19 19:01:16'),
(55, 28, 'vatAmount', '2,84€', 'LLM', 'MEDIUM', 0, '2026-04-19 19:01:16', '2026-04-19 19:01:16'),
(56, 28, 'totalAmount', '31,20€', 'LLM', 'MEDIUM', 0, '2026-04-19 19:01:16', '2026-04-19 19:01:16'),
(57, 28, 'currency', 'EUR', 'LLM', 'MEDIUM', 0, '2026-04-19 19:01:16', '2026-04-19 19:01:16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_document_llm_results`
--

CREATE TABLE `finan_document_llm_results` (
  `id` bigint(20) NOT NULL,
  `document_id` bigint(20) NOT NULL,
  `ocr_result_id` bigint(20) DEFAULT NULL,
  `llm_provider` varchar(100) NOT NULL,
  `model_name` varchar(100) NOT NULL,
  `prompt_version` varchar(50) DEFAULT NULL,
  `raw_response` longtext NOT NULL,
  `parsed_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parsed_json`)),
  `confidence_summary` varchar(50) DEFAULT NULL,
  `processed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_document_llm_results`
--

INSERT INTO `finan_document_llm_results` (`id`, `document_id`, `ocr_result_id`, `llm_provider`, `model_name`, `prompt_version`, `raw_response`, `parsed_json`, `confidence_summary`, `processed_at`) VALUES
(10, 10, 11, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"PAYSLIP\",\n  \"summary\": \"Nómina de Rafael Peña Vargas correspondiente al período del 26 al 31 de enero de 2026, emitida por WEB ADVANCED DEVELOPMENT S.L. con detalle de percepciones, deducciones y bases de cotización.\",\n  \"extractedFields\": {\n    \"empresa\": \"WEB ADVANCED DEVELOPMENT S.L.\",\n    \"empleado\": \"PEÑA VARGAS, RAFAEL\",\n    \"periodo\": \"26/01/2026 - 31/01/2026\",\n    \"grossAmount\": 1069.52,\n    \"netAmount\": 1000.00,\n    \"irpfWithheld\": null,\n    \"socialSecurityAmount\": 50.27,\n    \"lineItems\": [\n      {\n        \"concept\": \"Salario Base\",\n        \"amount\": 689.64\n      },\n      {\n        \"concept\": \"Plus Convenio\",\n        \"amount\": 69.96\n      },\n      {\n        \"concept\": \"Paga Extra Verano\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Paga Extra Navidad\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Complemento a Líquido\",\n        \"amount\": 0.35\n      },\n      {\n        \"concept\": \"A Cuenta Convenio\",\n        \"amount\": 194.63\n      },\n      {\n        \"concept\": \"Cotización Cont.Comu\",\n        \"amount\": 50.27\n      },\n      {\n        \"concept\": \"Cotización MEI\",\n        \"amount\": 1.60\n      },\n      {\n        \"concept\": \"Cotización Formación\",\n        \"amount\": 1.07\n      },\n      {\n        \"concept\": \"Cotización Desempleo\",\n        \"amount\": 16.58\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se detecta importe retenido por IRPF explícito en el documento.\",\n    \"El importe de cotización a la Seguridad Social se desglosa en varias partidas, pero no se indica un total claro aparte del importe 50,27 asociado a \'Cotización Cont.Comu\'.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de datos principales como empresa, empleado, periodo y conceptos salariales. Moderada confianza en la identificación de retenciones y cotizaciones debido a la falta de claridad en el desglose del IRPF.\"\n}', '{\"documentType\":\"PAYSLIP\",\"summary\":\"Nómina de Rafael Peña Vargas correspondiente al período del 26 al 31 de enero de 2026, emitida por WEB ADVANCED DEVELOPMENT S.L. con detalle de percepciones, deducciones y bases de cotización.\",\"extractedFields\":{\"empresa\":\"WEB ADVANCED DEVELOPMENT S.L.\",\"empleado\":\"PEÑA VARGAS, RAFAEL\",\"periodo\":\"26/01/2026 - 31/01/2026\",\"grossAmount\":1069.52,\"netAmount\":1000,\"irpfWithheld\":null,\"socialSecurityAmount\":50.27,\"lineItems\":[{\"concept\":\"Salario Base\",\"amount\":689.64},{\"concept\":\"Plus Convenio\",\"amount\":69.96},{\"concept\":\"Paga Extra Verano\",\"amount\":57.47},{\"concept\":\"Paga Extra Navidad\",\"amount\":57.47},{\"concept\":\"Complemento a Líquido\",\"amount\":0.35},{\"concept\":\"A Cuenta Convenio\",\"amount\":194.63},{\"concept\":\"Cotización Cont.Comu\",\"amount\":50.27},{\"concept\":\"Cotización MEI\",\"amount\":1.6},{\"concept\":\"Cotización Formación\",\"amount\":1.07},{\"concept\":\"Cotización Desempleo\",\"amount\":16.58}]},\"detectedIssues\":[\"No se detecta importe retenido por IRPF explícito en el documento.\",\"El importe de cotización a la Seguridad Social se desglosa en varias partidas, pero no se indica un total claro aparte del importe 50,27 asociado a \'Cotización Cont.Comu\'.\"],\"confidenceSummary\":\"Alta confianza en la extracción de datos principales como empresa, empleado, periodo y conceptos salariales. Moderada confianza en la identificación de retenciones y cotizaciones debido a la falta de claridad en el desglose del IRPF.\"}', 'HIGH', '2026-04-16 23:01:13'),
(11, 10, 12, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"PAYSLIP\",\n  \"summary\": \"Nómina de Rafael Peña Vargas correspondiente al periodo del 01 al 31 de enero de 2026, emitida por WEB ADVANCED DEVELOPMENT S.L. con detalle de percepciones, deducciones y bases de cotización.\",\n  \"extractedFields\": {\n    \"empresa\": \"WEB ADVANCED DEVELOPMENT S.L.\",\n    \"empleado\": \"PEÑA VARGAS, RAFAEL\",\n    \"periodo\": \"01 GEN 26 a 31 GEN 26\",\n    \"grossAmount\": 1069.52,\n    \"netAmount\": 1000.00,\n    \"irpfWithheld\": null,\n    \"socialSecurityAmount\": 50.27,\n    \"lineItems\": [\n      {\n        \"concept\": \"Salario Base\",\n        \"amount\": 689.64\n      },\n      {\n        \"concept\": \"Plus Convenio\",\n        \"amount\": 69.96\n      },\n      {\n        \"concept\": \"Paga Extra Verano\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Paga Extra Navidad\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Complemento a Líquido\",\n        \"amount\": 0.35\n      },\n      {\n        \"concept\": \"A Cuenta Convenio\",\n        \"amount\": 194.63\n      },\n      {\n        \"concept\": \"Cotización Cont.Comu\",\n        \"amount\": 50.27\n      },\n      {\n        \"concept\": \"Cotización MEI\",\n        \"amount\": 1.60\n      },\n      {\n        \"concept\": \"Cotización Formación\",\n        \"amount\": 1.07\n      },\n      {\n        \"concept\": \"Cotización Desempleo\",\n        \"amount\": 16.58\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se detecta importe retenido por IRPF explícito en el documento.\",\n    \"No se especifica claramente el importe total de deducciones aparte de la cotización a la seguridad social.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de datos principales como empresa, empleado, periodo y montos brutos y netos. Moderada confianza en deducciones e IRPF debido a falta de información explícita.\"\n}', '{\"documentType\":\"PAYSLIP\",\"summary\":\"Nómina de Rafael Peña Vargas correspondiente al periodo del 01 al 31 de enero de 2026, emitida por WEB ADVANCED DEVELOPMENT S.L. con detalle de percepciones, deducciones y bases de cotización.\",\"extractedFields\":{\"empresa\":\"WEB ADVANCED DEVELOPMENT S.L.\",\"empleado\":\"PEÑA VARGAS, RAFAEL\",\"periodo\":\"01 GEN 26 a 31 GEN 26\",\"grossAmount\":1069.52,\"netAmount\":1000,\"irpfWithheld\":null,\"socialSecurityAmount\":50.27,\"lineItems\":[{\"concept\":\"Salario Base\",\"amount\":689.64},{\"concept\":\"Plus Convenio\",\"amount\":69.96},{\"concept\":\"Paga Extra Verano\",\"amount\":57.47},{\"concept\":\"Paga Extra Navidad\",\"amount\":57.47},{\"concept\":\"Complemento a Líquido\",\"amount\":0.35},{\"concept\":\"A Cuenta Convenio\",\"amount\":194.63},{\"concept\":\"Cotización Cont.Comu\",\"amount\":50.27},{\"concept\":\"Cotización MEI\",\"amount\":1.6},{\"concept\":\"Cotización Formación\",\"amount\":1.07},{\"concept\":\"Cotización Desempleo\",\"amount\":16.58}]},\"detectedIssues\":[\"No se detecta importe retenido por IRPF explícito en el documento.\",\"No se especifica claramente el importe total de deducciones aparte de la cotización a la seguridad social.\"],\"confidenceSummary\":\"Alta confianza en la extracción de datos principales como empresa, empleado, periodo y montos brutos y netos. Moderada confianza en deducciones e IRPF debido a falta de información explícita.\"}', 'HIGH', '2026-04-16 23:02:29'),
(12, 10, 13, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"PAYSLIP\",\n  \"summary\": \"Nómina de Rafael Peña Vargas correspondiente al periodo del 01 al 31 de enero de 2026, emitida por WEB ADVANCED DEVELOPMENT S.L. con detalle de percepciones, deducciones y bases de cotización.\",\n  \"extractedFields\": {\n    \"empresa\": \"WEB ADVANCED DEVELOPMENT S.L.\",\n    \"empleado\": \"PEÑA VARGAS, RAFAEL\",\n    \"periodo\": \"01 GEN 26 a 31 GEN 26\",\n    \"grossAmount\": 1069.52,\n    \"netAmount\": 1000.00,\n    \"irpfWithheld\": null,\n    \"socialSecurityAmount\": 50.27,\n    \"lineItems\": [\n      {\n        \"concept\": \"Salario Base\",\n        \"amount\": 689.64\n      },\n      {\n        \"concept\": \"Plus Convenio\",\n        \"amount\": 69.96\n      },\n      {\n        \"concept\": \"Paga Extra Verano\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Paga Extra Navidad\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Complemento a Líquido\",\n        \"amount\": 0.35\n      },\n      {\n        \"concept\": \"A Cuenta Convenio\",\n        \"amount\": 194.63\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se detecta importe retenido por IRPF explícito en el documento.\",\n    \"No se especifica importe total de deducciones, solo algunas cotizaciones de seguridad social.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de datos principales como empresa, empleado, periodo y conceptos salariales. Moderada confianza en deducciones y retenciones por falta de datos explícitos.\"\n}', '{\"documentType\":\"PAYSLIP\",\"summary\":\"Nómina de Rafael Peña Vargas correspondiente al periodo del 01 al 31 de enero de 2026, emitida por WEB ADVANCED DEVELOPMENT S.L. con detalle de percepciones, deducciones y bases de cotización.\",\"extractedFields\":{\"empresa\":\"WEB ADVANCED DEVELOPMENT S.L.\",\"empleado\":\"PEÑA VARGAS, RAFAEL\",\"periodo\":\"01 GEN 26 a 31 GEN 26\",\"grossAmount\":1069.52,\"netAmount\":1000,\"irpfWithheld\":null,\"socialSecurityAmount\":50.27,\"lineItems\":[{\"concept\":\"Salario Base\",\"amount\":689.64},{\"concept\":\"Plus Convenio\",\"amount\":69.96},{\"concept\":\"Paga Extra Verano\",\"amount\":57.47},{\"concept\":\"Paga Extra Navidad\",\"amount\":57.47},{\"concept\":\"Complemento a Líquido\",\"amount\":0.35},{\"concept\":\"A Cuenta Convenio\",\"amount\":194.63}]},\"detectedIssues\":[\"No se detecta importe retenido por IRPF explícito en el documento.\",\"No se especifica importe total de deducciones, solo algunas cotizaciones de seguridad social.\"],\"confidenceSummary\":\"Alta confianza en la extracción de datos principales como empresa, empleado, periodo y conceptos salariales. Moderada confianza en deducciones y retenciones por falta de datos explícitos.\"}', 'HIGH', '2026-04-16 23:08:09'),
(13, 10, 14, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"PAYSLIP\",\n  \"summary\": \"Nómina correspondiente al trabajador Rafael Peña Vargas para el periodo del 01 al 31 de enero de 2026, emitida por la empresa Web Advanced Development S.L. con NIF 43/1097234-37. Se detallan percepciones, deducciones y bases de cotización a la Seguridad Social.\",\n  \"extractedFields\": {\n    \"empresa\": \"Web Advanced Development S.L.\",\n    \"empleado\": \"Peña Vargas, Rafael\",\n    \"periodo\": \"01 GEN 26 a 31 GEN 26\",\n    \"grossAmount\": 1069.52,\n    \"netAmount\": 1000.00,\n    \"irpfWithheld\": null,\n    \"socialSecurityAmount\": 50.27,\n    \"lineItems\": [\n      {\n        \"concept\": \"Salario Base\",\n        \"amount\": 689.64\n      },\n      {\n        \"concept\": \"Plus Convenio\",\n        \"amount\": 69.96\n      },\n      {\n        \"concept\": \"Paga Extra Verano\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Paga Extra Navidad\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Complemento a Líquido\",\n        \"amount\": 0.35\n      },\n      {\n        \"concept\": \"A Cuenta Convenio\",\n        \"amount\": 194.63\n      },\n      {\n        \"concept\": \"Cotización Cont.Comu\",\n        \"amount\": 50.27\n      },\n      {\n        \"concept\": \"Cotización MEI\",\n        \"amount\": 1.60\n      },\n      {\n        \"concept\": \"Cotización Formación\",\n        \"amount\": 1.07\n      },\n      {\n        \"concept\": \"Cotización Desempleo\",\n        \"amount\": 16.58\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se detecta importe retenido por IRPF explícito en el documento.\",\n    \"No se especifica importe total de deducciones claramente.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de empresa, empleado, periodo, percepciones y cotizaciones. Falta información explícita sobre IRPF retenido y deducciones totales.\"\n}', '{\"documentType\":\"PAYSLIP\",\"summary\":\"Nómina correspondiente al trabajador Rafael Peña Vargas para el periodo del 01 al 31 de enero de 2026, emitida por la empresa Web Advanced Development S.L. con NIF 43/1097234-37. Se detallan percepciones, deducciones y bases de cotización a la Seguridad Social.\",\"extractedFields\":{\"empresa\":\"Web Advanced Development S.L.\",\"empleado\":\"Peña Vargas, Rafael\",\"periodo\":\"01 GEN 26 a 31 GEN 26\",\"grossAmount\":1069.52,\"netAmount\":1000,\"irpfWithheld\":null,\"socialSecurityAmount\":50.27,\"lineItems\":[{\"concept\":\"Salario Base\",\"amount\":689.64},{\"concept\":\"Plus Convenio\",\"amount\":69.96},{\"concept\":\"Paga Extra Verano\",\"amount\":57.47},{\"concept\":\"Paga Extra Navidad\",\"amount\":57.47},{\"concept\":\"Complemento a Líquido\",\"amount\":0.35},{\"concept\":\"A Cuenta Convenio\",\"amount\":194.63},{\"concept\":\"Cotización Cont.Comu\",\"amount\":50.27},{\"concept\":\"Cotización MEI\",\"amount\":1.6},{\"concept\":\"Cotización Formación\",\"amount\":1.07},{\"concept\":\"Cotización Desempleo\",\"amount\":16.58}]},\"detectedIssues\":[\"No se detecta importe retenido por IRPF explícito en el documento.\",\"No se especifica importe total de deducciones claramente.\"],\"confidenceSummary\":\"Alta confianza en la extracción de empresa, empleado, periodo, percepciones y cotizaciones. Falta información explícita sobre IRPF retenido y deducciones totales.\"}', 'HIGH', '2026-04-16 23:12:10'),
(14, 10, 15, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"PAYSLIP\",\n  \"summary\": \"Nómina de Rafael Peña Vargas correspondiente al período del 01 al 31 de enero de 2026, emitida por WEB ADVANCED DEVELOPMENT S.L. con detalle de percepciones, deducciones y bases de cotización.\",\n  \"extractedFields\": {\n    \"empresa\": \"WEB ADVANCED DEVELOPMENT S.L.\",\n    \"empleado\": \"PEÑA VARGAS, RAFAEL\",\n    \"periodo\": \"01 GEN 26 a 31 GEN 26\",\n    \"grossAmount\": 1069.52,\n    \"netAmount\": 1000.00,\n    \"irpfWithheld\": null,\n    \"socialSecurityAmount\": 50.27,\n    \"lineItems\": [\n      {\n        \"concept\": \"Salario Base\",\n        \"amount\": 689.64\n      },\n      {\n        \"concept\": \"Plus Convenio\",\n        \"amount\": 69.96\n      },\n      {\n        \"concept\": \"Paga Extra Verano\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Paga Extra Navidad\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Complemento a Líquido\",\n        \"amount\": 0.35\n      },\n      {\n        \"concept\": \"A Cuenta Convenio\",\n        \"amount\": 194.63\n      },\n      {\n        \"concept\": \"Cotización Cont.Comu\",\n        \"amount\": 50.27\n      },\n      {\n        \"concept\": \"Cotización MEI\",\n        \"amount\": 1.60\n      },\n      {\n        \"concept\": \"Cotización Formación\",\n        \"amount\": 1.07\n      },\n      {\n        \"concept\": \"Cotización Desempleo\",\n        \"amount\": 16.58\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se detecta importe retenido por IRPF explícito en el documento.\",\n    \"No se especifica claramente el importe total de deducciones aparte de la cotización a la Seguridad Social.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de empresa, empleado, periodo, importe bruto y líquido. Moderada confianza en deducciones y retenciones debido a falta de datos explícitos sobre IRPF.\"\n}', '{\"documentType\":\"PAYSLIP\",\"summary\":\"Nómina de Rafael Peña Vargas correspondiente al período del 01 al 31 de enero de 2026, emitida por WEB ADVANCED DEVELOPMENT S.L. con detalle de percepciones, deducciones y bases de cotización.\",\"extractedFields\":{\"empresa\":\"WEB ADVANCED DEVELOPMENT S.L.\",\"empleado\":\"PEÑA VARGAS, RAFAEL\",\"periodo\":\"01 GEN 26 a 31 GEN 26\",\"grossAmount\":1069.52,\"netAmount\":1000,\"irpfWithheld\":null,\"socialSecurityAmount\":50.27,\"lineItems\":[{\"concept\":\"Salario Base\",\"amount\":689.64},{\"concept\":\"Plus Convenio\",\"amount\":69.96},{\"concept\":\"Paga Extra Verano\",\"amount\":57.47},{\"concept\":\"Paga Extra Navidad\",\"amount\":57.47},{\"concept\":\"Complemento a Líquido\",\"amount\":0.35},{\"concept\":\"A Cuenta Convenio\",\"amount\":194.63},{\"concept\":\"Cotización Cont.Comu\",\"amount\":50.27},{\"concept\":\"Cotización MEI\",\"amount\":1.6},{\"concept\":\"Cotización Formación\",\"amount\":1.07},{\"concept\":\"Cotización Desempleo\",\"amount\":16.58}]},\"detectedIssues\":[\"No se detecta importe retenido por IRPF explícito en el documento.\",\"No se especifica claramente el importe total de deducciones aparte de la cotización a la Seguridad Social.\"],\"confidenceSummary\":\"Alta confianza en la extracción de empresa, empleado, periodo, importe bruto y líquido. Moderada confianza en deducciones y retenciones debido a falta de datos explícitos sobre IRPF.\"}', 'HIGH', '2026-04-16 23:23:36'),
(15, 11, 16, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"PAYSLIP\",\n  \"summary\": \"Nómina correspondiente al periodo del 01 al 28 de febrero de 2026 para el empleado Rafael Peña Vargas, programador en WEB ADVANCED DEVELOPMENT S.L. con NIF B43937655. El salario bruto total es 1.069,52 EUR y el líquido a percibir es 1.000,00 EUR.\",\n  \"extractedFields\": {\n    \"empresa\": \"WEB ADVANCED DEVELOPMENT S.L.\",\n    \"empleado\": \"Rafael Peña Vargas\",\n    \"periodo\": \"01 FEB 26 a 28 FEB 26\",\n    \"grossAmount\": 1069.52,\n    \"netAmount\": 1000.00,\n    \"irpfWithheld\": null,\n    \"socialSecurityAmount\": 50.27,\n    \"lineItems\": [\n      {\n        \"concept\": \"Salario Base\",\n        \"amount\": 689.64\n      },\n      {\n        \"concept\": \"Plus Convenio\",\n        \"amount\": 69.96\n      },\n      {\n        \"concept\": \"Paga Extra Verano\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Paga Extra Navidad\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Complemento a Líquido\",\n        \"amount\": 0.35\n      },\n      {\n        \"concept\": \"A Cuenta Convenio\",\n        \"amount\": 194.63\n      },\n      {\n        \"concept\": \"Cotización Cont.Comu\",\n        \"amount\": 50.27\n      },\n      {\n        \"concept\": \"Cotización MEI\",\n        \"amount\": 1.60\n      },\n      {\n        \"concept\": \"Cotización Formación\",\n        \"amount\": 1.07\n      },\n      {\n        \"concept\": \"Cotización Desempleo\",\n        \"amount\": 16.58\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se ha identificado el importe retenido por IRPF explícitamente en el documento.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de empresa, empleado, periodo, importes brutos y netos, y conceptos de nómina. Baja confianza en la identificación del IRPF retenido debido a la ausencia de datos claros.\"\n}', '{\"documentType\":\"PAYSLIP\",\"summary\":\"Nómina correspondiente al periodo del 01 al 28 de febrero de 2026 para el empleado Rafael Peña Vargas, programador en WEB ADVANCED DEVELOPMENT S.L. con NIF B43937655. El salario bruto total es 1.069,52 EUR y el líquido a percibir es 1.000,00 EUR.\",\"extractedFields\":{\"empresa\":\"WEB ADVANCED DEVELOPMENT S.L.\",\"empleado\":\"Rafael Peña Vargas\",\"periodo\":\"01 FEB 26 a 28 FEB 26\",\"grossAmount\":1069.52,\"netAmount\":1000,\"irpfWithheld\":null,\"socialSecurityAmount\":50.27,\"lineItems\":[{\"concept\":\"Salario Base\",\"amount\":689.64},{\"concept\":\"Plus Convenio\",\"amount\":69.96},{\"concept\":\"Paga Extra Verano\",\"amount\":57.47},{\"concept\":\"Paga Extra Navidad\",\"amount\":57.47},{\"concept\":\"Complemento a Líquido\",\"amount\":0.35},{\"concept\":\"A Cuenta Convenio\",\"amount\":194.63},{\"concept\":\"Cotización Cont.Comu\",\"amount\":50.27},{\"concept\":\"Cotización MEI\",\"amount\":1.6},{\"concept\":\"Cotización Formación\",\"amount\":1.07},{\"concept\":\"Cotización Desempleo\",\"amount\":16.58}]},\"detectedIssues\":[\"No se ha identificado el importe retenido por IRPF explícitamente en el documento.\"],\"confidenceSummary\":\"Alta confianza en la extracción de empresa, empleado, periodo, importes brutos y netos, y conceptos de nómina. Baja confianza en la identificación del IRPF retenido debido a la ausencia de datos claros.\"}', 'HIGH', '2026-04-16 23:30:40'),
(16, 12, 17, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"PAYSLIP\",\n  \"summary\": \"Nómina correspondiente al periodo del 01 al 31 de marzo de 2026 para el empleado Rafael Peña Vargas, con detalles de percepciones, deducciones y bases de cotización.\",\n  \"extractedFields\": {\n    \"empresa\": \"WEB ADVANCED DEVELOPMENT S.L.\",\n    \"empleado\": \"PEÑA VARGAS, RAFAEL\",\n    \"periodo\": \"01 MAR 26 a 31 MAR 26\",\n    \"grossAmount\": 1069.52,\n    \"netAmount\": 1000.00,\n    \"irpfWithheld\": null,\n    \"socialSecurityAmount\": 50.27,\n    \"lineItems\": [\n      {\n        \"concept\": \"Salario Base\",\n        \"amount\": 689.64\n      },\n      {\n        \"concept\": \"Plus Convenio\",\n        \"amount\": 69.96\n      },\n      {\n        \"concept\": \"Paga Extra Verano\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Paga Extra Navidad\",\n        \"amount\": 57.47\n      },\n      {\n        \"concept\": \"Complemento a Líquido\",\n        \"amount\": 0.35\n      },\n      {\n        \"concept\": \"A Cuenta Convenio\",\n        \"amount\": 194.63\n      },\n      {\n        \"concept\": \"Cotización Cont.Comu\",\n        \"amount\": 50.27\n      },\n      {\n        \"concept\": \"Cotización MEI\",\n        \"amount\": 1.60\n      },\n      {\n        \"concept\": \"Cotización Formación\",\n        \"amount\": 1.07\n      },\n      {\n        \"concept\": \"Cotización Desempleo\",\n        \"amount\": 16.58\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se detecta importe explícito de IRPF retenido en el documento.\",\n    \"No se especifica claramente el importe total de deducciones.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de empresa, empleado, periodo, percepciones y cotizaciones. Media confianza en la ausencia de IRPF retenido debido a falta de datos explícitos.\"\n}', '{\"documentType\":\"PAYSLIP\",\"summary\":\"Nómina correspondiente al periodo del 01 al 31 de marzo de 2026 para el empleado Rafael Peña Vargas, con detalles de percepciones, deducciones y bases de cotización.\",\"extractedFields\":{\"empresa\":\"WEB ADVANCED DEVELOPMENT S.L.\",\"empleado\":\"PEÑA VARGAS, RAFAEL\",\"periodo\":\"01 MAR 26 a 31 MAR 26\",\"grossAmount\":1069.52,\"netAmount\":1000,\"irpfWithheld\":null,\"socialSecurityAmount\":50.27,\"lineItems\":[{\"concept\":\"Salario Base\",\"amount\":689.64},{\"concept\":\"Plus Convenio\",\"amount\":69.96},{\"concept\":\"Paga Extra Verano\",\"amount\":57.47},{\"concept\":\"Paga Extra Navidad\",\"amount\":57.47},{\"concept\":\"Complemento a Líquido\",\"amount\":0.35},{\"concept\":\"A Cuenta Convenio\",\"amount\":194.63},{\"concept\":\"Cotización Cont.Comu\",\"amount\":50.27},{\"concept\":\"Cotización MEI\",\"amount\":1.6},{\"concept\":\"Cotización Formación\",\"amount\":1.07},{\"concept\":\"Cotización Desempleo\",\"amount\":16.58}]},\"detectedIssues\":[\"No se detecta importe explícito de IRPF retenido en el documento.\",\"No se especifica claramente el importe total de deducciones.\"],\"confidenceSummary\":\"Alta confianza en la extracción de empresa, empleado, periodo, percepciones y cotizaciones. Media confianza en la ausencia de IRPF retenido debido a falta de datos explícitos.\"}', 'HIGH', '2026-04-16 23:31:12'),
(17, 13, 18, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"PAYSLIP\",\n  \"summary\": \"Nómina correspondiente al empleado Rafael Peña Vargas en la empresa Tecnologías Plexus S.L. para el periodo de liquidación de diciembre de 2025. Se detallan conceptos devengados y deducciones, incluyendo salario base, plus convenio, mejora voluntaria, complemento teletrabajo, seguro médico flexible, prorrata paga extra, cotizaciones y retenciones de IRPF.\",\n  \"extractedFields\": {\n    \"empresa\": \"Tecnologías Plexus S.L.\",\n    \"empleado\": \"Rafael Peña Vargas\",\n    \"periodo\": \"Diciembre 2025\",\n    \"grossAmount\": 3781.03,\n    \"netAmount\": 2729.56,\n    \"irpfWithheld\": 800.82,\n    \"socialSecurityAmount\": 248.4,\n    \"lineItems\": [\n      {\n        \"period\": \"12/25\",\n        \"code\": \"R1A\",\n        \"concept\": \"Salario Base\",\n        \"quantity\": 30,\n        \"pricePercent\": 60.4731,\n        \"devengos\": 1814.19,\n        \"deducciones\": null\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"R2Z\",\n        \"concept\": \"Plus Convenio\",\n        \"quantity\": 30,\n        \"pricePercent\": 5.2304,\n        \"devengos\": 156.91,\n        \"deducciones\": null\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"R1I\",\n        \"concept\": \"Mejora Voluntaria\",\n        \"quantity\": 30,\n        \"pricePercent\": 41.6774,\n        \"devengos\": 1250.32,\n        \"deducciones\": null\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"RA4\",\n        \"concept\": \"Complemento Teletrabajo\",\n        \"quantity\": 30,\n        \"pricePercent\": 2.5,\n        \"devengos\": 75.00,\n        \"deducciones\": null\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"U9B\",\n        \"concept\": \"Seguro Médico Flexible\",\n        \"quantity\": null,\n        \"pricePercent\": null,\n        \"devengos\": null,\n        \"deducciones\": 52.30\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"R3R\",\n        \"concept\": \"Prorrata Paga Extra\",\n        \"quantity\": null,\n        \"pricePercent\": null,\n        \"devengos\": 536.91,\n        \"deducciones\": null\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"700\",\n        \"concept\": \"Cotización Sal. Desempleo+Fogasa+F.\",\n        \"quantity\": 3833.33,\n        \"pricePercent\": 1.65,\n        \"devengos\": null,\n        \"deducciones\": 63.25\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"705\",\n        \"concept\": \"Cotización Sal. Contingencias Comun\",\n        \"quantity\": 3833.33,\n        \"pricePercent\": 4.83,\n        \"devengos\": null,\n        \"deducciones\": 185.15\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"F74\",\n        \"concept\": \"I.R.P.F.\",\n        \"quantity\": 3781.03,\n        \"pricePercent\": 21.18,\n        \"devengos\": null,\n        \"deducciones\": 800.82\n      },\n      {\n        \"period\": \"12/25\",\n        \"code\": \"FE4\",\n        \"concept\": \"INGRESO A CUENTA\",\n        \"quantity\": 10.63,\n        \"pricePercent\": 21.18,\n        \"devengos\": null,\n        \"deducciones\": 2.25\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se ha identificado claramente el importe total de la cotización a la Seguridad Social a cargo del empleado, solo se dispone de la aportación de la empresa.\",\n    \"Algunos conceptos no tienen cantidad o precio/% especificados, lo que puede dificultar cálculos exactos.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de datos principales como empresa, empleado, periodo, importe bruto, neto e IRPF. Moderada confianza en detalles de cotizaciones y algunos conceptos con datos incompletos.\"\n}', '{\"documentType\":\"PAYSLIP\",\"summary\":\"Nómina correspondiente al empleado Rafael Peña Vargas en la empresa Tecnologías Plexus S.L. para el periodo de liquidación de diciembre de 2025. Se detallan conceptos devengados y deducciones, incluyendo salario base, plus convenio, mejora voluntaria, complemento teletrabajo, seguro médico flexible, prorrata paga extra, cotizaciones y retenciones de IRPF.\",\"extractedFields\":{\"empresa\":\"Tecnologías Plexus S.L.\",\"empleado\":\"Rafael Peña Vargas\",\"periodo\":\"Diciembre 2025\",\"grossAmount\":3781.03,\"netAmount\":2729.56,\"irpfWithheld\":800.82,\"socialSecurityAmount\":248.4,\"lineItems\":[{\"period\":\"12/25\",\"code\":\"R1A\",\"concept\":\"Salario Base\",\"quantity\":30,\"pricePercent\":60.4731,\"devengos\":1814.19,\"deducciones\":null},{\"period\":\"12/25\",\"code\":\"R2Z\",\"concept\":\"Plus Convenio\",\"quantity\":30,\"pricePercent\":5.2304,\"devengos\":156.91,\"deducciones\":null},{\"period\":\"12/25\",\"code\":\"R1I\",\"concept\":\"Mejora Voluntaria\",\"quantity\":30,\"pricePercent\":41.6774,\"devengos\":1250.32,\"deducciones\":null},{\"period\":\"12/25\",\"code\":\"RA4\",\"concept\":\"Complemento Teletrabajo\",\"quantity\":30,\"pricePercent\":2.5,\"devengos\":75,\"deducciones\":null},{\"period\":\"12/25\",\"code\":\"U9B\",\"concept\":\"Seguro Médico Flexible\",\"quantity\":null,\"pricePercent\":null,\"devengos\":null,\"deducciones\":52.3},{\"period\":\"12/25\",\"code\":\"R3R\",\"concept\":\"Prorrata Paga Extra\",\"quantity\":null,\"pricePercent\":null,\"devengos\":536.91,\"deducciones\":null},{\"period\":\"12/25\",\"code\":\"700\",\"concept\":\"Cotización Sal. Desempleo+Fogasa+F.\",\"quantity\":3833.33,\"pricePercent\":1.65,\"devengos\":null,\"deducciones\":63.25},{\"period\":\"12/25\",\"code\":\"705\",\"concept\":\"Cotización Sal. Contingencias Comun\",\"quantity\":3833.33,\"pricePercent\":4.83,\"devengos\":null,\"deducciones\":185.15},{\"period\":\"12/25\",\"code\":\"F74\",\"concept\":\"I.R.P.F.\",\"quantity\":3781.03,\"pricePercent\":21.18,\"devengos\":null,\"deducciones\":800.82},{\"period\":\"12/25\",\"code\":\"FE4\",\"concept\":\"INGRESO A CUENTA\",\"quantity\":10.63,\"pricePercent\":21.18,\"devengos\":null,\"deducciones\":2.25}]},\"detectedIssues\":[\"No se ha identificado claramente el importe total de la cotización a la Seguridad Social a cargo del empleado, solo se dispone de la aportación de la empresa.\",\"Algunos conceptos no tienen cantidad o precio/% especificados, lo que puede dificultar cálculos exactos.\"],\"confidenceSummary\":\"Alta confianza en la extracción de datos principales como empresa, empleado, periodo, importe bruto, neto e IRPF. Moderada confianza en detalles de cotizaciones y algunos conceptos con datos incompletos.\"}', 'HIGH', '2026-04-16 23:32:13'),
(18, 14, 19, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"INVOICE\",\n  \"summary\": \"Factura número 098737726 emitida el 16/4/26 por Rafa Peña Vargas para SABALA SA, con un subtotal de 7.920,00 €, impuesto del 21% y total de 9.583,20 €.\",\n  \"extractedFields\": {\n    \"invoiceNumber\": \"098737726\",\n    \"issueDate\": \"16/4/26\",\n    \"vendorName\": \"Rafa Peña Vargas\",\n    \"customerName\": \"SABALA SA\",\n    \"subtotalAmount\": \"7.920,00\",\n    \"vatAmount\": \"1.663,20\",\n    \"totalAmount\": \"9.583,20\",\n    \"currency\": \"EUR\",\n    \"conceptos\": [\n      {\n        \"description\": \"Ítem 1\",\n        \"quantity\": 55,\n        \"unitPrice\": \"100,00\",\n        \"cost\": \"5.500,00\"\n      },\n      {\n        \"description\": \"Ítem 2\",\n        \"quantity\": 13,\n        \"unitPrice\": \"90,00\",\n        \"cost\": \"1.170,00\"\n      },\n      {\n        \"description\": \"Ítem 3\",\n        \"quantity\": 25,\n        \"unitPrice\": \"50,00\",\n        \"cost\": \"1.250,00\"\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"La fecha de emisión \'16/4/26\' puede ser ambigua, se asume formato dd/mm/aa.\",\n    \"No se especifica claramente el nombre del cliente, se asume SABALA SA como cliente.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en número de factura, importes y conceptos. Moderada confianza en fecha y nombres debido a formato y contexto.\"\n}', '{\"documentType\":\"INVOICE\",\"summary\":\"Factura número 098737726 emitida el 16/4/26 por Rafa Peña Vargas para SABALA SA, con un subtotal de 7.920,00 €, impuesto del 21% y total de 9.583,20 €.\",\"extractedFields\":{\"invoiceNumber\":\"098737726\",\"issueDate\":\"16/4/26\",\"vendorName\":\"Rafa Peña Vargas\",\"customerName\":\"SABALA SA\",\"subtotalAmount\":\"7.920,00\",\"vatAmount\":\"1.663,20\",\"totalAmount\":\"9.583,20\",\"currency\":\"EUR\",\"conceptos\":[{\"description\":\"Ítem 1\",\"quantity\":55,\"unitPrice\":\"100,00\",\"cost\":\"5.500,00\"},{\"description\":\"Ítem 2\",\"quantity\":13,\"unitPrice\":\"90,00\",\"cost\":\"1.170,00\"},{\"description\":\"Ítem 3\",\"quantity\":25,\"unitPrice\":\"50,00\",\"cost\":\"1.250,00\"}]},\"detectedIssues\":[\"La fecha de emisión \'16/4/26\' puede ser ambigua, se asume formato dd/mm/aa.\",\"No se especifica claramente el nombre del cliente, se asume SABALA SA como cliente.\"],\"confidenceSummary\":\"Alta confianza en número de factura, importes y conceptos. Moderada confianza en fecha y nombres debido a formato y contexto.\"}', 'HIGH', '2026-04-17 14:49:50'),
(19, 14, 20, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"INVOICE\",\n  \"summary\": \"Factura número 098737726 emitida el 16/4/26 por Rafa Peña Vargas para SABALA SA, correspondiente al proyecto \'Subida de archivos\'. Incluye 3 ítems con un subtotal de 7.920,00 €, impuesto del 21% y total de 9.583,20 €.\",\n  \"extractedFields\": {\n    \"invoiceNumber\": \"098737726\",\n    \"issueDate\": \"16/4/26\",\n    \"vendorName\": \"Rafa Peña Vargas\",\n    \"customerName\": \"SABALA SA\",\n    \"subtotalAmount\": \"7.920,00\",\n    \"vatAmount\": \"1.663,20\",\n    \"totalAmount\": \"9.583,20\",\n    \"currency\": \"EUR\",\n    \"conceptos\": [\n      {\n        \"description\": \"Ítem 1\",\n        \"quantity\": 55,\n        \"unitPrice\": \"100,00\",\n        \"cost\": \"5.500,00\"\n      },\n      {\n        \"description\": \"Ítem 2\",\n        \"quantity\": 13,\n        \"unitPrice\": \"90,00\",\n        \"cost\": \"1.170,00\"\n      },\n      {\n        \"description\": \"Ítem 3\",\n        \"quantity\": 25,\n        \"unitPrice\": \"50,00\",\n        \"cost\": \"1.250,00\"\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"La fecha de emisión \'16/4/26\' puede ser ambigua, se asume año 2026.\",\n    \"No se detecta claramente el nombre del cliente aparte de SABALA SA, posible falta de datos completos.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en número de factura, importes y conceptos. Moderada en fecha por formato ambiguo.\"\n}', '{\"documentType\":\"INVOICE\",\"summary\":\"Factura número 098737726 emitida el 16/4/26 por Rafa Peña Vargas para SABALA SA, correspondiente al proyecto \'Subida de archivos\'. Incluye 3 ítems con un subtotal de 7.920,00 €, impuesto del 21% y total de 9.583,20 €.\",\"extractedFields\":{\"invoiceNumber\":\"098737726\",\"issueDate\":\"16/4/26\",\"vendorName\":\"Rafa Peña Vargas\",\"customerName\":\"SABALA SA\",\"subtotalAmount\":\"7.920,00\",\"vatAmount\":\"1.663,20\",\"totalAmount\":\"9.583,20\",\"currency\":\"EUR\",\"conceptos\":[{\"description\":\"Ítem 1\",\"quantity\":55,\"unitPrice\":\"100,00\",\"cost\":\"5.500,00\"},{\"description\":\"Ítem 2\",\"quantity\":13,\"unitPrice\":\"90,00\",\"cost\":\"1.170,00\"},{\"description\":\"Ítem 3\",\"quantity\":25,\"unitPrice\":\"50,00\",\"cost\":\"1.250,00\"}]},\"detectedIssues\":[\"La fecha de emisión \'16/4/26\' puede ser ambigua, se asume año 2026.\",\"No se detecta claramente el nombre del cliente aparte de SABALA SA, posible falta de datos completos.\"],\"confidenceSummary\":\"Alta confianza en número de factura, importes y conceptos. Moderada en fecha por formato ambiguo.\"}', 'HIGH', '2026-04-17 15:17:08'),
(20, 15, 21, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"Informe de Vida Laboral\",\n  \"summary\": \"Informe de vida laboral de Rafael Peña Vargas, con número de Seguridad Social 250048424073 y DNI 043735032A, que detalla sus períodos de alta y baja en el sistema de la Seguridad Social hasta el 31 de marzo de 2026. El informe incluye datos personales, empresas en las que ha trabajado, regímenes de cotización, fechas de alta y baja, tipos de contrato, porcentaje de jornada, grupo de cotización y días cotizados. Se especifica que ha estado dado de alta un total de 23 años y 8,471 días, con 304 días en situación de pluriempleo o pluriactividad, resultando en 22 años y 8,167 días computables para prestaciones. Además, se incluyen notas aclaratorias sobre conceptos y peculiaridades de los regímenes y situaciones laborales.\",\n  \"extractedFields\": {\n    \"personalData\": {\n      \"name\": \"Rafael Peña Vargas\",\n      \"dateOfBirth\": \"28-12-1974\",\n      \"socialSecurityNumber\": \"250048424073\",\n      \"DNI\": \"043735032A\",\n      \"address\": \"Placeta Orvepard Nº 2 Piso 1 Pta. B, 25005 Lleida, Lleida\"\n    },\n    \"totalTimeHigh\": {\n      \"years\": 23,\n      \"days\": 8471,\n      \"months\": 2,\n      \"extraDays\": 12\n    },\n    \"pluriempleoDays\": 304,\n    \"totalComputableDays\": {\n      \"years\": 22,\n      \"days\": 8167,\n      \"months\": 4,\n      \"extraDays\": 12\n    },\n    \"employmentRecords\": [\n      {\n        \"regimen\": \"GENERAL\",\n        \"company\": \"TECNOLOGIAS PLEXUS, S.L.\",\n        \"startDate\": \"03-11-2023\",\n        \"effectiveStartDate\": \"03-11-2023\",\n        \"endDate\": null,\n        \"contractType\": \"100\",\n        \"days\": 880\n      },\n      {\n        \"regimen\": \"GENERAL\",\n        \"company\": \"WEB ADVANCED DEVELOPMENT S.L.\",\n        \"startDate\": \"01-04-2024\",\n        \"effectiveStartDate\": \"01-04-2024\",\n        \"endDate\": null,\n        \"contractType\": \"200\",\n        \"percentageGC\": 37.5,\n        \"days\": 274\n      },\n      {\n        \"regimen\": \"GENERAL\",\n        \"company\": \"VACACIONES RETRIBUIDAS Y NO DISFRUTADAS\",\n        \"startDate\": \"03-01-2023\",\n        \"effectiveStartDate\": \"03-01-2023\",\n        \"endDate\": \"07-01-2023\",\n        \"days\": 5\n      },\n      {\n        \"regimen\": \"ARTISTAS\",\n        \"company\": \"ARTISTAS PERIODOS REGULARIZADOS\",\n        \"startDate\": \"01-01-2002\",\n        \"effectiveStartDate\": \"01-01-2002\",\n        \"endDate\": \"31-12-2002\",\n        \"days\": 31\n      },\n      {\n        \"regimen\": \"AUTONOMO\",\n        \"company\": \"LLEIDA\",\n        \"startDate\": \"01-10-2008\",\n        \"effectiveStartDate\": \"01-10-2008\",\n        \"endDate\": \"31-03-2011\",\n        \"days\": 912\n      }\n      ,\n      \"... (otros registros similares omitidos para brevedad)\"\n    ]\n  },\n  \"detectedIssues\": [\n    \"El documento contiene múltiples registros de períodos laborales con fechas de baja no siempre especificadas claramente.\",\n    \"Algunos registros corresponden a situaciones de vacaciones no disfrutadas y prestaciones de desempleo, que pueden no ser computables para todas las prestaciones.\",\n    \"El informe indica que los días de alta en empresas de artistas no son definitivos hasta la regularización anual.\",\n    \"El documento no incluye datos relativos a regímenes especiales de funcionarios civiles, fuerzas armadas, funcionarios de justicia ni períodos trabajados en el extranjero.\",\n    \"El documento es válido hasta el 01/04/2028 y debe verificarse con el Código Electrónico de Autenticidad.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la extracción de datos personales y períodos de cotización, dado que el documento es oficial y contiene referencias electrónicas para autenticidad. Sin embargo, la interpretación de ciertos períodos especiales y situaciones asimiladas a alta puede requerir validación adicional por parte de la Seguridad Social.\"\n}', '{\"documentType\":\"Informe de Vida Laboral\",\"summary\":\"Informe de vida laboral de Rafael Peña Vargas, con número de Seguridad Social 250048424073 y DNI 043735032A, que detalla sus períodos de alta y baja en el sistema de la Seguridad Social hasta el 31 de marzo de 2026. El informe incluye datos personales, empresas en las que ha trabajado, regímenes de cotización, fechas de alta y baja, tipos de contrato, porcentaje de jornada, grupo de cotización y días cotizados. Se especifica que ha estado dado de alta un total de 23 años y 8,471 días, con 304 días en situación de pluriempleo o pluriactividad, resultando en 22 años y 8,167 días computables para prestaciones. Además, se incluyen notas aclaratorias sobre conceptos y peculiaridades de los regímenes y situaciones laborales.\",\"extractedFields\":{\"personalData\":{\"name\":\"Rafael Peña Vargas\",\"dateOfBirth\":\"28-12-1974\",\"socialSecurityNumber\":\"250048424073\",\"DNI\":\"043735032A\",\"address\":\"Placeta Orvepard Nº 2 Piso 1 Pta. B, 25005 Lleida, Lleida\"},\"totalTimeHigh\":{\"years\":23,\"days\":8471,\"months\":2,\"extraDays\":12},\"pluriempleoDays\":304,\"totalComputableDays\":{\"years\":22,\"days\":8167,\"months\":4,\"extraDays\":12},\"employmentRecords\":[{\"regimen\":\"GENERAL\",\"company\":\"TECNOLOGIAS PLEXUS, S.L.\",\"startDate\":\"03-11-2023\",\"effectiveStartDate\":\"03-11-2023\",\"endDate\":null,\"contractType\":\"100\",\"days\":880},{\"regimen\":\"GENERAL\",\"company\":\"WEB ADVANCED DEVELOPMENT S.L.\",\"startDate\":\"01-04-2024\",\"effectiveStartDate\":\"01-04-2024\",\"endDate\":null,\"contractType\":\"200\",\"percentageGC\":37.5,\"days\":274},{\"regimen\":\"GENERAL\",\"company\":\"VACACIONES RETRIBUIDAS Y NO DISFRUTADAS\",\"startDate\":\"03-01-2023\",\"effectiveStartDate\":\"03-01-2023\",\"endDate\":\"07-01-2023\",\"days\":5},{\"regimen\":\"ARTISTAS\",\"company\":\"ARTISTAS PERIODOS REGULARIZADOS\",\"startDate\":\"01-01-2002\",\"effectiveStartDate\":\"01-01-2002\",\"endDate\":\"31-12-2002\",\"days\":31},{\"regimen\":\"AUTONOMO\",\"company\":\"LLEIDA\",\"startDate\":\"01-10-2008\",\"effectiveStartDate\":\"01-10-2008\",\"endDate\":\"31-03-2011\",\"days\":912},\"... (otros registros similares omitidos para brevedad)\"]},\"detectedIssues\":[\"El documento contiene múltiples registros de períodos laborales con fechas de baja no siempre especificadas claramente.\",\"Algunos registros corresponden a situaciones de vacaciones no disfrutadas y prestaciones de desempleo, que pueden no ser computables para todas las prestaciones.\",\"El informe indica que los días de alta en empresas de artistas no son definitivos hasta la regularización anual.\",\"El documento no incluye datos relativos a regímenes especiales de funcionarios civiles, fuerzas armadas, funcionarios de justicia ni períodos trabajados en el extranjero.\",\"El documento es válido hasta el 01/04/2028 y debe verificarse con el Código Electrónico de Autenticidad.\"],\"confidenceSummary\":\"Alta confianza en la extracción de datos personales y períodos de cotización, dado que el documento es oficial y contiene referencias electrónicas para autenticidad. Sin embargo, la interpretación de ciertos períodos especiales y situaciones asimiladas a alta puede requerir validación adicional por parte de la Seguridad Social.\"}', 'HIGH', '2026-04-17 20:26:59');
INSERT INTO `finan_document_llm_results` (`id`, `document_id`, `ocr_result_id`, `llm_provider`, `model_name`, `prompt_version`, `raw_response`, `parsed_json`, `confidence_summary`, `processed_at`) VALUES
(21, 16, 22, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"Loan Amortization Schedule\",\n  \"summary\": \"Documento que presenta el cuadro de amortización de un préstamo otorgado por ABANCA SERVICIOS FINANCIEROS a Rafael Peña Vargas. Incluye detalles del préstamo, tipo de interés aplicado, fechas y montos de cuotas de capital e interés, cuotas totales y capital pendiente para cada fecha de pago desde abril de 2026 hasta diciembre de 2029.\",\n  \"extractedFields\": {\n    \"entity\": \"ABANCA SERVICIOS FINANCIEROS, ESTABLECIMIENTO FINANCIERO DE CRÉDITO, S.A.\",\n    \"entityNIF\": \"A28197036\",\n    \"requestDate\": \"31-03-2026\",\n    \"informationType\": \"CUADRO DE AMORTIZACIÓN DE PRÉSTAMO\",\n    \"currency\": \"EUR\",\n    \"loanNumber\": \"8626- 9.852-4\",\n    \"borrower\": \"RAFAEL PEÑA VARGAS\",\n    \"interestRate\": \"8.99%\",\n    \"interestRatePeriod\": \"14-11-2024 a 30-11-2029\",\n    \"amortizationSchedule\": [\n      {\n        \"date\": \"01-04-2026\",\n        \"capitalPayment\": 66.68,\n        \"interestPayment\": 26.62,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 3486.34\n      },\n      {\n        \"date\": \"01-05-2026\",\n        \"capitalPayment\": 67.18,\n        \"interestPayment\": 26.12,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 3419.16\n      },\n      {\n        \"date\": \"01-06-2026\",\n        \"capitalPayment\": 67.68,\n        \"interestPayment\": 25.62,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 3351.48\n      },\n      {\n        \"date\": \"01-07-2026\",\n        \"capitalPayment\": 68.19,\n        \"interestPayment\": 25.11,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 3283.29\n      },\n      {\n        \"date\": \"01-08-2026\",\n        \"capitalPayment\": 68.70,\n        \"interestPayment\": 24.60,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 3214.59\n      },\n      {\n        \"date\": \"01-09-2026\",\n        \"capitalPayment\": 69.22,\n        \"interestPayment\": 24.08,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 3145.37\n      },\n      {\n        \"date\": \"01-10-2026\",\n        \"capitalPayment\": 69.74,\n        \"interestPayment\": 23.56,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 3075.63\n      },\n      {\n        \"date\": \"01-11-2026\",\n        \"capitalPayment\": 70.26,\n        \"interestPayment\": 23.04,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 3005.37\n      },\n      {\n        \"date\": \"01-12-2026\",\n        \"capitalPayment\": 70.78,\n        \"interestPayment\": 22.52,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2934.59\n      },\n      {\n        \"date\": \"01-01-2027\",\n        \"capitalPayment\": 71.32,\n        \"interestPayment\": 21.98,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2863.27\n      },\n      {\n        \"date\": \"01-02-2027\",\n        \"capitalPayment\": 71.85,\n        \"interestPayment\": 21.45,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2791.42\n      },\n      {\n        \"date\": \"01-03-2027\",\n        \"capitalPayment\": 72.39,\n        \"interestPayment\": 20.91,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2719.03\n      },\n      {\n        \"date\": \"01-04-2027\",\n        \"capitalPayment\": 72.93,\n        \"interestPayment\": 20.37,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2646.10\n      },\n      {\n        \"date\": \"01-05-2027\",\n        \"capitalPayment\": 73.48,\n        \"interestPayment\": 19.82,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2572.62\n      },\n      {\n        \"date\": \"01-06-2027\",\n        \"capitalPayment\": 74.03,\n        \"interestPayment\": 19.27,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2498.59\n      },\n      {\n        \"date\": \"01-07-2027\",\n        \"capitalPayment\": 74.58,\n        \"interestPayment\": 18.72,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2424.01\n      },\n      {\n        \"date\": \"01-08-2027\",\n        \"capitalPayment\": 75.14,\n        \"interestPayment\": 18.16,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2348.87\n      },\n      {\n        \"date\": \"01-09-2027\",\n        \"capitalPayment\": 75.70,\n        \"interestPayment\": 17.60,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2273.17\n      },\n      {\n        \"date\": \"01-10-2027\",\n        \"capitalPayment\": 76.27,\n        \"interestPayment\": 17.03,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2196.90\n      },\n      {\n        \"date\": \"01-11-2027\",\n        \"capitalPayment\": 76.84,\n        \"interestPayment\": 16.46,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2120.06\n      },\n      {\n        \"date\": \"01-12-2027\",\n        \"capitalPayment\": 77.42,\n        \"interestPayment\": 15.88,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 2042.64\n      },\n      {\n        \"date\": \"01-01-2028\",\n        \"capitalPayment\": 78.00,\n        \"interestPayment\": 15.30,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1964.64\n      },\n      {\n        \"date\": \"01-02-2028\",\n        \"capitalPayment\": 78.58,\n        \"interestPayment\": 14.72,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1886.06\n      },\n      {\n        \"date\": \"01-03-2028\",\n        \"capitalPayment\": 79.17,\n        \"interestPayment\": 14.13,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1806.89\n      },\n      {\n        \"date\": \"01-04-2028\",\n        \"capitalPayment\": 79.76,\n        \"interestPayment\": 13.54,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1727.13\n      },\n      {\n        \"date\": \"01-05-2028\",\n        \"capitalPayment\": 80.36,\n        \"interestPayment\": 12.94,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1646.77\n      },\n      {\n        \"date\": \"01-06-2028\",\n        \"capitalPayment\": 80.96,\n        \"interestPayment\": 12.34,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1565.81\n      },\n      {\n        \"date\": \"01-07-2028\",\n        \"capitalPayment\": 81.57,\n        \"interestPayment\": 11.73,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1484.24\n      },\n      {\n        \"date\": \"01-08-2028\",\n        \"capitalPayment\": 82.18,\n        \"interestPayment\": 11.12,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1402.06\n      },\n      {\n        \"date\": \"01-09-2028\",\n        \"capitalPayment\": 82.80,\n        \"interestPayment\": 10.50,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1319.26\n      },\n      {\n        \"date\": \"01-10-2028\",\n        \"capitalPayment\": 83.42,\n        \"interestPayment\": 9.88,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1235.84\n      },\n      {\n        \"date\": \"01-11-2028\",\n        \"capitalPayment\": 84.04,\n        \"interestPayment\": 9.26,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1151.80\n      },\n      {\n        \"date\": \"01-12-2028\",\n        \"capitalPayment\": 84.67,\n        \"interestPayment\": 8.63,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 1067.13\n      },\n      {\n        \"date\": \"01-01-2029\",\n        \"capitalPayment\": 85.31,\n        \"interestPayment\": 7.99,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 981.82\n      },\n      {\n        \"date\": \"01-02-2029\",\n        \"capitalPayment\": 85.94,\n        \"interestPayment\": 7.36,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 895.88\n      },\n      {\n        \"date\": \"01-03-2029\",\n        \"capitalPayment\": 86.59,\n        \"interestPayment\": 6.71,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 809.29\n      },\n      {\n        \"date\": \"01-04-2029\",\n        \"capitalPayment\": 87.24,\n        \"interestPayment\": 6.06,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 722.05\n      },\n      {\n        \"date\": \"01-05-2029\",\n        \"capitalPayment\": 87.89,\n        \"interestPayment\": 5.41,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 634.16\n      },\n      {\n        \"date\": \"01-06-2029\",\n        \"capitalPayment\": 88.55,\n        \"interestPayment\": 4.75,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 545.61\n      },\n      {\n        \"date\": \"01-07-2029\",\n        \"capitalPayment\": 89.21,\n        \"interestPayment\": 4.09,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 456.40\n      },\n      {\n        \"date\": \"01-08-2029\",\n        \"capitalPayment\": 89.88,\n        \"interestPayment\": 3.42,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 366.52\n      },\n      {\n        \"date\": \"01-09-2029\",\n        \"capitalPayment\": 90.55,\n        \"interestPayment\": 2.75,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 275.97\n      },\n      {\n        \"date\": \"01-10-2029\",\n        \"capitalPayment\": 91.23,\n        \"interestPayment\": 2.07,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 184.74\n      },\n      {\n        \"date\": \"01-11-2029\",\n        \"capitalPayment\": 91.92,\n        \"interestPayment\": 1.38,\n        \"totalPayment\": 93.30,\n        \"outstandingCapital\": 92.82\n      },\n      {\n        \"date\": \"01-12-2029\",\n        \"capitalPayment\": 92.82,\n        \"interestPayment\": 0.70,\n        \"totalPayment\": 93.52,\n        \"outstandingCapital\": 0.00\n      }\n    ]\n  },\n  \"detectedIssues\": [],\n  \"confidenceSummary\": \"Alta confianza en la extracción de datos debido a la claridad y estructura tabular del documento OCR.\"\n}', '{\"documentType\":\"Loan Amortization Schedule\",\"summary\":\"Documento que presenta el cuadro de amortización de un préstamo otorgado por ABANCA SERVICIOS FINANCIEROS a Rafael Peña Vargas. Incluye detalles del préstamo, tipo de interés aplicado, fechas y montos de cuotas de capital e interés, cuotas totales y capital pendiente para cada fecha de pago desde abril de 2026 hasta diciembre de 2029.\",\"extractedFields\":{\"entity\":\"ABANCA SERVICIOS FINANCIEROS, ESTABLECIMIENTO FINANCIERO DE CRÉDITO, S.A.\",\"entityNIF\":\"A28197036\",\"requestDate\":\"31-03-2026\",\"informationType\":\"CUADRO DE AMORTIZACIÓN DE PRÉSTAMO\",\"currency\":\"EUR\",\"loanNumber\":\"8626- 9.852-4\",\"borrower\":\"RAFAEL PEÑA VARGAS\",\"interestRate\":\"8.99%\",\"interestRatePeriod\":\"14-11-2024 a 30-11-2029\",\"amortizationSchedule\":[{\"date\":\"01-04-2026\",\"capitalPayment\":66.68,\"interestPayment\":26.62,\"totalPayment\":93.3,\"outstandingCapital\":3486.34},{\"date\":\"01-05-2026\",\"capitalPayment\":67.18,\"interestPayment\":26.12,\"totalPayment\":93.3,\"outstandingCapital\":3419.16},{\"date\":\"01-06-2026\",\"capitalPayment\":67.68,\"interestPayment\":25.62,\"totalPayment\":93.3,\"outstandingCapital\":3351.48},{\"date\":\"01-07-2026\",\"capitalPayment\":68.19,\"interestPayment\":25.11,\"totalPayment\":93.3,\"outstandingCapital\":3283.29},{\"date\":\"01-08-2026\",\"capitalPayment\":68.7,\"interestPayment\":24.6,\"totalPayment\":93.3,\"outstandingCapital\":3214.59},{\"date\":\"01-09-2026\",\"capitalPayment\":69.22,\"interestPayment\":24.08,\"totalPayment\":93.3,\"outstandingCapital\":3145.37},{\"date\":\"01-10-2026\",\"capitalPayment\":69.74,\"interestPayment\":23.56,\"totalPayment\":93.3,\"outstandingCapital\":3075.63},{\"date\":\"01-11-2026\",\"capitalPayment\":70.26,\"interestPayment\":23.04,\"totalPayment\":93.3,\"outstandingCapital\":3005.37},{\"date\":\"01-12-2026\",\"capitalPayment\":70.78,\"interestPayment\":22.52,\"totalPayment\":93.3,\"outstandingCapital\":2934.59},{\"date\":\"01-01-2027\",\"capitalPayment\":71.32,\"interestPayment\":21.98,\"totalPayment\":93.3,\"outstandingCapital\":2863.27},{\"date\":\"01-02-2027\",\"capitalPayment\":71.85,\"interestPayment\":21.45,\"totalPayment\":93.3,\"outstandingCapital\":2791.42},{\"date\":\"01-03-2027\",\"capitalPayment\":72.39,\"interestPayment\":20.91,\"totalPayment\":93.3,\"outstandingCapital\":2719.03},{\"date\":\"01-04-2027\",\"capitalPayment\":72.93,\"interestPayment\":20.37,\"totalPayment\":93.3,\"outstandingCapital\":2646.1},{\"date\":\"01-05-2027\",\"capitalPayment\":73.48,\"interestPayment\":19.82,\"totalPayment\":93.3,\"outstandingCapital\":2572.62},{\"date\":\"01-06-2027\",\"capitalPayment\":74.03,\"interestPayment\":19.27,\"totalPayment\":93.3,\"outstandingCapital\":2498.59},{\"date\":\"01-07-2027\",\"capitalPayment\":74.58,\"interestPayment\":18.72,\"totalPayment\":93.3,\"outstandingCapital\":2424.01},{\"date\":\"01-08-2027\",\"capitalPayment\":75.14,\"interestPayment\":18.16,\"totalPayment\":93.3,\"outstandingCapital\":2348.87},{\"date\":\"01-09-2027\",\"capitalPayment\":75.7,\"interestPayment\":17.6,\"totalPayment\":93.3,\"outstandingCapital\":2273.17},{\"date\":\"01-10-2027\",\"capitalPayment\":76.27,\"interestPayment\":17.03,\"totalPayment\":93.3,\"outstandingCapital\":2196.9},{\"date\":\"01-11-2027\",\"capitalPayment\":76.84,\"interestPayment\":16.46,\"totalPayment\":93.3,\"outstandingCapital\":2120.06},{\"date\":\"01-12-2027\",\"capitalPayment\":77.42,\"interestPayment\":15.88,\"totalPayment\":93.3,\"outstandingCapital\":2042.64},{\"date\":\"01-01-2028\",\"capitalPayment\":78,\"interestPayment\":15.3,\"totalPayment\":93.3,\"outstandingCapital\":1964.64},{\"date\":\"01-02-2028\",\"capitalPayment\":78.58,\"interestPayment\":14.72,\"totalPayment\":93.3,\"outstandingCapital\":1886.06},{\"date\":\"01-03-2028\",\"capitalPayment\":79.17,\"interestPayment\":14.13,\"totalPayment\":93.3,\"outstandingCapital\":1806.89},{\"date\":\"01-04-2028\",\"capitalPayment\":79.76,\"interestPayment\":13.54,\"totalPayment\":93.3,\"outstandingCapital\":1727.13},{\"date\":\"01-05-2028\",\"capitalPayment\":80.36,\"interestPayment\":12.94,\"totalPayment\":93.3,\"outstandingCapital\":1646.77},{\"date\":\"01-06-2028\",\"capitalPayment\":80.96,\"interestPayment\":12.34,\"totalPayment\":93.3,\"outstandingCapital\":1565.81},{\"date\":\"01-07-2028\",\"capitalPayment\":81.57,\"interestPayment\":11.73,\"totalPayment\":93.3,\"outstandingCapital\":1484.24},{\"date\":\"01-08-2028\",\"capitalPayment\":82.18,\"interestPayment\":11.12,\"totalPayment\":93.3,\"outstandingCapital\":1402.06},{\"date\":\"01-09-2028\",\"capitalPayment\":82.8,\"interestPayment\":10.5,\"totalPayment\":93.3,\"outstandingCapital\":1319.26},{\"date\":\"01-10-2028\",\"capitalPayment\":83.42,\"interestPayment\":9.88,\"totalPayment\":93.3,\"outstandingCapital\":1235.84},{\"date\":\"01-11-2028\",\"capitalPayment\":84.04,\"interestPayment\":9.26,\"totalPayment\":93.3,\"outstandingCapital\":1151.8},{\"date\":\"01-12-2028\",\"capitalPayment\":84.67,\"interestPayment\":8.63,\"totalPayment\":93.3,\"outstandingCapital\":1067.13},{\"date\":\"01-01-2029\",\"capitalPayment\":85.31,\"interestPayment\":7.99,\"totalPayment\":93.3,\"outstandingCapital\":981.82},{\"date\":\"01-02-2029\",\"capitalPayment\":85.94,\"interestPayment\":7.36,\"totalPayment\":93.3,\"outstandingCapital\":895.88},{\"date\":\"01-03-2029\",\"capitalPayment\":86.59,\"interestPayment\":6.71,\"totalPayment\":93.3,\"outstandingCapital\":809.29},{\"date\":\"01-04-2029\",\"capitalPayment\":87.24,\"interestPayment\":6.06,\"totalPayment\":93.3,\"outstandingCapital\":722.05},{\"date\":\"01-05-2029\",\"capitalPayment\":87.89,\"interestPayment\":5.41,\"totalPayment\":93.3,\"outstandingCapital\":634.16},{\"date\":\"01-06-2029\",\"capitalPayment\":88.55,\"interestPayment\":4.75,\"totalPayment\":93.3,\"outstandingCapital\":545.61},{\"date\":\"01-07-2029\",\"capitalPayment\":89.21,\"interestPayment\":4.09,\"totalPayment\":93.3,\"outstandingCapital\":456.4},{\"date\":\"01-08-2029\",\"capitalPayment\":89.88,\"interestPayment\":3.42,\"totalPayment\":93.3,\"outstandingCapital\":366.52},{\"date\":\"01-09-2029\",\"capitalPayment\":90.55,\"interestPayment\":2.75,\"totalPayment\":93.3,\"outstandingCapital\":275.97},{\"date\":\"01-10-2029\",\"capitalPayment\":91.23,\"interestPayment\":2.07,\"totalPayment\":93.3,\"outstandingCapital\":184.74},{\"date\":\"01-11-2029\",\"capitalPayment\":91.92,\"interestPayment\":1.38,\"totalPayment\":93.3,\"outstandingCapital\":92.82},{\"date\":\"01-12-2029\",\"capitalPayment\":92.82,\"interestPayment\":0.7,\"totalPayment\":93.52,\"outstandingCapital\":0}]},\"detectedIssues\":[],\"confidenceSummary\":\"Alta confianza en la extracción de datos debido a la claridad y estructura tabular del documento OCR.\"}', 'HIGH', '2026-04-17 20:29:17'),
(23, 18, 24, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"RECEIPT\",\n  \"summary\": \"Recibo de taxi del A.P.C de Madrid emitido a Jose Luis Arapiles D el 25/03/2026 por un importe total de 24,05 euros.\",\n  \"extractedFields\": {\n    \"vendorName\": \"TAXI DEL A.P.C DE MADRID\",\n    \"expenseDate\": \"2026-03-25\",\n    \"totalAmount\": 24.05,\n    \"vatAmount\": null,\n    \"paymentMethod\": null,\n    \"lineItems\": [\n      {\n        \"description\": \"Servicio de taxi\",\n        \"distance\": \"9.5 km\",\n        \"amount\": 24.05\n      }\n    ],\n    \"expenseCategories\": [\n      \"Transporte\",\n      \"Taxi\"\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se detecta método de pago.\",\n    \"No se especifica importe del IVA por separado.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la identificación del proveedor, fecha y total. Información de pago y desglose de IVA no disponible.\"\n}', '{\"documentType\":\"RECEIPT\",\"summary\":\"Recibo de taxi del A.P.C de Madrid emitido a Jose Luis Arapiles D el 25/03/2026 por un importe total de 24,05 euros.\",\"extractedFields\":{\"vendorName\":\"TAXI DEL A.P.C DE MADRID\",\"expenseDate\":\"2026-03-25\",\"totalAmount\":24.05,\"vatAmount\":null,\"paymentMethod\":null,\"lineItems\":[{\"description\":\"Servicio de taxi\",\"distance\":\"9.5 km\",\"amount\":24.05}],\"expenseCategories\":[\"Transporte\",\"Taxi\"]},\"detectedIssues\":[\"No se detecta método de pago.\",\"No se especifica importe del IVA por separado.\"],\"confidenceSummary\":\"Alta confianza en la identificación del proveedor, fecha y total. Información de pago y desglose de IVA no disponible.\"}', 'HIGH', '2026-04-17 20:44:16'),
(25, 18, 28, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"RECEIPT\",\n  \"summary\": \"Recibo de taxi del A.P.C de Madrid correspondiente a un servicio realizado el 25/03/2026 con un importe total de 24,05 euros.\",\n  \"extractedFields\": {\n    \"vendorName\": \"TAXI DEL A.P.C DE MADRID\",\n    \"expenseDate\": \"2026-03-25\",\n    \"totalAmount\": 24.05,\n    \"vatAmount\": null,\n    \"paymentMethod\": null,\n    \"lineItems\": [\n      {\n        \"description\": \"Servicio de taxi\",\n        \"distance\": \"9.5 km\",\n        \"amount\": 24.05\n      }\n    ],\n    \"expenseCategories\": [\n      \"Transporte\"\n    ]\n  },\n  \"detectedIssues\": [\n    \"No se detecta el método de pago.\",\n    \"No se especifica el importe del IVA por separado.\",\n    \"No se indican origen y destino del servicio.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en la identificación del proveedor, fecha y total. Baja confianza en detalles de pago y desglose de impuestos.\"\n}', '{\"documentType\":\"RECEIPT\",\"summary\":\"Recibo de taxi del A.P.C de Madrid correspondiente a un servicio realizado el 25/03/2026 con un importe total de 24,05 euros.\",\"extractedFields\":{\"vendorName\":\"TAXI DEL A.P.C DE MADRID\",\"expenseDate\":\"2026-03-25\",\"totalAmount\":24.05,\"vatAmount\":null,\"paymentMethod\":null,\"lineItems\":[{\"description\":\"Servicio de taxi\",\"distance\":\"9.5 km\",\"amount\":24.05}],\"expenseCategories\":[\"Transporte\"]},\"detectedIssues\":[\"No se detecta el método de pago.\",\"No se especifica el importe del IVA por separado.\",\"No se indican origen y destino del servicio.\"],\"confidenceSummary\":\"Alta confianza en la identificación del proveedor, fecha y total. Baja confianza en detalles de pago y desglose de impuestos.\"}', 'HIGH', '2026-04-17 23:08:08'),
(26, 24, 31, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"INVOICE\",\n  \"summary\": \"Factura número 0022552075 emitida el 03/07/2025 a Clínica Dental Donoso para el paciente Peña Vargas Rafael por un tratamiento de raspado y alisado radicular. Total factura exenta de IVA por 110,00 €.\",\n  \"extractedFields\": {\n    \"invoiceNumber\": \"0022552075\",\n    \"issueDate\": \"03/07/2025\",\n    \"vendorName\": \"Clínica Dental Donoso\",\n    \"customerName\": \"Peña Vargas Rafael\",\n    \"subtotalAmount\": \"110,00\",\n    \"vatAmount\": \"0,00\",\n    \"totalAmount\": \"110,00\",\n    \"currency\": \"EUR\",\n    \"conceptos\": [\n      {\n        \"description\": \"Raspado y alisado radicular\",\n        \"amount\": \"110,00\"\n      }\n    ]\n  },\n  \"detectedIssues\": [\n    \"Factura exenta de IVA, por lo que el importe de IVA es 0.\",\n    \"Texto OCR presenta errores y caracteres confusos, posible pérdida de información detallada.\"\n  ],\n  \"confidenceSummary\": \"Alta confianza en número de factura, fecha, importe total y concepto principal. Moderada confianza en nombres debido a errores OCR.\"\n}', '{\"documentType\":\"INVOICE\",\"summary\":\"Factura número 0022552075 emitida el 03/07/2025 a Clínica Dental Donoso para el paciente Peña Vargas Rafael por un tratamiento de raspado y alisado radicular. Total factura exenta de IVA por 110,00 €.\",\"extractedFields\":{\"invoiceNumber\":\"0022552075\",\"issueDate\":\"03/07/2025\",\"vendorName\":\"Clínica Dental Donoso\",\"customerName\":\"Peña Vargas Rafael\",\"subtotalAmount\":\"110,00\",\"vatAmount\":\"0,00\",\"totalAmount\":\"110,00\",\"currency\":\"EUR\",\"conceptos\":[{\"description\":\"Raspado y alisado radicular\",\"amount\":\"110,00\"}]},\"detectedIssues\":[\"Factura exenta de IVA, por lo que el importe de IVA es 0.\",\"Texto OCR presenta errores y caracteres confusos, posible pérdida de información detallada.\"],\"confidenceSummary\":\"Alta confianza en número de factura, fecha, importe total y concepto principal. Moderada confianza en nombres debido a errores OCR.\"}', 'HIGH', '2026-04-19 18:54:23'),
(27, 25, 32, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"RECEIPT\",\n  \"summary\": \"Receipt from Optica Universitaria for an order placed on 01/12/2025 with a total amount of 204.00€ including VAT.\",\n  \"extractedFields\": {\n    \"vendorName\": \"Optica Universitaria\",\n    \"expenseDate\": \"2025-12-01\",\n    \"totalAmount\": 204.00,\n    \"vatAmount\": 18.55,\n    \"paymentMethod\": \"Account payment (Import a compte)\",\n    \"lineItems\": [\n      {\n        \"description\": \"Order payment\",\n        \"amount\": 204.00,\n        \"vatBase\": 185.45,\n        \"vatRate\": 10,\n        \"vatQuota\": 18.55\n      }\n    ],\n    \"expenseCategories\": [\n      \"Health\",\n      \"Optical services\"\n    ]\n  },\n  \"detectedIssues\": [\n    \"The receipt does not specify individual product details or payment method beyond account payment.\",\n    \"The OCR text contains some noise and unclear parts, but key financial data is extracted.\"\n  ],\n  \"confidenceSummary\": \"High confidence in vendor name, dates, and amounts. Moderate confidence in payment method and categories due to limited detail.\"\n}', '{\"documentType\":\"RECEIPT\",\"summary\":\"Receipt from Optica Universitaria for an order placed on 01/12/2025 with a total amount of 204.00€ including VAT.\",\"extractedFields\":{\"vendorName\":\"Optica Universitaria\",\"expenseDate\":\"2025-12-01\",\"totalAmount\":204,\"vatAmount\":18.55,\"paymentMethod\":\"Account payment (Import a compte)\",\"lineItems\":[{\"description\":\"Order payment\",\"amount\":204,\"vatBase\":185.45,\"vatRate\":10,\"vatQuota\":18.55}],\"expenseCategories\":[\"Health\",\"Optical services\"]},\"detectedIssues\":[\"The receipt does not specify individual product details or payment method beyond account payment.\",\"The OCR text contains some noise and unclear parts, but key financial data is extracted.\"],\"confidenceSummary\":\"High confidence in vendor name, dates, and amounts. Moderate confidence in payment method and categories due to limited detail.\"}', 'HIGH', '2026-04-19 18:57:23'),
(28, 26, 33, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"RECEIPT\",\n  \"summary\": \"Receipt from Optica Universitaria for a payment of 204.00€ on 01/12/2025, related to an order with total amount 204.00€ and VAT of 18.55€.\",\n  \"extractedFields\": {\n    \"vendorName\": \"Optica Universitaria\",\n    \"expenseDate\": \"2025-12-01\",\n    \"totalAmount\": 204.00,\n    \"vatAmount\": 18.55,\n    \"paymentMethod\": \"Account payment (Import a compte)\",\n    \"lineItems\": [\n      {\n        \"description\": \"IVA Base 10%\",\n        \"baseAmount\": 185.45,\n        \"vatPercent\": 10,\n        \"vatAmount\": 18.55\n      }\n    ],\n    \"expenseCategories\": [\n      \"Health\",\n      \"Optical services\",\n      \"Medical supplies\"\n    ]\n  },\n  \"detectedIssues\": [\n    \"The payment method is not explicitly detailed beyond \'Import a compte\'.\",\n    \"No detailed line items beyond VAT base and amount are provided.\",\n    \"The OCR text contains some noise and partial words.\"\n  ],\n  \"confidenceSummary\": \"High confidence in vendor name, dates, and amounts. Moderate confidence in payment method and line item details due to limited information.\"\n}', '{\"documentType\":\"RECEIPT\",\"summary\":\"Receipt from Optica Universitaria for a payment of 204.00€ on 01/12/2025, related to an order with total amount 204.00€ and VAT of 18.55€.\",\"extractedFields\":{\"vendorName\":\"Optica Universitaria\",\"expenseDate\":\"2025-12-01\",\"totalAmount\":204,\"vatAmount\":18.55,\"paymentMethod\":\"Account payment (Import a compte)\",\"lineItems\":[{\"description\":\"IVA Base 10%\",\"baseAmount\":185.45,\"vatPercent\":10,\"vatAmount\":18.55}],\"expenseCategories\":[\"Health\",\"Optical services\",\"Medical supplies\"]},\"detectedIssues\":[\"The payment method is not explicitly detailed beyond \'Import a compte\'.\",\"No detailed line items beyond VAT base and amount are provided.\",\"The OCR text contains some noise and partial words.\"],\"confidenceSummary\":\"High confidence in vendor name, dates, and amounts. Moderate confidence in payment method and line item details due to limited information.\"}', 'HIGH', '2026-04-19 18:59:20'),
(29, 27, 34, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"INVOICE\",\n  \"summary\": \"Factura simplificada de Óptica Universitaria con 3 artículos, total 504,44€ incluyendo IVA del 10%.\",\n  \"extractedFields\": {\n    \"invoiceNumber\": \"103021565\",\n    \"issueDate\": \"25/11/2025\",\n    \"vendorName\": \"Óptica Universitaria\",\n    \"customerName\": \"OPTICA DEL PENEDES\",\n    \"subtotalAmount\": \"458,58€\",\n    \"vatAmount\": \"45,86€\",\n    \"totalAmount\": \"504,44€\",\n    \"currency\": \"EUR\",\n    \"conceptos\": [\n      {\n        \"description\": \"CARRERA-VICTORY -C-06/G\",\n        \"quantity\": 1,\n        \"unitPrice\": \"110,55€\",\n        \"totalPrice\": \"110,55€\"\n      },\n      {\n        \"description\": \"Prg. Precision Superb DuraVision Platinum 1.6\",\n        \"quantity\": 1,\n        \"unitPrice\": \"260,00€\",\n        \"totalPrice\": \"260,00€\"\n      },\n      {\n        \"description\": \"Prg. Precision Superb DuraVision Platinum 1.6\",\n        \"quantity\": 1,\n        \"unitPrice\": \"260,00€\",\n        \"totalPrice\": \"260,00€\"\n      }\n    ],\n    \"discounts\": \"-126,11€\"\n  },\n  \"detectedIssues\": [\n    \"El texto OCR presenta errores y algunas palabras están incompletas o mal reconocidas.\",\n    \"El nombre del cliente está en mayúsculas y podría no ser el nombre completo.\",\n    \"Los precios de los dos últimos artículos parecen repetidos, lo que podría ser un error o reflejar dos unidades iguales.\"\n  ],\n  \"confidenceSummary\": \"Confianza media debido a la calidad del OCR y la presencia de errores en el texto, aunque los datos clave como número de factura, fecha, totales y conceptos principales están identificados con razonable certeza.\"\n}', '{\"documentType\":\"INVOICE\",\"summary\":\"Factura simplificada de Óptica Universitaria con 3 artículos, total 504,44€ incluyendo IVA del 10%.\",\"extractedFields\":{\"invoiceNumber\":\"103021565\",\"issueDate\":\"25/11/2025\",\"vendorName\":\"Óptica Universitaria\",\"customerName\":\"OPTICA DEL PENEDES\",\"subtotalAmount\":\"458,58€\",\"vatAmount\":\"45,86€\",\"totalAmount\":\"504,44€\",\"currency\":\"EUR\",\"conceptos\":[{\"description\":\"CARRERA-VICTORY -C-06/G\",\"quantity\":1,\"unitPrice\":\"110,55€\",\"totalPrice\":\"110,55€\"},{\"description\":\"Prg. Precision Superb DuraVision Platinum 1.6\",\"quantity\":1,\"unitPrice\":\"260,00€\",\"totalPrice\":\"260,00€\"},{\"description\":\"Prg. Precision Superb DuraVision Platinum 1.6\",\"quantity\":1,\"unitPrice\":\"260,00€\",\"totalPrice\":\"260,00€\"}],\"discounts\":\"-126,11€\"},\"detectedIssues\":[\"El texto OCR presenta errores y algunas palabras están incompletas o mal reconocidas.\",\"El nombre del cliente está en mayúsculas y podría no ser el nombre completo.\",\"Los precios de los dos últimos artículos parecen repetidos, lo que podría ser un error o reflejar dos unidades iguales.\"],\"confidenceSummary\":\"Confianza media debido a la calidad del OCR y la presencia de errores en el texto, aunque los datos clave como número de factura, fecha, totales y conceptos principales están identificados con razonable certeza.\"}', 'MEDIUM', '2026-04-19 19:00:32'),
(30, 28, 35, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"INVOICE\",\n  \"summary\": \"Factura simplificada de Óptica & Audiología con fecha 25/11/2025, incluye 3 artículos con descuentos aplicados y detalle de IVA al 10%.\",\n  \"extractedFields\": {\n    \"invoiceNumber\": \"103021567\",\n    \"issueDate\": \"25/11/2025\",\n    \"vendorName\": \"Óptica & Audiología\",\n    \"customerName\": \"ORTIGA DEL FENEDES\",\n    \"subtotalAmount\": \"28,36€\",\n    \"vatAmount\": \"2,84€\",\n    \"totalAmount\": \"31,20€\",\n    \"currency\": \"EUR\",\n    \"conceptos\": [\n      {\n        \"description\": \"BEO-570/G\",\n        \"quantity\": 1,\n        \"unitPrice\": \"39,00€\",\n        \"totalPrice\": \"39,00€\"\n      },\n      {\n        \"description\": \"Officelens Plus BlueGuard Dura Vision Platiniu m 1,6\",\n        \"quantity\": 1,\n        \"unitPrice\": \"128,50€\",\n        \"totalPrice\": \"128,50€\"\n      },\n      {\n        \"description\": \"Officelens Plus BlueGuard Dura Vision Platiniu m 1,6\",\n        \"quantity\": 4,\n        \"unitPrice\": \"128,50€\",\n        \"totalPrice\": \"128,50€\"\n      }\n    ],\n    \"discounts\": \"-264,80€\"\n  },\n  \"detectedIssues\": [\n    \"El total de los conceptos antes de descuento (39 + 128,50 + 128,50) no coincide con el subtotal indicado (28,36€).\",\n    \"El descuento aplicado (-264,80€) parece mayor que la suma de los precios unitarios, lo que genera inconsistencia.\",\n    \"El nombre del cliente está incompleto o poco claro (\'ORTIGA DEL FENEDES, Ss: BREA OULU\').\"\n  ],\n  \"confidenceSummary\": \"Media. Los datos principales están presentes pero hay inconsistencias en los importes y posibles errores en el texto OCR que afectan la precisión.\"\n}', '{\"documentType\":\"INVOICE\",\"summary\":\"Factura simplificada de Óptica & Audiología con fecha 25/11/2025, incluye 3 artículos con descuentos aplicados y detalle de IVA al 10%.\",\"extractedFields\":{\"invoiceNumber\":\"103021567\",\"issueDate\":\"25/11/2025\",\"vendorName\":\"Óptica & Audiología\",\"customerName\":\"ORTIGA DEL FENEDES\",\"subtotalAmount\":\"28,36€\",\"vatAmount\":\"2,84€\",\"totalAmount\":\"31,20€\",\"currency\":\"EUR\",\"conceptos\":[{\"description\":\"BEO-570/G\",\"quantity\":1,\"unitPrice\":\"39,00€\",\"totalPrice\":\"39,00€\"},{\"description\":\"Officelens Plus BlueGuard Dura Vision Platiniu m 1,6\",\"quantity\":1,\"unitPrice\":\"128,50€\",\"totalPrice\":\"128,50€\"},{\"description\":\"Officelens Plus BlueGuard Dura Vision Platiniu m 1,6\",\"quantity\":4,\"unitPrice\":\"128,50€\",\"totalPrice\":\"128,50€\"}],\"discounts\":\"-264,80€\"},\"detectedIssues\":[\"El total de los conceptos antes de descuento (39 + 128,50 + 128,50) no coincide con el subtotal indicado (28,36€).\",\"El descuento aplicado (-264,80€) parece mayor que la suma de los precios unitarios, lo que genera inconsistencia.\",\"El nombre del cliente está incompleto o poco claro (\'ORTIGA DEL FENEDES, Ss: BREA OULU\').\"],\"confidenceSummary\":\"Media. Los datos principales están presentes pero hay inconsistencias en los importes y posibles errores en el texto OCR que afectan la precisión.\"}', 'MEDIUM', '2026-04-19 19:01:16'),
(31, 29, 36, 'openai', 'gpt-4.1-mini', 'v1', '{\n  \"documentType\": \"Loan Statement\",\n  \"summary\": \"Extracto de préstamo personal emitido por ABANCA Servicios Financieros, detallando el préstamo con número 862086260098524, con intereses ordinarios aplicados al período del 14-11-2024 al 30-11-2025 a una tasa del 8.99%, generando un importe de intereses ordinarios de 393,01 EUR.\",\n  \"extractedFields\": {\n    \"entity\": \"ABANCA Servicios Financieros, Establecimiento Financiero de Crédito, S.A.\",\n    \"entityNIF\": \"A28197036\",\n    \"loanType\": \"Préstamo Personal\",\n    \"loanNumber\": \"862086260098524\",\n    \"interestRate\": \"8.99%\",\n    \"interestPeriodStart\": \"14-11-2024\",\n    \"interestPeriodEnd\": \"30-11-2025\",\n    \"interestAmount\": \"393,01 EUR\",\n    \"address\": \"Rúa Nueva, n°30, 15003 A Coruña\"\n  },\n  \"detectedIssues\": [\n    \"Texto OCR presenta errores y caracteres confusos que dificultan la lectura completa y precisa.\",\n    \"Algunos datos parecen incompletos o mal segmentados, por ejemplo, líneas con caracteres no reconocibles.\"\n  ],\n  \"confidenceSummary\": \"La información clave del préstamo y los intereses ha sido identificada con un nivel de confianza medio, aunque la calidad del OCR limita la precisión total.\"\n}', '{\"documentType\":\"Loan Statement\",\"summary\":\"Extracto de préstamo personal emitido por ABANCA Servicios Financieros, detallando el préstamo con número 862086260098524, con intereses ordinarios aplicados al período del 14-11-2024 al 30-11-2025 a una tasa del 8.99%, generando un importe de intereses ordinarios de 393,01 EUR.\",\"extractedFields\":{\"entity\":\"ABANCA Servicios Financieros, Establecimiento Financiero de Crédito, S.A.\",\"entityNIF\":\"A28197036\",\"loanType\":\"Préstamo Personal\",\"loanNumber\":\"862086260098524\",\"interestRate\":\"8.99%\",\"interestPeriodStart\":\"14-11-2024\",\"interestPeriodEnd\":\"30-11-2025\",\"interestAmount\":\"393,01 EUR\",\"address\":\"Rúa Nueva, n°30, 15003 A Coruña\"},\"detectedIssues\":[\"Texto OCR presenta errores y caracteres confusos que dificultan la lectura completa y precisa.\",\"Algunos datos parecen incompletos o mal segmentados, por ejemplo, líneas con caracteres no reconocibles.\"],\"confidenceSummary\":\"La información clave del préstamo y los intereses ha sido identificada con un nivel de confianza medio, aunque la calidad del OCR limita la precisión total.\"}', 'MEDIUM', '2026-04-19 19:02:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_document_ocr_results`
--

CREATE TABLE `finan_document_ocr_results` (
  `id` bigint(20) NOT NULL,
  `document_id` bigint(20) NOT NULL,
  `ocr_provider` varchar(100) NOT NULL,
  `raw_text` longtext NOT NULL,
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `processed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_document_ocr_results`
--

INSERT INTO `finan_document_ocr_results` (`id`, `document_id`, `ocr_provider`, `raw_text`, `confidence_score`, `processed_at`) VALUES
(11, 10, 'pdf-parse', 'PEÑA VARGAS, RAFAEL\nPZ OVEPARD 2 1 2\n25005 LLEIDA\nLLEIDA\nNIF. B43937655 3158\nEMPRESA DOMICILI N. INS. S.S.\nWEB ADVANCED DEVELOPMENT S.L. AV. SANT JORDI 42-46 BL.A LC 43/1097234-37\nTREBALLADOR/A NºMATRIC ANTIGUITAT DNI	CATEGORIA\nPEÑA VARGAS, RAFAEL PROGRAMADO 1 ABR 24 43735032A\nN. AFILIACIÓ SS TARIFA COD.CT SECCIÓ PERÍODE	NRO. TOT. DIES\n25/00484240-73 2 200 37 MENS 01 GEN 26 a 31 GEN 26 30\nQUANTIA PREU CONCEPTE PERCEPCIONS DEDUCCIONS\n30,00 22,988 1 *Salario Base 689,64\n30,00 2,332 2 *Plus Convenio 69,96\n30,00 1,916 7 *Paga Extra Verano 57,47\n30,00 1,916 8 *Paga Extra Navidad 57,47\n33 *Complemento a Líquido 0,35\n30,00 6,488 201 *A Cuenta Convenio 194,63\n995 COTIZACION CONT.COMU 4,70 50,27\n994 COTIZACION MEI 0,15 1,60\n996 COTIZACION FORMACION 0,10 1,07\n997 COTIZACION DESEMPLEO 1,55 16,58\nBASE SS T. DEDUCCIONS	REM. TOTAL P.P.EXTRES BASE IRPF T. PERCEPCIONS	BASE A.T. i ATUR\n1.069,52 1.069,52 1.069,52 1.069,52 1.069,52 69,52\n- Percepcions no Salarials excloses Cot. SS	* Percepcions Salarials subjectes a Cot. SS\nDATA SEGELL EMPRESA HE REBUT\n31 GENER 2026\nTORREDEMBARRA\nLÍQUID A PERCEBRE\n1.000,00\nIBAN:\nSWIFT/BIC:\nDETERMINACIÓ DE LES BASES DE COTITZACIÓ A LA S.S. I CONCEPTES DE RECAPTACIÓ CONJUNTA I APORTACIÓ DE L\'EMPRESA\nCONCEPTE BASE TIPUS APORTACIÓ EMPRESARIAL\n1.069,52 23,60 252,41	1. Contingències comuns............................................................\n1.069,52 0,75 8,03	Mecanisme Equitat Intergeneracional (MEI)....................\nAT i MP....................................... 1.069,52 1,65 17,65\n2. Contingències pro-\nfessionals i conceptes de\nrecaptació conjunta\nAtur............................................ 1.069,52 5,50 58,82\nFormació Professional................ 1.069,52 0,60 6,42\nFons Garantía Salarial................ 1.069,52 0,20 2,14\n3. Cotització addicional hores extraordinàries............................\n4. Cotització addicional de solidaritat..........................................\n\n-- 1 of 1 --', NULL, '2026-04-16 23:01:01'),
(12, 10, 'pdf-parse', 'PEÑA VARGAS, RAFAEL\nPZ OVEPARD 2 1 2\n25005 LLEIDA\nLLEIDA\nNIF. B43937655 3158\nEMPRESA DOMICILI N. INS. S.S.\nWEB ADVANCED DEVELOPMENT S.L. AV. SANT JORDI 42-46 BL.A LC 43/1097234-37\nTREBALLADOR/A NºMATRIC ANTIGUITAT DNI	CATEGORIA\nPEÑA VARGAS, RAFAEL PROGRAMADO 1 ABR 24 43735032A\nN. AFILIACIÓ SS TARIFA COD.CT SECCIÓ PERÍODE	NRO. TOT. DIES\n25/00484240-73 2 200 37 MENS 01 GEN 26 a 31 GEN 26 30\nQUANTIA PREU CONCEPTE PERCEPCIONS DEDUCCIONS\n30,00 22,988 1 *Salario Base 689,64\n30,00 2,332 2 *Plus Convenio 69,96\n30,00 1,916 7 *Paga Extra Verano 57,47\n30,00 1,916 8 *Paga Extra Navidad 57,47\n33 *Complemento a Líquido 0,35\n30,00 6,488 201 *A Cuenta Convenio 194,63\n995 COTIZACION CONT.COMU 4,70 50,27\n994 COTIZACION MEI 0,15 1,60\n996 COTIZACION FORMACION 0,10 1,07\n997 COTIZACION DESEMPLEO 1,55 16,58\nBASE SS T. DEDUCCIONS	REM. TOTAL P.P.EXTRES BASE IRPF T. PERCEPCIONS	BASE A.T. i ATUR\n1.069,52 1.069,52 1.069,52 1.069,52 1.069,52 69,52\n- Percepcions no Salarials excloses Cot. SS	* Percepcions Salarials subjectes a Cot. SS\nDATA SEGELL EMPRESA HE REBUT\n31 GENER 2026\nTORREDEMBARRA\nLÍQUID A PERCEBRE\n1.000,00\nIBAN:\nSWIFT/BIC:\nDETERMINACIÓ DE LES BASES DE COTITZACIÓ A LA S.S. I CONCEPTES DE RECAPTACIÓ CONJUNTA I APORTACIÓ DE L\'EMPRESA\nCONCEPTE BASE TIPUS APORTACIÓ EMPRESARIAL\n1.069,52 23,60 252,41	1. Contingències comuns............................................................\n1.069,52 0,75 8,03	Mecanisme Equitat Intergeneracional (MEI)....................\nAT i MP....................................... 1.069,52 1,65 17,65\n2. Contingències pro-\nfessionals i conceptes de\nrecaptació conjunta\nAtur............................................ 1.069,52 5,50 58,82\nFormació Professional................ 1.069,52 0,60 6,42\nFons Garantía Salarial................ 1.069,52 0,20 2,14\n3. Cotització addicional hores extraordinàries............................\n4. Cotització addicional de solidaritat..........................................\n\n-- 1 of 1 --', NULL, '2026-04-16 23:02:22'),
(13, 10, 'pdf-parse', 'PEÑA VARGAS, RAFAEL\nPZ OVEPARD 2 1 2\n25005 LLEIDA\nLLEIDA\nNIF. B43937655 3158\nEMPRESA DOMICILI N. INS. S.S.\nWEB ADVANCED DEVELOPMENT S.L. AV. SANT JORDI 42-46 BL.A LC 43/1097234-37\nTREBALLADOR/A NºMATRIC ANTIGUITAT DNI	CATEGORIA\nPEÑA VARGAS, RAFAEL PROGRAMADO 1 ABR 24 43735032A\nN. AFILIACIÓ SS TARIFA COD.CT SECCIÓ PERÍODE	NRO. TOT. DIES\n25/00484240-73 2 200 37 MENS 01 GEN 26 a 31 GEN 26 30\nQUANTIA PREU CONCEPTE PERCEPCIONS DEDUCCIONS\n30,00 22,988 1 *Salario Base 689,64\n30,00 2,332 2 *Plus Convenio 69,96\n30,00 1,916 7 *Paga Extra Verano 57,47\n30,00 1,916 8 *Paga Extra Navidad 57,47\n33 *Complemento a Líquido 0,35\n30,00 6,488 201 *A Cuenta Convenio 194,63\n995 COTIZACION CONT.COMU 4,70 50,27\n994 COTIZACION MEI 0,15 1,60\n996 COTIZACION FORMACION 0,10 1,07\n997 COTIZACION DESEMPLEO 1,55 16,58\nBASE SS T. DEDUCCIONS	REM. TOTAL P.P.EXTRES BASE IRPF T. PERCEPCIONS	BASE A.T. i ATUR\n1.069,52 1.069,52 1.069,52 1.069,52 1.069,52 69,52\n- Percepcions no Salarials excloses Cot. SS	* Percepcions Salarials subjectes a Cot. SS\nDATA SEGELL EMPRESA HE REBUT\n31 GENER 2026\nTORREDEMBARRA\nLÍQUID A PERCEBRE\n1.000,00\nIBAN:\nSWIFT/BIC:\nDETERMINACIÓ DE LES BASES DE COTITZACIÓ A LA S.S. I CONCEPTES DE RECAPTACIÓ CONJUNTA I APORTACIÓ DE L\'EMPRESA\nCONCEPTE BASE TIPUS APORTACIÓ EMPRESARIAL\n1.069,52 23,60 252,41	1. Contingències comuns............................................................\n1.069,52 0,75 8,03	Mecanisme Equitat Intergeneracional (MEI)....................\nAT i MP....................................... 1.069,52 1,65 17,65\n2. Contingències pro-\nfessionals i conceptes de\nrecaptació conjunta\nAtur............................................ 1.069,52 5,50 58,82\nFormació Professional................ 1.069,52 0,60 6,42\nFons Garantía Salarial................ 1.069,52 0,20 2,14\n3. Cotització addicional hores extraordinàries............................\n4. Cotització addicional de solidaritat..........................................\n\n-- 1 of 1 --', NULL, '2026-04-16 23:08:01'),
(14, 10, 'pdf-parse', 'PEÑA VARGAS, RAFAEL\nPZ OVEPARD 2 1 2\n25005 LLEIDA\nLLEIDA\nNIF. B43937655 3158\nEMPRESA DOMICILI N. INS. S.S.\nWEB ADVANCED DEVELOPMENT S.L. AV. SANT JORDI 42-46 BL.A LC 43/1097234-37\nTREBALLADOR/A NºMATRIC ANTIGUITAT DNI	CATEGORIA\nPEÑA VARGAS, RAFAEL PROGRAMADO 1 ABR 24 43735032A\nN. AFILIACIÓ SS TARIFA COD.CT SECCIÓ PERÍODE	NRO. TOT. DIES\n25/00484240-73 2 200 37 MENS 01 GEN 26 a 31 GEN 26 30\nQUANTIA PREU CONCEPTE PERCEPCIONS DEDUCCIONS\n30,00 22,988 1 *Salario Base 689,64\n30,00 2,332 2 *Plus Convenio 69,96\n30,00 1,916 7 *Paga Extra Verano 57,47\n30,00 1,916 8 *Paga Extra Navidad 57,47\n33 *Complemento a Líquido 0,35\n30,00 6,488 201 *A Cuenta Convenio 194,63\n995 COTIZACION CONT.COMU 4,70 50,27\n994 COTIZACION MEI 0,15 1,60\n996 COTIZACION FORMACION 0,10 1,07\n997 COTIZACION DESEMPLEO 1,55 16,58\nBASE SS T. DEDUCCIONS	REM. TOTAL P.P.EXTRES BASE IRPF T. PERCEPCIONS	BASE A.T. i ATUR\n1.069,52 1.069,52 1.069,52 1.069,52 1.069,52 69,52\n- Percepcions no Salarials excloses Cot. SS	* Percepcions Salarials subjectes a Cot. SS\nDATA SEGELL EMPRESA HE REBUT\n31 GENER 2026\nTORREDEMBARRA\nLÍQUID A PERCEBRE\n1.000,00\nIBAN:\nSWIFT/BIC:\nDETERMINACIÓ DE LES BASES DE COTITZACIÓ A LA S.S. I CONCEPTES DE RECAPTACIÓ CONJUNTA I APORTACIÓ DE L\'EMPRESA\nCONCEPTE BASE TIPUS APORTACIÓ EMPRESARIAL\n1.069,52 23,60 252,41	1. Contingències comuns............................................................\n1.069,52 0,75 8,03	Mecanisme Equitat Intergeneracional (MEI)....................\nAT i MP....................................... 1.069,52 1,65 17,65\n2. Contingències pro-\nfessionals i conceptes de\nrecaptació conjunta\nAtur............................................ 1.069,52 5,50 58,82\nFormació Professional................ 1.069,52 0,60 6,42\nFons Garantía Salarial................ 1.069,52 0,20 2,14\n3. Cotització addicional hores extraordinàries............................\n4. Cotització addicional de solidaritat..........................................\n\n-- 1 of 1 --', NULL, '2026-04-16 23:12:04'),
(15, 10, 'pdf-parse', 'PEÑA VARGAS, RAFAEL\nPZ OVEPARD 2 1 2\n25005 LLEIDA\nLLEIDA\nNIF. B43937655 3158\nEMPRESA DOMICILI N. INS. S.S.\nWEB ADVANCED DEVELOPMENT S.L. AV. SANT JORDI 42-46 BL.A LC 43/1097234-37\nTREBALLADOR/A NºMATRIC ANTIGUITAT DNI	CATEGORIA\nPEÑA VARGAS, RAFAEL PROGRAMADO 1 ABR 24 43735032A\nN. AFILIACIÓ SS TARIFA COD.CT SECCIÓ PERÍODE	NRO. TOT. DIES\n25/00484240-73 2 200 37 MENS 01 GEN 26 a 31 GEN 26 30\nQUANTIA PREU CONCEPTE PERCEPCIONS DEDUCCIONS\n30,00 22,988 1 *Salario Base 689,64\n30,00 2,332 2 *Plus Convenio 69,96\n30,00 1,916 7 *Paga Extra Verano 57,47\n30,00 1,916 8 *Paga Extra Navidad 57,47\n33 *Complemento a Líquido 0,35\n30,00 6,488 201 *A Cuenta Convenio 194,63\n995 COTIZACION CONT.COMU 4,70 50,27\n994 COTIZACION MEI 0,15 1,60\n996 COTIZACION FORMACION 0,10 1,07\n997 COTIZACION DESEMPLEO 1,55 16,58\nBASE SS T. DEDUCCIONS	REM. TOTAL P.P.EXTRES BASE IRPF T. PERCEPCIONS	BASE A.T. i ATUR\n1.069,52 1.069,52 1.069,52 1.069,52 1.069,52 69,52\n- Percepcions no Salarials excloses Cot. SS	* Percepcions Salarials subjectes a Cot. SS\nDATA SEGELL EMPRESA HE REBUT\n31 GENER 2026\nTORREDEMBARRA\nLÍQUID A PERCEBRE\n1.000,00\nIBAN:\nSWIFT/BIC:\nDETERMINACIÓ DE LES BASES DE COTITZACIÓ A LA S.S. I CONCEPTES DE RECAPTACIÓ CONJUNTA I APORTACIÓ DE L\'EMPRESA\nCONCEPTE BASE TIPUS APORTACIÓ EMPRESARIAL\n1.069,52 23,60 252,41	1. Contingències comuns............................................................\n1.069,52 0,75 8,03	Mecanisme Equitat Intergeneracional (MEI)....................\nAT i MP....................................... 1.069,52 1,65 17,65\n2. Contingències pro-\nfessionals i conceptes de\nrecaptació conjunta\nAtur............................................ 1.069,52 5,50 58,82\nFormació Professional................ 1.069,52 0,60 6,42\nFons Garantía Salarial................ 1.069,52 0,20 2,14\n3. Cotització addicional hores extraordinàries............................\n4. Cotització addicional de solidaritat..........................................\n\n-- 1 of 1 --', NULL, '2026-04-16 23:23:29'),
(16, 11, 'pdf-parse', 'PEÑA VARGAS, RAFAEL\nPZ OVEPARD 2 1 2\n25005 LLEIDA\nLLEIDA\nNIF. B43937655 3158\nEMPRESA DOMICILI N. INS. S.S.\nWEB ADVANCED DEVELOPMENT S.L. AV. SANT JORDI 42-46 BL.A LC 43/1097234-37\nTREBALLADOR/A NºMATRIC ANTIGUITAT DNI	CATEGORIA\nPEÑA VARGAS, RAFAEL PROGRAMADO 1 ABR 24 43735032A\nN. AFILIACIÓ SS TARIFA COD.CT SECCIÓ PERÍODE	NRO. TOT. DIES\n25/00484240-73 2 200 37 MENS 01 FEB 26 a 28 FEB 26 30\nQUANTIA PREU CONCEPTE PERCEPCIONS DEDUCCIONS\n30,00 22,988 1 *Salario Base 689,64\n30,00 2,332 2 *Plus Convenio 69,96\n30,00 1,916 7 *Paga Extra Verano 57,47\n30,00 1,916 8 *Paga Extra Navidad 57,47\n33 *Complemento a Líquido 0,35\n30,00 6,488 201 *A Cuenta Convenio 194,63\n995 COTIZACION CONT.COMU 4,70 50,27\n994 COTIZACION MEI 0,15 1,60\n996 COTIZACION FORMACION 0,10 1,07\n997 COTIZACION DESEMPLEO 1,55 16,58\nBASE SS T. DEDUCCIONS	REM. TOTAL P.P.EXTRES BASE IRPF T. PERCEPCIONS	BASE A.T. i ATUR\n1.069,52 1.069,52 1.069,52 1.069,52 1.069,52 69,52\n- Percepcions no Salarials excloses Cot. SS	* Percepcions Salarials subjectes a Cot. SS\nDATA SEGELL EMPRESA HE REBUT\n28 FEBRER 2026\nTORREDEMBARRA\nLÍQUID A PERCEBRE\n1.000,00\nIBAN:\nSWIFT/BIC:\nDETERMINACIÓ DE LES BASES DE COTITZACIÓ A LA S.S. I CONCEPTES DE RECAPTACIÓ CONJUNTA I APORTACIÓ DE L\'EMPRESA\nCONCEPTE BASE TIPUS APORTACIÓ EMPRESARIAL\n1.069,52 23,60 252,41	1. Contingències comuns............................................................\n1.069,52 0,75 8,03	Mecanisme Equitat Intergeneracional (MEI)....................\nAT i MP....................................... 1.069,52 1,65 17,65\n2. Contingències pro-\nfessionals i conceptes de\nrecaptació conjunta\nAtur............................................ 1.069,52 5,50 58,82\nFormació Professional................ 1.069,52 0,60 6,42\nFons Garantía Salarial................ 1.069,52 0,20 2,14\n3. Cotització addicional hores extraordinàries............................\n4. Cotització addicional de solidaritat..........................................\n\n-- 1 of 1 --', NULL, '2026-04-16 23:30:30'),
(17, 12, 'pdf-parse', 'PEÑA VARGAS, RAFAEL\nPZ OVEPARD 2 1 2\n25005 LLEIDA\nLLEIDA\nNIF. B43937655 3158\nEMPRESA DOMICILI N. INS. S.S.\nWEB ADVANCED DEVELOPMENT S.L. AV. SANT JORDI 42-46 BL.A LC 43/1097234-37\nTREBALLADOR/A NºMATRIC ANTIGUITAT DNI	CATEGORIA\nPEÑA VARGAS, RAFAEL PROGRAMADO 1 ABR 24 43735032A\nN. AFILIACIÓ SS TARIFA COD.CT SECCIÓ PERÍODE	NRO. TOT. DIES\n25/00484240-73 2 200 37 MENS 01 MAR 26 a 31 MAR 26 30\nQUANTIA PREU CONCEPTE PERCEPCIONS DEDUCCIONS\n30,00 22,988 1 *Salario Base 689,64\n30,00 2,332 2 *Plus Convenio 69,96\n30,00 1,916 7 *Paga Extra Verano 57,47\n30,00 1,916 8 *Paga Extra Navidad 57,47\n33 *Complemento a Líquido 0,35\n30,00 6,488 201 *A Cuenta Convenio 194,63\n995 COTIZACION CONT.COMU 4,70 50,27\n994 COTIZACION MEI 0,15 1,60\n996 COTIZACION FORMACION 0,10 1,07\n997 COTIZACION DESEMPLEO 1,55 16,58\nBASE SS T. DEDUCCIONS	REM. TOTAL P.P.EXTRES BASE IRPF T. PERCEPCIONS	BASE A.T. i ATUR\n1.069,52 1.069,52 1.069,52 1.069,52 1.069,52 69,52\n- Percepcions no Salarials excloses Cot. SS	* Percepcions Salarials subjectes a Cot. SS\nDATA SEGELL EMPRESA HE REBUT\n31 MARÇ 2026\nTORREDEMBARRA\nLÍQUID A PERCEBRE\n1.000,00\nIBAN:\nSWIFT/BIC:\nDETERMINACIÓ DE LES BASES DE COTITZACIÓ A LA S.S. I CONCEPTES DE RECAPTACIÓ CONJUNTA I APORTACIÓ DE L\'EMPRESA\nCONCEPTE BASE TIPUS APORTACIÓ EMPRESARIAL\n1.069,52 23,60 252,41	1. Contingències comuns............................................................\n1.069,52 0,75 8,03	Mecanisme Equitat Intergeneracional (MEI)....................\nAT i MP....................................... 1.069,52 1,65 17,65\n2. Contingències pro-\nfessionals i conceptes de\nrecaptació conjunta\nAtur............................................ 1.069,52 5,50 58,82\nFormació Professional................ 1.069,52 0,60 6,42\nFons Garantía Salarial................ 1.069,52 0,20 2,14\n3. Cotització addicional hores extraordinàries............................\n4. Cotització addicional de solidaritat..........................................\n\n-- 1 of 1 --', NULL, '2026-04-16 23:31:02'),
(18, 13, 'pdf-parse', 'Periodo Código Concepto Cantidad/Base Precio/% Devengos Deducciones\n12/25 R1A Salario Base 30,00 60,4731 1.814,19\n12/25 R2Z Plus Convenio 30,00 5,2304 156,91\n12/25 R1I Mejora Voluntaria 30,00 41,6774 1.250,32\n12/25 RA4 Complemento Teletrabajo 30,00 2,5000 75,00\n12/25 U9B Seguro Médico Flexible -52,30\n12/25 R3R Prorrata Paga Extra 536,91\n12/25 700 Cotización Sal. Desempleo+Fogasa+F. 3.833,33 1,6500 63,25\n12/25 705 Cotización Sal. Contingencias Comun 3.833,33 4,8300 185,15\n12/25 F74 I.R.P.F. 3.781,03 21,1800 800,82\n12/25 FE4 INGRESO A CUENTA 10,63 21,1800 2,25\nTECNOLOGÍAS PLEXUS S.L. Señor RAFAEL PEÑA VARGAS\nCL ISIDRO PARGA PONDAL LOC CL VELAZQUEZ 2, 1 7\n15890 SANTIAGO DE COMPOSTE 43830 TORREDEMBARRA\nA Coruña TARRAGONA\nCIF: B15726177\nCCC: 08/2112996/71\nNº empleado D.N.I. Nº Seguridad Social Fecha alta Periodo de liquidación Nº\ndías\nCentro de trabajo Empleo Contrato Antigüedad Grupo\nPLEXUS BARCELONA Analista Programador Indefinido TC 03/11/2023 02\n01 31 Diciembre 2025 30	PLX05174 43735032-A 25/00484240/73 03/11/2023 Del al de\nSeguridad Social Totales 3.781,03 1.051,47\nContigencias Accidente Prorrata Horas Extras\nEmpresa Empleado Total\nAportaciones a la Seguridad Social a cargo de la empresa por todos los conceptos\n% C.C. Imp C.C. Imp HHEE % Des Imp Des % For Imp For % FOG Imp FOG % AT/EP Imp AT/EP Base Sol Cuota Sol\n24,27 930,35 5,5 210,83 0,6 23 0,2 7,67 1,6 63,25\nLíquido a percibir 2.729,56\nComunes de Trabajo Pagas Extras Normales F.Mayor\n3.833,33 3.833,33 Modo de pago\nCotización\nTransferencia\n248,4 1.483,5	1.235,1 PEÑA VARGAS, RAFAEL\nAcumulados CAIXABANK, S.A.\nImponible I.R.P.F. Retención I.R.P.F. Cotización S.S. 2100 0359 45 01004****\n45.958,29 9.808,33 2.980,80\nPágina 1/1\n\n-- 1 of 1 --', NULL, '2026-04-16 23:31:59'),
(19, 14, 'pdf-parse', 'NERIA\nA la atención de: Acho Pacheco\nSABALA SA\nC/ Carrer 45789 Barcelona\nFecha: 16/4/26\nTítulo del proyecto: Subida de archivos\nDescripción del proyecto: subí archivos\nNúmero de pedido: 12345\nNúmero de factura: 098737726\nAgradecemos tu confianza. Es un placer colaborar contigo en el proyecto.\nEl siguiente pedido se enviará dentro de 30 días.\nAtentamente,\nRafa Peña\nDescripción 	Cantidad 	Precio 	Coste\nÍtem 1 	55 	100,00 € 	5.500,00 €\nÍtem 2 	13 	90,00 € 	1.170,00 €\nÍtem 3 	25 	50,00 € 	1.250,00 €\nSubtotal 	7.920,00 €\nImpuesto 	21,00 % 	1.663,20 €\nTotal 	9.583,20 €\n1\nFACTURA\nRafa Peña Vargas\n098737726\nrafa@rafapenya.com\nDNI: 43735032A\nVelazquez, 2 1-7\n43830 TGN\n\n-- 1 of 1 --', NULL, '2026-04-17 14:49:42'),
(20, 14, 'pdf-parse', 'NERIA\nA la atención de: Acho Pacheco\nSABALA SA\nC/ Carrer 45789 Barcelona\nFecha: 16/4/26\nTítulo del proyecto: Subida de archivos\nDescripción del proyecto: subí archivos\nNúmero de pedido: 12345\nNúmero de factura: 098737726\nAgradecemos tu confianza. Es un placer colaborar contigo en el proyecto.\nEl siguiente pedido se enviará dentro de 30 días.\nAtentamente,\nRafa Peña\nDescripción 	Cantidad 	Precio 	Coste\nÍtem 1 	55 	100,00 € 	5.500,00 €\nÍtem 2 	13 	90,00 € 	1.170,00 €\nÍtem 3 	25 	50,00 € 	1.250,00 €\nSubtotal 	7.920,00 €\nImpuesto 	21,00 % 	1.663,20 €\nTotal 	9.583,20 €\n1\nFACTURA\nRafa Peña Vargas\n098737726\nrafa@rafapenya.com\nDNI: 43735032A\nVelazquez, 2 1-7\n43830 TGN\n\n-- 1 of 1 --', NULL, '2026-04-17 15:17:01'),
(21, 15, 'pdf-parse', 'Cualquier duda o aclaración sobre este informe le será atendida en el teléfono 901 50 20 50, en la web www.seg-social.es o cualquier Administración\nde la Seguridad Social.\nLa información sobre las situaciones indicadas no comprende ni los datos relativos a los Regímenes Especiales de los Funcionarios Civiles\ndel Estado, de las Fuerzas Armadas y de los Funcionarios al servicio de la Administración de Justicia, ni los datos relativos a los períodos\ntrabajados en el extranjero.\nA los efectos previstos en el artículo 5 de la Ley Orgánica 15/1999, de 13 de diciembre, de protección de datos de carácter personal se informa que los\ndatos incorporados en el presente informe se encuentran incluidos en el Fichero General de Afiliación, creado por Orden de 27 de julio de 1994.\nRespecto a los citados datos podrá ejercitar los derechos de acceso, rectificación y cancelación en los términos previstos en dicha Ley Orgánica.\nREFERENCIAS ELECTRÓNICAS\nId. CEA: Fecha: Código CEA: Página:\nB00FRM4B62XK 31/03/2026 QSKGQ-Y7Q2N-XWNZV-Y72JO-HNYV5-UUIWO 1\nEste documento no será válido sin la referencia electrónica. La autenticidad de este documento puede ser comprobada hasta la fecha 01/04/2028 mediante el Código\nElectrónico de Autenticidad en la Sede Electrónica de la Seguridad Social, a través del Servicio de Verificación de Integridad de Documentos.\nTVLCEAIM\nINFORME DE VIDA LABORAL\nDe los antecedentes obrantes en la Tesorería General de la Seguridad Social al día 31 de marzo de 2026 , resulta que D/Dª\nRAFAEL PEÑA VARGAS , nacido/a el 28 de diciembre de 1974 , con\nNúmero de la Seguridad Social 250048424073 , D.N.I. 043735032A , domicilio en\nPLACETA ORVEPARD Nº 2 PISO 1 PTA. B , 25005 LLEIDA LLEIDA\nha figurado en situación de alta en el Sistema de la Seguridad Social durante un total de\n23 Años\n8.471 días 2 meses\n12 días\nDurante los días indicados en el párrafo anterior Vd. ha estado de forma simultánea en dos o más empresas del mismo Régimen del sistema de la\nSeguridad Social -pluriempleo-, o en dos, o más Regímenes distintos del citado sistema -pluriactividad-, durante un total de 304 días, por lo que\nel total de días efectivamente computables para las prestaciones económicas del Sistema de la Seguridad Social es de\n22 Años\n8.167 días 4 meses\n12 días\nPresenta las situaciones que se relacionan en las sucesivas hojas del presente informe.\n\n-- 1 of 6 --\n\nREFERENCIAS ELECTRÓNICAS\nId. CEA: Fecha: Código CEA: Página:\nB00FRM4B62XK 31/03/2026 QSKGQ-Y7Q2N-XWNZV-Y72JO-HNYV5-UUIWO 2\nEste documento no será válido sin la referencia electrónica. La autenticidad de este documento puede ser comprobada hasta la fecha 01/04/2028 mediante el Código\nElectrónico de Autenticidad en la Sede Electrónica de la Seguridad Social, a través del Servicio de Verificación de Integridad de Documentos.\nTVLCEAIM\nINFORME DE VIDA LABORAL - SITUACIONES\nDATOS IDENTIFICATIVOS\nNOMBRE Y APELLIDOS Nº SEGURIDAD SOCIAL DOCUMENTO IDENTIFICATIVO\nRAFAEL PEÑA VARGAS 250048424073 D.N.I. 043735032A\nSITUACIÓN/ES\nRÉGIMEN EMPRESA\nSITUACIÓN ASIMILADA A LA DE ALTA FECHA ALTA\nFECHA DE\nEFECTO DE\nALTA\nFECHA DE\nBAJA C.T. CTP\n% G.C. DÍAS\nGENERAL 08211299671 TECNOLOGIAS PLEXUS, S.L. 03.11.2023 03.11.2023 --- 100 --- 02 880\nGENERAL 43109723437 WEB ADVANCED DEVELOPMENT S.L. 01.04.2024 01.04.2024 --- 200 37,5 02 274\nGENERAL 08189705653 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n03.01.2023 03.01.2023 07.01.2023 --- --- -- 5\nGENERAL 43106495963 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n18.01.2022 18.01.2022 18.01.2022 --- --- -- 1\nGENERAL 08191289682 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n24.12.2021 24.12.2021 25.12.2021 --- --- -- 2\nGENERAL 15110188134 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n23.10.2021 23.10.2021 29.10.2021 --- --- -- 7\nGENERAL 08211299671 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n25.06.2021 25.06.2021 26.06.2021 --- --- -- 2\nGENERAL 08135063230 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n21.05.2021 21.05.2021 01.06.2021 --- --- -- 12\nGENERAL 28167282049 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n14.10.2020 14.10.2020 24.10.2020 --- --- -- 11\nGENERAL 25109916821 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n06.12.2018 06.12.2018 24.12.2018 --- --- -- 19\nGENERAL 25104783501 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n15.05.2007 15.05.2007 19.05.2007 --- --- -- 5\nGENERAL 25103856644 VACACIONES RETRIBUIDAS Y NO\nDISFRUTADAS\n09.09.2003 09.09.2003 16.09.2003 --- --- -- 8\nARTISTAS ARTISTAS PERIODOS REGULARIZADOS 01.01.2002 01.01.2002 31.12.2002 --- --- -- 31\nGENERAL 28196593530 SYNTONIZE DIGITAL S.L. 23.01.2023 23.01.2023 17.07.2023 100 --- 02 176\nGENERAL 08189705653 OPTIMA NETWORK,S.L. 07.11.2022 07.11.2022 02.01.2023 100 --- 05 57\nGENERAL 08130751174 BETWEEN TECHNOLOGY S.L. 04.02.2022 04.02.2022 07.10.2022 100 --- 01 246\nGENERAL 08130751174 BETWEEN TECHNOLOGY S.L. 24.01.2022 24.01.2022 03.02.2022 100 --- 01 11\nGENERAL 43106495963 CTAIMA OUTSOURCING & CONSULTING\nS.L.\n03.01.2022 03.01.2022 17.01.2022 402 --- 01 15\nGENERAL 08191289682 MIMACOM . SPAIN 07.12.2021 07.12.2021 23.12.2021 100 --- 01 17\nGENERAL 15110188134 GRUPO NORCONSULTING, S.L. 28.06.2021 28.06.2021 22.10.2021 100 --- 05 117\nGENERAL 08211299671 TECNOLOGIAS PLEXUS, S.L. 07.06.2021 07.06.2021 24.06.2021 100 --- 02 18\nGENERAL 08135063230 RANDSTAD DIGITAL, SOCIEDAD ANÓNIMA 21.12.2020 21.12.2020 20.05.2021 100 --- 02 151\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 25.10.2020 25.10.2020 09.11.2020 --- --- 03 16\nGENERAL 28167282049 TENEA TECNOLOGIAS,S.L. 23.03.2020 23.03.2020 13.10.2020 100 --- 05 205\nGENERAL 28166225052 ARELANCE S.L. 10.12.2019 10.12.2019 21.01.2020 401 --- 07 43\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 01.10.2019 01.10.2019 09.12.2019 --- --- 03 70\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 01.09.2019 01.09.2019 30.09.2019 --- --- 03 30\nGENERAL 43109723437 WEB ADVANCED DEVELOPMENT S.L. 01.03.2019 01.03.2019 31.08.2019 100 --- 02 184\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 25.12.2018 25.12.2018 28.02.2019 --- --- 03 66\nGENERAL 25109916821 INDRA PRODUCCION SOFTWARE S.L. 01.10.2018 01.10.2018 05.12.2018 100 --- 03 66\nGENERAL 25105629017 INDRA SOFTWARE LABS S.L. 27.03.2017 27.03.2017 30.09.2018 100 --- 03 552\nAUTONOMO ----------- LLEIDA 01.10.2008 01.10.2008 31.03.2011 --- --- -- 912\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 20.05.2007 20.05.2007 19.11.2007 --- --- 06 184\n\n-- 2 of 6 --\n\nREFERENCIAS ELECTRÓNICAS\nId. CEA: Fecha: Código CEA: Página:\nB00FRM4B62XK 31/03/2026 QSKGQ-Y7Q2N-XWNZV-Y72JO-HNYV5-UUIWO 3\nEste documento no será válido sin la referencia electrónica. La autenticidad de este documento puede ser comprobada hasta la fecha 01/04/2028 mediante el Código\nElectrónico de Autenticidad en la Sede Electrónica de la Seguridad Social, a través del Servicio de Verificación de Integridad de Documentos.\nTVLCEAIM\nINFORME DE VIDA LABORAL - SITUACIONES\nDATOS IDENTIFICATIVOS\nNOMBRE Y APELLIDOS Nº SEGURIDAD SOCIAL DOCUMENTO IDENTIFICATIVO\nRAFAEL PEÑA VARGAS 250048424073 D.N.I. 043735032A\nSITUACIÓN/ES\nRÉGIMEN EMPRESA\nSITUACIÓN ASIMILADA A LA DE ALTA FECHA ALTA\nFECHA DE\nEFECTO DE\nALTA\nFECHA DE\nBAJA C.T. CTP\n% G.C. DÍAS\nGENERAL 25104783501 CORNING CABLE SYSTEMS, S.L. 28.06.2006 28.06.2006 14.05.2007 401 --- 06 321\nGENERAL 25104783501 CORNING CABLE SYSTEMS, S.L. 01.08.2005 01.08.2005 27.06.2006 402 --- 09 331\nGENERAL 28129868644 CORNING OPTICAL COMMUNICATIONS\nS.L.\n28.06.2005 28.06.2005 31.07.2005 402 --- 09 34\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 29.01.2004 29.01.2004 16.03.2004 --- --- 07 48\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 17.09.2003 17.09.2003 28.12.2003 --- --- 07 103\nGENERAL 25103856644 ENTORN & SOLUCIONS GRAFIQUES, S.L. 01.06.2003 01.06.2003 08.09.2003 502 75,0 07 75\nGENERAL 25103416912 MADRID,VALENCIA,PAMPLONA VIRTUAL\nCITY S.L\n05.03.2002 05.03.2002 31.12.2002 100 --- 07 302\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 30.08.2002 30.08.2002 31.08.2002 --- --- 03 2\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 14.08.2002 14.08.2002 17.08.2002 --- --- 03 4\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 09.08.2002 09.08.2002 10.08.2002 --- --- 03 2\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 26.07.2002 26.07.2002 26.07.2002 --- --- 03 1\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 05.07.2002 05.07.2002 06.07.2002 --- --- 03 2\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 23.06.2002 23.06.2002 23.06.2002 --- --- 03 1\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 18.05.2002 18.05.2002 18.05.2002 --- --- 03 1\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 27.04.2002 27.04.2002 27.04.2002 --- --- 03 1\nARTISTAS 25102178948 FRENESI MUSICAL, S.L. 09.03.2002 09.03.2002 09.03.2002 --- --- 03 1\nGENERAL 25101594726 INTERNET WEB SERVEIS, S.L. 05.06.2001 05.06.2001 04.03.2002 402 --- 07 273\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 02.03.2001 02.03.2001 04.06.2001 --- --- 07 95\nGENERAL 25003093181 MIQUEL MONTSERRAT JOSEP SILVESTRE 05.01.2001 05.01.2001 01.03.2001 402 --- 07 56\nGENERAL 25004996708 SAGE EUROWIN, S.L.U. 04.07.2000 04.07.2000 31.12.2000 401 --- 09 181\nGENERAL 25101819745 MULTISERVEI CAMISON,S.L. 03.05.2000 03.05.2000 31.05.2000 015 --- 08 29\nGENERAL 25102750238 EDICAT ARTS GRAFIQUES, S.C.C.L. 13.05.1999 13.05.1999 12.04.2000 001 --- 08 336\nGENERAL ----------- SUBSIDIO DESEMPLEO. EXTINCION 03.03.1999 03.03.1999 01.06.1999 --- --- 10\nGENERAL 25004709748 JORFE INSTAL.LACIONS, S.L. 02.11.1998 02.11.1998 24.12.1998 014 --- 10 53\nGENERAL 25004709748 JORFE INSTAL.LACIONS, S.L. 17.08.1998 17.08.1998 30.10.1998 014 --- 09 75\nGENERAL 25101535112 UNIMAIL, S.A. 29.06.1998 29.06.1998 16.07.1998 015 --- 09 18\nGENERAL 25101535112 UNIMAIL, S.A. 03.06.1998 03.06.1998 27.06.1998 015 --- 09 25\nGENERAL 25101535112 UNIMAIL, S.A. 12.05.1998 12.05.1998 22.05.1998 015 --- 09 11\nGENERAL 25101333836 BARNA WORK E.T.T., S.L. 25.03.1998 25.03.1998 02.04.1998 014 --- 09 9\nGENERAL 25003555246 RAMON COMELLAS, S.A. 11.02.1998 11.02.1998 10.03.1998 015 --- 08 28\nGENERAL 25100571778 CEYCONTA, S.L. 02.02.1998 02.02.1998 06.02.1998 015 --- 09 5\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 02.11.1997 02.11.1997 25.11.1997 --- --- 10 24\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 26.03.1997 26.03.1997 01.10.1997 --- --- 10 190\nGENERAL 25101521570 CALEFACCIONES VELEZ SAN\nCHEZ,S.COOP.C.L.\n26.03.1996 26.03.1996 25.03.1997 015 --- 10 365\nGENERAL 25005044905 LUMBIERRES BARDAJI SERGIO 29.12.1995 29.12.1995 28.01.1996 --- --- 10 31\nGENERAL 47006196688 JUAN BARCO VARA (SINDICO Q.DE\nREPOBLACION\n02.11.1995 02.11.1995 27.11.1995 --- --- 10 26\nGENERAL 25100853583 ADECCO T.T., S.A. E.T.T 22.08.1995 22.08.1995 25.08.1995 --- --- 10 4\nGENERAL 25100853583 ADECCO T.T., S.A. E.T.T 19.07.1995 19.07.1995 31.07.1995 --- --- 09 13\nGENERAL 25003934051 GOMEZ LEON ANGEL 18.04.1995 18.04.1995 30.06.1995 004 75,0 10 56\n\n-- 3 of 6 --\n\nREFERENCIAS ELECTRÓNICAS\nId. CEA: Fecha: Código CEA: Página:\nB00FRM4B62XK 31/03/2026 QSKGQ-Y7Q2N-XWNZV-Y72JO-HNYV5-UUIWO 4\nEste documento no será válido sin la referencia electrónica. La autenticidad de este documento puede ser comprobada hasta la fecha 01/04/2028 mediante el Código\nElectrónico de Autenticidad en la Sede Electrónica de la Seguridad Social, a través del Servicio de Verificación de Integridad de Documentos.\nTVLCEAIM\nINFORME DE VIDA LABORAL - SITUACIONES\nDATOS IDENTIFICATIVOS\nNOMBRE Y APELLIDOS Nº SEGURIDAD SOCIAL DOCUMENTO IDENTIFICATIVO\nRAFAEL PEÑA VARGAS 250048424073 D.N.I. 043735032A\nSITUACIÓN/ES\nRÉGIMEN EMPRESA\nSITUACIÓN ASIMILADA A LA DE ALTA FECHA ALTA\nFECHA DE\nEFECTO DE\nALTA\nFECHA DE\nBAJA C.T. CTP\n% G.C. DÍAS\nGENERAL 25003934051 GOMEZ LEON ANGEL 06.02.1995 06.02.1995 13.04.1995 004 50,0 10 34\nGENERAL 25100778411 ALEMANY SEUMA ROSA 04.11.1994 04.11.1994 16.12.1994 004 50,0 10 22\nGENERAL 25100469122 DIVULGACION PUBLICITARIA\nCOMERCIAL,S.L.\n26.03.1994 26.03.1994 25.09.1994 --- --- 09 184\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 01.12.1992 01.12.1992 17.03.1993 --- --- 11 107\nGENERAL 25003609709 QUINQUILLA CODINA JAUME JOAN 01.06.1992 01.06.1992 30.11.1992 --- --- 11 183\nGENERAL ----------- PRESTACION DESEMPLEO. EXTINCION 18.03.1992 18.03.1992 30.05.1992 --- --- 11 74\nGENERAL 25002653146 SOLA PRIM JOSE MARIA 18.03.1991 25.03.1991 17.03.1992 --- --- 11 359\n\n-- 4 of 6 --\n\nREFERENCIAS ELECTRÓNICAS\nId. CEA: Fecha: Código CEA: Página:\nB00FRM4B62XK 31/03/2026 QSKGQ-Y7Q2N-XWNZV-Y72JO-HNYV5-UUIWO 5\nEste documento no será válido sin la referencia electrónica. La autenticidad de este documento puede ser comprobada hasta la fecha 01/04/2028 mediante el Código\nElectrónico de Autenticidad en la Sede Electrónica de la Seguridad Social, a través del Servicio de Verificación de Integridad de Documentos.\nTVLCEAIM\nNotas aclaratorias\nLos informes de vida laboral contienen información respecto de las situaciones de alta o baja de una persona en el conjunto de los distintos regímenes del sistema de la\nSeguridad Social. Las situaciones que se incluyen en los informes son computables para el acceso, al menos, de una de las prestaciones contributivas del sistema de la\nSeguridad Social. Por lo tanto, no todas las situaciones que se incluyen en el informe de vida laboral tienen que ser necesariamente computables para todas las prestaciones\neconómicas contributivas del sistema, aspecto éste que deberá ser determinado por la Entidad Gestora competente sobre la resolución de la solicitud de la correspondiente\nprestación.\nA continuación, se aclaran algunos conceptos y denominaciones usados en el informe de vida laboral que pueden ayudarle a comprender el contenido del mismo. No todos los\nconceptos que se detallan tienen que aparecer necesariamente en su informe de vida laboral dado que algunas de las denominaciones son específicas de determinados\nRegímenes o situaciones concretas.\nRÉGIMEN\nIdentifica al Régimen en el cual se encuadra el correspondiente periodo. Puede ser alguno de los siguientes: Régimen GENERAL, Régimen Especial de Trabajadores por Cuenta\nPropia o AUTÓNOMOS, Régimen Especial AGRARIO, Régimen Especial de los trabajadores del MAR, Régimen Especial de la minería del CARBÓN o Régimen Especial de\nempleados de HOGAR. Dentro del Régimen GENERAL se identifica al colectivo de REPRESENTANTES DE COMERCIO, y al SISTEMA ESPECIAL DE FRUTAS, HORTALIZAS\nY CONSERVAS VEGETALES.\nEMPRESA\nSe consigna el código de cuenta de cotización o número de inscripción del empresario utilizado para la individualización de éste en el respectivo Régimen del Sistema de la\nSeguridad Social, así como la denominación de la empresa u organismo a cuyo nombre figura el código de cuenta de cotización.\nSITUACIÓN ASIMILADA A LA DE ALTA\nSituación diferente a la de la prestación de servicios o actividad determinante de su encuadramiento en un régimen del sistema de la Seguridad Social, que surte efectos\nrespecto de las prestaciones, contingencias y en las condiciones que para cada una de ellas se establecen en el Reglamento General sobre inscripción de empresas y afiliación,\naltas, bajas y variaciones de datos de trabajadores aprobado por el Real Decreto 84/1996, de 26 de enero, y en las demás normas reguladoras de las mismas.\nFECHA DE ALTA\nFecha de inicio de la prestación de servicios o de la actividad, o fecha de inicio de la situación asimilada a la de alta.\nFECHA DE EFECTO DEL ALTA\nFecha a partir de la cual tiene efectos el alta en orden a causar derecho a las prestaciones del sistema de Seguridad Social, salvo para las prestaciones derivadas de accidentes\nde trabajo y enfermedades profesionales, desempleo y asistencia sanitaria derivada de enfermedad común, maternidad y accidente no laboral, en las cuales la fecha de efecto\nde alta coincide, en cualquier caso, con la fecha de alta.\nFECHA DE BAJA\nFecha de cese de la prestación de servicios o de la actividad, o fecha de cese de la situación asimilada a la de alta.\nFECHA DE EFECTO DE BAJA\nFecha a partir de la cual se extingue la obligación de cotizar.\nCONTRATO DE TRABAJO (C.T.)\nClave que identifica a efectos de la gestión de la Seguridad Social, la modalidad del contrato de trabajo. (*)\nC.T.P.-% SOBRE LA JORNADA HABITUAL DE LA EMPRESA\nEn los contratos de trabajo a tiempo parcial el coeficiente, en tantos por ciento, identifica el porcentaje que, sobre la jornada a tiempo completo establecida en el Convenio\nColectivo de aplicación o, en su defecto, sobre la jornada ordinaria máxima legal, realiza o ha realizado el trabajador/a. (*)\nGRUPO DE COTIZACIÓN\nGrupo de categorías profesionales en el que se incluye al trabajador/a. (*)\nBASE DE COTIZACIÓN\nBase de Cotización por la que se ha optado en el Régimen Especial de los trabajadores por Cuenta propia o Autónomos o en determinados convenios especiales. En situaciones\nde alta, la Base de Cotización es la que consta en la fecha de emisión del informe. (*)\n\n-- 5 of 6 --\n\nREFERENCIAS ELECTRÓNICAS\nId. CEA: Fecha: Código CEA: Página:\nB00FRM4B62XK 31/03/2026 QSKGQ-Y7Q2N-XWNZV-Y72JO-HNYV5-UUIWO 6\nEste documento no será válido sin la referencia electrónica. La autenticidad de este documento puede ser comprobada hasta la fecha 01/04/2028 mediante el Código\nElectrónico de Autenticidad en la Sede Electrónica de la Seguridad Social, a través del Servicio de Verificación de Integridad de Documentos.\nTVLCEAIM\nNotas aclaratorias\nMEJORA DE I.T.\nEn el Régimen Especial de Trabajadores por Cuenta Propia o Autónomos y en el Régimen Especial Agrario, determina si el trabajador ha optado por tener cubierta la prestación\neconómica de incapacidad temporal. (*)\nENTIDAD DE I.T.\nEn el Régimen Especial de Trabajadores por Cuenta Propia o Autónomos y en el Régimen Especial Agrario, identifica la Entidad Gestora de la Seguridad Social o Mutua de\nAccidentes de Trabajo y Enfermedades Profesionales con la que se ha formalizado la cobertura de la incapacidad temporal. (*)\nENTIDAD DE A.T. Y E.P.\nIdentifica la Entidad Gestora de la Seguridad Social o Mutua de Accidentes de Trabajo y Enfermedades Profesionales con la que se ha formalizado la cobertura de los riesgos\nprofesionales.(*)\nCOEFICIENTE DE PERMANENCIAS EN EL SISTEMA ESPECIAL DE FRUTAS, HORTALIZAS Y CONSERVAS VEGETALES\nCoeficiente multiplicador a aplicar a los días efectivamente trabajados en el sistema especial.\nDIAS DE TRABAJO EN EL SISTEMA ESPECIAL DE FRUTAS, HORTALIZAS Y CONSERVAS VEGETALES\nNúmero de días efectivamente trabajados en el sistema especial.\nDIAS A LOS QUE NO ES DE APLICACIÓN EL COEFICIENTE DE PERMANECIAS EN EL SISTEMA ESPECIAL DE FRUTAS, HORTALIZAS Y\nCONSERVAS VEGETALES\nNúmero de días en situación de alta en el sistema especial a los que no resulta de aplicación el coeficiente de permanencias.\nDIAS EN ALTA\nNúmero de días comprendidos entre la FECHA DE EFECTO DEL ALTA y la FECHA DE BAJA. En situaciones de alta el número de días se computa entre la FECHA DE\nEFECTO DEL ALTA y la FECHA DE EMISIÓN DEL INFORME.\nPECULIARIDADES DE LOS CONTRATOS A TIEMPO PARCIAL:\nAl número resultante de la diferencia entre la FECHA DE EFECTO DEL ALTA y la FECHA DE BAJA se ha aplicado el porcentaje sobre la jornada habitual de la empresa. En el\nsupuesto de que en un período el trabajador haya tenido distintas jornadas de trabajo en cuanto a su duración, en el cálculo de los días se han tenido en cuenta todas ellas.\nA efectos de acreditar los períodos de cotización necesarios para causar derecho a las prestaciones de jubilación, incapacidad permanente, muerte y supervivencia, incapacidad\ntemporal y nacimiento y cuidado de menor la entidad gestora tendrá en cuenta los distintos períodos durante los cuales el trabajador haya permanecido en alta con un contrato a\ntiempo parcial, cualquiera que sea la duración de la jornada realizada en cada uno de ellos.\nPECULIARIDADES DEL CONVENIO ESPECIAL DE FUNCIONARIOS DE LA UNIÓN EUROPEA\nLos días en situación de alta de este convenio especial únicamente son computables para el acceso a la prestación económica de incapacidad permanente derivada de\ncontingencias comunes.\nPECULIARIDADES DEL SISTEMA ESPECIAL DE FRUTAS, HORTALIZAS Y CONSERVAS VEGETALES\nSi en el informe constan los datos de COEFICIENTE DE PERMANENCIAS, DÍAS DE TRABAJO y/o DÍAS A LOS QUE NO ES DE APLICACIÓN EL COEFICIENTE DE\nPERMANENCIAS el número de días en situación de alta se calcula multiplicando los DÍAS DE TRABAJO por el COEFICIENTE DE PERMANENCIAS, sumándose al resultado\nobtenido los DÍAS A LOS QUE NO ES DE APLICACIÓN EL COEFICIENTE DE PERMANENCIAS.\nLa situación de alta de forma simultánea en dos, o más, Regímenes distintos del citado sistema -pluriactividad-, siendo una de las empresas del Sistema Especial de Frutas,\nHortalizas y Conservas Vegetales, impide determinar si al número de días calculado según se ha indicado en el párrafo anterior se le deben restar días por existir una\nsuperposición de períodos cotizados. El cálculo definitivo se realizará en el momento en que se efectúe una solicitud para el acceso a una prestación económica del sistema de\nla Seguridad Social.\nPECULIARIDADES DEL COLECTIVO DE ARTISTAS INCLUIDO EN EL RÉGIMEN GENERAL\nLos días de alta que figuran en las empresas de artistas no son definitivos hasta que se emita la regularización anual de cotizaciones. Una vez emitida, los días de alta\ncomputables, reales y asimilados, de todas las empresas de artistas para las que haya prestado servicios el trabajador durante un año, son los que figuran en el registro\nARTISTAS PERIODOS REGULARIZADOS del año correspondiente.\nPECULIARIDADES DE LAS PRACTICAS FORMATIVAS O PRACTICAS ACADEMICAS EXTERNAS INCLUIDAS EN PROGRAMAS DE FORMACION\nLa fecha de alta y de baja que se ofrece en el informe de vida laboral corresponde a la fecha de inicio y de finalización del periodo de las prácticas formativas. En las prácticas no\nremuneradas la entidad responsable dispone para su comunicación de 10 días naturales.\nNo se consideran de alta los periodos en los que el alumno figure simultáneamente de alta en cualquiera de los regímenes del sistema de Seguridad Social por el desempeño de\notra actividad, en situación asimilada a la de alta con obligación de cotizar, o durante la cual el periodo tenga la consideración de cotizado a efectos de prestaciones, o tengan la\ncondición de pensionistas de jubilación o de incapacidad permanente de la Seguridad Social, tanto en su la modalidad contributiva como no contributiva.\nEn las prácticas no remuneradas el numero consignado en el campo “DIAS” se corresponde con el número de las prácticas realizadas en periodos de alta, una vez aplicado el\ncoeficiente derivado de que, a efectos de prestaciones, cada día de prácticas formativas no remuneradas se considera como 1,61 días cotizados, sin que pueda sobrepasarse en\nningún caso el número de días naturales del mes correspondiente. Las fracciones de día que pudieran resultar del coeficiente anterior se computan como un día completo.\nLa aplicación de este coeficiente multiplicador puede determinar que, si en un mismo mes hay un periodo de prácticas no remuneradas junto con periodos de alta en otra relación\nlaboral o junto con otros períodos de prácticas, pueda aparecer en el informe un cómputo de días simultáneos en pluriempleo o pluriactividad, aunque no se solapen los periodos\nde alta de las distintas relaciones laborales.\n(*) En el supuesto de que el trabajador, en cada período, haya tenido más de un contrato de trabajo, porcentaje sobre la jornada habitual de la empresa, grupo de cotización, base\nde cotización, mejora incapacidad temporal y/o entidad que cubre la prestación de incapacidad temporal, sólo aparece en el informe de vida laboral el último de cualquiera de\nestos datos.\n\n-- 6 of 6 --', NULL, '2026-04-17 20:26:43'),
(22, 16, 'pdf-parse', 'ABANCA SERVICIOS FINANCIEROS, ESTABLECIMIENTO FINANCIERO DE CRÉDITO, S.A. (\"la ENTIDAD\") NIF A28197036 - I.Rº.M. A Coruña, T.1.850, F.222, H.C-6.118. Dom. Social: Rúa Nueva, nº30. 15003. A Coruña. RºBB 8620 www.abancaserfin.com\n117806333\nINFORMACIÓN DE RIESGO\nFECHA PETICIÓN TIPO DE INFORMACIÓN MONEDA NÚMERO DE PRÉSTAMO\n31-03-2026 CUADRO DE AMORTIZACIÓN DE PRÉSTAMO EUR 8626- 9.852-4\nPRESTATARIO\nRAFAEL PEÑA VARGAS\nTRAMOS DE INTERES\n_________________\nINTERES APLICADO DESDE 14-11-2024 HASTA 30-11-2029: 8,9900000%\nFECHA CUOTA CAPITAL CUOTA INTERES CUOTA TOTAL CAPITAL NO VENCIDO\n____________________________________________________________________________________________________\n01-04-2026 66,68 26,62 93,30 3.486,34\n01-05-2026 67,18 26,12 93,30 3.419,16\n01-06-2026 67,68 25,62 93,30 3.351,48\n01-07-2026 68,19 25,11 93,30 3.283,29\n01-08-2026 68,70 24,60 93,30 3.214,59\n01-09-2026 69,22 24,08 93,30 3.145,37\n01-10-2026 69,74 23,56 93,30 3.075,63\n01-11-2026 70,26 23,04 93,30 3.005,37\n01-12-2026 70,78 22,52 93,30 2.934,59\n01-01-2027 71,32 21,98 93,30 2.863,27\n01-02-2027 71,85 21,45 93,30 2.791,42\n01-03-2027 72,39 20,91 93,30 2.719,03\n01-04-2027 72,93 20,37 93,30 2.646,10\n01-05-2027 73,48 19,82 93,30 2.572,62\n01-06-2027 74,03 19,27 93,30 2.498,59\n01-07-2027 74,58 18,72 93,30 2.424,01\n01-08-2027 75,14 18,16 93,30 2.348,87\n01-09-2027 75,70 17,60 93,30 2.273,17\n01-10-2027 76,27 17,03 93,30 2.196,90\n01-11-2027 76,84 16,46 93,30 2.120,06\n01-12-2027 77,42 15,88 93,30 2.042,64\n01-01-2028 78,00 15,30 93,30 1.964,64\n01-02-2028 78,58 14,72 93,30 1.886,06\n01-03-2028 79,17 14,13 93,30 1.806,89\n01-04-2028 79,76 13,54 93,30 1.727,13\n01-05-2028 80,36 12,94 93,30 1.646,77\n01-06-2028 80,96 12,34 93,30 1.565,81\n01-07-2028 81,57 11,73 93,30 1.484,24\n01-08-2028 82,18 11,12 93,30 1.402,06\n01-09-2028 82,80 10,50 93,30 1.319,26\n01-10-2028 83,42 9,88 93,30 1.235,84\n01-11-2028 84,04 9,26 93,30 1.151,80\n01-12-2028 84,67 8,63 93,30 1.067,13\n01-01-2029 85,31 7,99 93,30 981,82\n01-02-2029 85,94 7,36 93,30 895,88\n01-03-2029 86,59 6,71 93,30 809,29\n01-04-2029 87,24 6,06 93,30 722,05\n01-05-2029 87,89 5,41 93,30 634,16\n01-06-2029 88,55 4,75 93,30 545,61\n01-07-2029 89,21 4,09 93,30 456,40\n01-08-2029 89,88 3,42 93,30 366,52\n01-09-2029 90,55 2,75 93,30 275,97\n01-10-2029 91,23 2,07 93,30 184,74\n01-11-2029 91,92 1,38 93,30 92,82\n01-12-2029 92,82 0,70 93,52 0,00\nMod.20076-06-ES\n \nE0621\nQTE331032026 122647 1/1\n\n-- 1 of 1 --', NULL, '2026-04-17 20:28:46'),
(24, 18, 'tesseract', 'Se 7 | . > 6 oy y y » \" - ls di ALY 3 > a Eo\nIE PY eteñuentno AL servicio —\nBE TAXI DEL A.P.C DE MADRID a\naa ~ JOSE LUIS ARAPILES D\n== — Ne LICENCIA: 04787\nE. PLA E, 50041960-D- |\nE MATRICULA: 4521KYP-\nE | — FECHA: 25/03/26 Ba\nE Ne RECIBO: 533133 3\nTOTALCI/IVA): 24,05 “E -\n| DIST. SERVICIO: 9,5 ka |\nTARIFAS TR: hy\nHORA INICIO: 23111\nHORA FINAL: 23:30\n-DATOS CLIENTE:\n— -ORIGEN: |\n|\n| -DESTINO: |\n— RECIBO DE TAXI SEGÚN —*\n— NORMATIVA LOCAL UIGENTE,', 58.00, '2026-04-17 20:44:10'),
(28, 18, 'tesseract', 'Se 7 | . > 6 oy y y » \" - ls di ALY 3 > a Eo\nIE PY eteñuentno AL servicio —\nBE TAXI DEL A.P.C DE MADRID a\naa ~ JOSE LUIS ARAPILES D\n== — Ne LICENCIA: 04787\nE. PLA E, 50041960-D- |\nE MATRICULA: 4521KYP-\nE | — FECHA: 25/03/26 Ba\nE Ne RECIBO: 533133 3\nTOTALCI/IVA): 24,05 “E -\n| DIST. SERVICIO: 9,5 ka |\nTARIFAS TR: hy\nHORA INICIO: 23111\nHORA FINAL: 23:30\n-DATOS CLIENTE:\n— -ORIGEN: |\n|\n| -DESTINO: |\n— RECIBO DE TAXI SEGÚN —*\n— NORMATIVA LOCAL UIGENTE,', 58.00, '2026-04-17 23:08:02'),
(31, 24, 'tesseract', ', _——\nN* DE FACTURA: | 00 22552075\nFE\nA CLINICA DENTAL DONOSO CHA FACTURA: 03/07/2025\n| CALLE BARCELONA 4 BAJOS PEÑA VAR\nG\n43830 TORREDEMBARRA VELAZQUEZ y — y o: RAFAEL\nTARRAGONA\nTel.: 977642666 ec\nNIF: B43827401 )\nNIF: 43735032 :\nYe\nA\nNHC: 9780 Paciente: PEÑA VARGAS RAFAEL (9780) E... as -\naac SE Sa RTT Colaborador inorte 7\n03/07/2025 RASPADO Y ALISADO RADICULAR DRA BLANCO en dtes. #11 #12 # BLANCO DELGADO 110,00 €\nTotal Factura (00) 2255/25 €110,00\n—\nMETFL\n(*) Factura exenta de IVA E\nE\n| de la LOPDGDD;se le facilita 1\nal artículo 11 de\n12 del mismo RGPD y en base al artículo\ntículo\n¿in actableckipan SBIR up: ¡g=22125.49548\n>cho de informacion astatyee en las siguientes Ee /r pdA/index.php?id 21:\nDe acuerdo con Mee : de sus datos personales ñ tranet.laboralrgpd.com B\n: formación sobre el ser adicional https://in\nat : se Clientes In “\nsusula documentos L\na ane MANS 12 50 29', 75.00, '2026-04-19 18:54:17'),
(32, 25, 'tesseract', 'TT Baa EU . a \\ 2 AW Hea — *\nQs pee aes 3 OL mii — —\nme o Et TC\n\ne\nU N IVE 8 AUDIOLOGIA\nUNIVERSITARIA\nRambla Nova, 51\n43003-Tarragona\n| T. 877003460\nrambla.nova@opticauniversitaria es\nTICKET A COMPTE\ni (a\nNO Encarrec: 103022338 Data: 01/12/2025\nA ON\nRAFA PEÑA VARGAS\nA a Et\nData prevista: 09/12/2025 |\nImport a compte: 204,00€\nImport encarrec: , 204,00€\nResten: 0,00€\nDetall\n| IVA Base Quota\n10% 185,45€ 18,55€\n| Per a joves d\'ia 100 anys\n- ultar l\'estat del teu encarrec a\ns mu O pticauniversitaria.es\nEPTICA DEL PENEDÉS, S:k-1: 656412500', 67.00, '2026-04-19 18:57:19'),
(33, 26, 'tesseract', 'OPTIC\nU Ni VES UDIOLOGIA ———\n== IVERSITARIA\nRambla Nova &\n— a, 51\n300 38 ar a |\n1: 877003460\n| ambla.nova@opticauniversitariy as\nTICKET A COMPTE\nNO Encarrec: 103022337 Data: 01/12/2025\nE mee:\nRAFA PENA VARGAS\nTa ————\nData prevista: | 09/12/2025\nImport a compte: : 204,00€\nImport encarrec: | 204,00€\nResten: 0,00€\nDetall\nIVA Base um\n10% 185,45€ 18,55\nPer a joves dia 100 anve a\narrec\nItar l\'estat del teu encar!\n- O pticauniversitaria.es pou\n91 ÓRTICA DEL PENEDÉS, 6:44: 1584479', 73.00, '2026-04-19 18:59:15'),
(34, 27, 'tesseract', 'e\nve ES eau O AL a\nRY\" we oa Ne y de yal (0300 To Se\net OO —— ——\nco °° et A 3 Wo we \"o sp LOS O A CT E\nQos “RY OP hg ue De wo” a\nA AT (ue * NS Fi sei J\ntag \"PICA a AUDIOLOGIA\nUNIVERSITARIA\n: Rambla Nova, 2X\n43003-Tarragona\n\\ T. 877003460\nrambla.novaEopticauniversitaria.es\nFactura simplificada\nNo-103021565 Data: 25/11/2025\nArticle un. Pvp Import\nCARRERA-VICTORY\n-C-06/G 1 110 55€ 110 39%\nprg. Precision\nSuperb DuraVisi\non Platinum 1.6\n7 1 260,00€ 260,00€\nPrg. Precision\nsuperb DuraVisi\non Platinum 1.6\n7 1 260,00€ 260,00€\nDescomptes -126,11€\nNum. Total Art: 3\n* Import Total: 504,44€\nDetall\nY [VA Base Quota\n| 10% 458,58 45,86\nper a joves d\'1 a 100 any\nOPTICA DEL PENEDES: = LU B5844290-', 60.00, '2026-04-19 19:00:24'),
(35, 28, 'tesseract', 'a\n* Ca]\nOPTICA 8 AUDIOLOGIA\nmor\nRambla Nova, 51\n43003-Tarragona\nT. 877003460\nrambla.novaGopticauniversitaria.es\n5 Factura simplificada\nNo-103021567 Data: 25/11/2025\nArticle Un. Pvp Import\nBEO-570/G 1 39,00€ 39,00€\nOfficelens Plus\nBlueGuard Dura\nVision Platiniu *\nm 1,6 1 128,50€ 128,50€\nOfficelens Plus |\nBlueGuard Dura\nVision Platiniu\nm 1,6 4 =Di=1P28,50€ 128,50€\nDescomptes : -264,80€ $\nNum. Total Art: 3\nImport Total: 31,20€\nDetall\nas CVA Base Quota\n10% 28,36 2,84\nper a joves dia 100 anys |\nORTIGA DEL FENEDES, Ss: BREA OULU', 77.00, '2026-04-19 19:01:10'),
(36, 29, 'tesseract', '—\n/ABANCA | servicios il\n| Financieros INRA | I\n[| TT Tse NN\n=) PS a\nS \"I. PRÉSTAMOS Y CRÉDITOS E UN —\n|\n=—— =| PRÉSTAMO PERSONAL 862086260098524\n— — INTERESES\nA] | % Intereses Ordinarios:\np— | Período del 14-11-2024 al 30-11-2025: 8 , 99000004\n—ss |» “Importe intereses ordinarios: 393,01 EUR\n— |\noem |\n|\n—\n— |\n— |\n—\n—\n|\n—\n— |\n— |\ne\nnano |\nss |\n|\n|\n| | __—_  -——-\n| TT a _ Social: Rúa Nueva, n?30. 15003 ACoruña. REE 8620 we\nABANCA SERVICIOS FINANCIEROS, ESTABLECIMIENTO FINANCIERO DE CRÉDITO, S.A. (\"la ENTIDAD\") NIF A28197036 - LRE.M. A Coruña, T-1.850. E 22 UT\n0302/ ASO1SCOFi.CGE-1 /24167 / 24167 /00000444444549', 62.00, '2026-04-19 19:02:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_expenses`
--

CREATE TABLE `finan_expenses` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `category_id` bigint(20) DEFAULT NULL,
  `payer_id` bigint(20) DEFAULT NULL,
  `expense_date` date NOT NULL,
  `concept` varchar(255) NOT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `vat_amount` decimal(12,2) DEFAULT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT 1,
  `currency` varchar(10) NOT NULL DEFAULT 'EUR',
  `source_type` enum('MANUAL','OCR','LLM','IMPORT') NOT NULL DEFAULT 'MANUAL',
  `deductibility_status` enum('DEDUCTIBLE','NON_DEDUCTIBLE','REVIEWABLE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `business_use_percent` decimal(5,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_expenses`
--

INSERT INTO `finan_expenses` (`id`, `user_id`, `category_id`, `payer_id`, `expense_date`, `concept`, `vendor_name`, `amount`, `vat_amount`, `is_paid`, `currency`, `source_type`, `deductibility_status`, `business_use_percent`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 3, '2026-03-25', 'Ticket · TAXI DEL A.P.C DE MADRID', 'TAXI DEL A.P.C DE MADRID', 24.05, NULL, 1, 'EUR', 'LLM', 'REVIEWABLE', NULL, 'Documento origen #18', '2026-04-17 23:08:08', '2026-04-17 23:08:08'),
(2, 1, NULL, NULL, '2025-07-03', 'Factura · Clínica Dental Donoso', 'Clínica Dental Donoso', 110.00, 0.00, 1, 'EUR', 'LLM', 'REVIEWABLE', NULL, 'Documento origen #24', '2026-04-19 18:54:25', '2026-04-19 18:54:25'),
(3, 1, NULL, NULL, '2025-12-01', 'Ticket · Optica Universitaria', 'Optica Universitaria', 204.00, 18.55, 1, 'EUR', 'LLM', 'REVIEWABLE', NULL, 'Documento origen #25 · Pago: Account payment (Import a compte)', '2026-04-19 18:57:25', '2026-04-19 18:57:25'),
(4, 1, NULL, NULL, '2025-12-01', 'Ticket · Optica Universitaria', 'Optica Universitaria', 204.00, 18.55, 1, 'EUR', 'LLM', 'REVIEWABLE', NULL, 'Documento origen #26 · Pago: Account payment (Import a compte)', '2026-04-19 18:59:21', '2026-04-19 18:59:21'),
(5, 1, NULL, NULL, '2025-11-25', 'Factura · Óptica Universitaria', 'Óptica Universitaria', 504.44, 45.86, 1, 'EUR', 'LLM', 'REVIEWABLE', NULL, 'Documento origen #27', '2026-04-19 19:00:34', '2026-04-19 19:00:34'),
(6, 1, NULL, NULL, '2025-11-25', 'Factura · Óptica & Audiología', 'Óptica & Audiología', 31.20, 2.84, 1, 'EUR', 'LLM', 'REVIEWABLE', NULL, 'Documento origen #28', '2026-04-19 19:01:18', '2026-04-19 19:01:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_expense_categories`
--

CREATE TABLE `finan_expense_categories` (
  `id` bigint(20) NOT NULL,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `default_deductibility_status` enum('DEDUCTIBLE','NON_DEDUCTIBLE','REVIEWABLE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_expense_categories`
--

INSERT INTO `finan_expense_categories` (`id`, `code`, `name`, `default_deductibility_status`, `created_at`) VALUES
(1, 'HOUSING_RENT', 'Alquiler y vivienda', 'NON_DEDUCTIBLE', '2026-04-15 11:33:13'),
(2, 'UTILITIES', 'Suministros', 'NON_DEDUCTIBLE', '2026-04-15 11:33:13'),
(3, 'INSURANCE', 'Seguros', 'REVIEWABLE', '2026-04-15 11:33:13'),
(4, 'HEALTH', 'Salud', 'REVIEWABLE', '2026-04-15 11:33:13'),
(5, 'TAX_ADVISORY', 'Gestoria y asesoria', 'REVIEWABLE', '2026-04-15 11:33:13'),
(6, 'PROFESSIONAL_FEES', 'Cuotas profesionales', 'DEDUCTIBLE', '2026-04-15 11:33:13'),
(7, 'TRANSPORT', 'Transporte', 'REVIEWABLE', '2026-04-15 11:33:13'),
(8, 'SUBSCRIPTIONS', 'Suscripciones', 'REVIEWABLE', '2026-04-15 11:33:13'),
(9, 'SELF_EMPLOYED', 'Autonomos', 'DEDUCTIBLE', '2026-04-15 11:33:13'),
(10, 'TAXES', 'Impuestos', 'NON_DEDUCTIBLE', '2026-04-15 11:33:13'),
(11, 'PERSONAL', 'Gastos personales', 'NON_DEDUCTIBLE', '2026-04-15 11:33:13'),
(12, 'WORK_EXPENSES', 'Gastos laborales', 'REVIEWABLE', '2026-04-15 11:33:13'),
(13, 'TRAINING', 'Formacion', 'REVIEWABLE', '2026-04-15 11:33:13'),
(14, 'HARDWARE', 'Hardware y equipo', 'REVIEWABLE', '2026-04-15 11:33:13'),
(15, 'SOFTWARE', 'Software', 'REVIEWABLE', '2026-04-15 11:33:13'),
(16, 'BANKING', 'Comisiones bancarias', 'REVIEWABLE', '2026-04-15 11:33:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_income_records`
--

CREATE TABLE `finan_income_records` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `payer_id` bigint(20) NOT NULL,
  `contract_id` bigint(20) DEFAULT NULL,
  `income_type` enum('PAYSLIP','BONUS','FREELANCE_INVOICE','RETENTION_CERTIFICATE','OTHER') NOT NULL,
  `period_year` int(11) NOT NULL,
  `period_month` int(11) DEFAULT NULL,
  `gross_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(12,2) DEFAULT NULL,
  `irpf_withheld` decimal(12,2) DEFAULT NULL,
  `social_security_amount` decimal(12,2) DEFAULT NULL,
  `flexible_compensation_amount` decimal(12,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_insurance_policies`
--

CREATE TABLE `finan_insurance_policies` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `policy_type` enum('HEALTH','LIABILITY','HOME','LIFE','AUTO','OTHER') NOT NULL,
  `provider_name` varchar(255) NOT NULL,
  `policy_number` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `monthly_cost` decimal(12,2) DEFAULT NULL,
  `annual_cost` decimal(12,2) DEFAULT NULL,
  `coverage_summary` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_payers`
--

CREATE TABLE `finan_payers` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `payer_name` varchar(255) NOT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `payer_type` enum('EMPLOYER','CLIENT','PUBLIC_BODY','OTHER') NOT NULL DEFAULT 'EMPLOYER',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_payers`
--

INSERT INTO `finan_payers` (`id`, `user_id`, `payer_name`, `tax_id`, `payer_type`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 'TECNOLOGIAS PLEXUS S.L.', 'B15726177', 'EMPLOYER', 'CCC 08/2112996/71. CL Isidro Parga Pondal LOC, 15890 Santiago de Compostela, A Coruna.', '2026-04-15 11:39:57', '2026-04-15 11:39:57'),
(2, 1, 'WEB ADVANCED DEVELOPMENT S.L.', 'B43937655', 'EMPLOYER', 'AV. SANT JORDI 42-46 BL.A LC', '2026-04-15 15:44:44', '2026-04-15 15:44:44'),
(3, 1, 'AUTÓNOMO', '43735032A', 'EMPLOYER', '', '2026-04-15 15:50:04', '2026-04-15 15:50:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_payslip_lines`
--

CREATE TABLE `finan_payslip_lines` (
  `id` bigint(20) NOT NULL,
  `income_record_id` bigint(20) NOT NULL,
  `line_type` enum('EARNING','DEDUCTION','INFORMATIONAL') NOT NULL,
  `concept` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_recurring_payments`
--

CREATE TABLE `finan_recurring_payments` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `category_id` bigint(20) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `frequency` enum('MONTHLY','QUARTERLY','BIANNUAL','YEARLY') NOT NULL,
  `next_due_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deductibility_status` enum('DEDUCTIBLE','NON_DEDUCTIBLE','REVIEWABLE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_rentals`
--

CREATE TABLE `finan_rentals` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `address_line` varchar(255) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'Spain',
  `monthly_rent` decimal(12,2) NOT NULL,
  `deposit_amount` decimal(12,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `landlord_name` varchar(255) DEFAULT NULL,
  `landlord_tax_id` varchar(50) DEFAULT NULL,
  `is_primary_home` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_rules`
--

CREATE TABLE `finan_rules` (
  `id` bigint(20) NOT NULL,
  `rule_code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rule_scope` enum('DOCUMENT','EXPENSE','INCOME','TAX','CONTRACT','ALERT') NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_rules`
--

INSERT INTO `finan_rules` (`id`, `rule_code`, `name`, `rule_scope`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PAYER_ZERO_RETENTION', 'Pagador con retencion cero o anormalmente baja', 'INCOME', 'Si un pagador registra ingresos pero no aplica IRPF retenido, debe generarse una alerta de severidad alta para revision fiscal.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(2, 'MULTIPLE_PAYERS_SAME_YEAR', 'Multiples pagadores en el mismo ejercicio', 'TAX', 'Si el usuario tiene mas de un pagador en un mismo ejercicio fiscal, el sistema debe marcar revision fiscal preventiva.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(3, 'EMPLOYER_PAID_HEALTH_INSURANCE', 'Seguro medico pagado por empresa con posible duplicidad', 'EXPENSE', 'Si un gasto sanitario parece estar ya cubierto por la empresa, debe marcarse como no deducible directo o revisable por duplicidad potencial.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(4, 'CONTRACT_EXCLUSIVITY_KEYWORDS', 'Deteccion de exclusividad contractual', 'CONTRACT', 'Si el contrato contiene terminos asociados a exclusividad, debe generarse una alerta para revision laboral manual.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(5, 'CONTRACT_NON_COMPETE_KEYWORDS', 'Deteccion de no competencia contractual', 'CONTRACT', 'Si el contrato contiene clausulas de no competencia, debe generarse una alerta para revision laboral manual.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(6, 'POLICY_EXPIRING_SOON', 'Poliza proxima a vencimiento', 'ALERT', 'Si una poliza vence en menos de 30 dias, el sistema debe generar una alerta preventiva.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(7, 'HIGH_FIXED_COST_RATIO', 'Carga fija mensual elevada', 'ALERT', 'Si los pagos periodicos superan un umbral relevante respecto al ingreso neto mensual, debe generarse una alerta de tension de caja.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(8, 'UNCLASSIFIED_EXPENSE', 'Gasto sin clasificar o pendiente de validar', 'EXPENSE', 'Si un gasto no tiene categoria valida o su deducibilidad queda en estado desconocido, debe marcarse para revision manual.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(9, 'DOCUMENT_PENDING_VERIFICATION', 'Documento procesado pendiente de verificacion', 'DOCUMENT', 'Si un documento pasa por OCR o LLM pero no queda verificado, debe mantenerse visible para revision del usuario.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13'),
(10, 'CONTRACT_UNSIGNED_OR_MISSING', 'Contrato ausente o sin firma detectable', 'CONTRACT', 'Si existe una relacion contractual activa sin documento firmado o sin evidencia suficiente, debe generarse una alerta de control documental.', 1, '2026-04-15 11:33:13', '2026-04-15 11:33:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_rule_executions`
--

CREATE TABLE `finan_rule_executions` (
  `id` bigint(20) NOT NULL,
  `rule_id` bigint(20) NOT NULL,
  `target_type` varchar(100) NOT NULL,
  `target_id` bigint(20) NOT NULL,
  `execution_result` enum('PASS','FAIL','WARNING','INFO') NOT NULL,
  `execution_message` text DEFAULT NULL,
  `executed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_simulations`
--

CREATE TABLE `finan_simulations` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `simulation_type` enum('NEW_JOB','RETENTION_CHANGE','FREELANCE_PERIOD','NEW_RECURRING_COST','CUSTOM') NOT NULL,
  `input_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`input_payload`)),
  `result_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`result_payload`)),
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_tax_years`
--

CREATE TABLE `finan_tax_years` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `fiscal_year` int(11) NOT NULL,
  `total_work_income` decimal(12,2) DEFAULT NULL,
  `total_irpf_withheld` decimal(12,2) DEFAULT NULL,
  `total_deductible_expenses` decimal(12,2) DEFAULT NULL,
  `total_non_deductible_expenses` decimal(12,2) DEFAULT NULL,
  `estimated_tax_result` decimal(12,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_users`
--

CREATE TABLE `finan_users` (
  `id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_users`
--

INSERT INTO `finan_users` (`id`, `email`, `password_hash`, `full_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'rafa@rafapenya.com', '$2b$12$frQFHS/g1DrSG5rnWWNKi.L2rd9w7AvWedR8IYuTxCYT2KeWrTQK2', 'Rafa Pena', 1, '2026-04-15 11:39:57', '2026-04-15 14:13:29'),
(2, 'copilot.25058.16502@example.com', '$2b$12$gIHVmVzJCF3rmkdcMsdVnOrZwnnhl6L.daW0hH9VWlxOc8a9YZheq', 'Copilot Test', 1, '2026-04-17 22:12:40', '2026-04-17 22:12:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_user_profiles`
--

CREATE TABLE `finan_user_profiles` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `tax_id` varchar(20) DEFAULT NULL,
  `social_security_number` varchar(32) DEFAULT NULL,
  `address_line_1` varchar(255) DEFAULT NULL,
  `address_line_2` varchar(255) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'Spain',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_user_profiles`
--

INSERT INTO `finan_user_profiles` (`id`, `user_id`, `tax_id`, `social_security_number`, `address_line_1`, `address_line_2`, `postal_code`, `city`, `province`, `country`, `created_at`, `updated_at`) VALUES
(1, 1, '43735032A', '25/00484240/73', 'C/ Velazquez 2', '1-7', '43830', 'Torredembarra', 'Tarragona', 'Spain', '2026-04-15 11:39:57', '2026-04-15 11:39:57'),
(2, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Spain', '2026-04-17 22:12:40', '2026-04-17 22:12:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `finan_user_sessions`
--

CREATE TABLE `finan_user_sessions` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `refresh_token_hash` varchar(255) NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `revoked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `finan_user_sessions`
--

INSERT INTO `finan_user_sessions` (`id`, `user_id`, `refresh_token_hash`, `device_info`, `ip_address`, `expires_at`, `created_at`, `revoked_at`) VALUES
(1, 1, '$2b$12$06YVS1yVBATBPYfLSjvGIu7MgHjL87o40bPyA0OsUuBUG.uVMF366', NULL, NULL, '2026-05-15 14:42:33', '2026-04-15 14:42:33', NULL),
(2, 1, '$2b$12$8M4Ptr/FlxMAaBjAxdhM0OzOdPlrDqOkKZUsMSwaofNYdlbxp1Y.G', NULL, NULL, '2026-05-15 15:26:34', '2026-04-15 15:26:34', NULL),
(3, 1, '$2b$12$4B9Fh1dqEJzofyO5mqrcXeoW2iKlbNWEmoDCvgE7aTGQ0ccdz9cqm', NULL, NULL, '2026-05-15 15:42:17', '2026-04-15 15:42:17', NULL),
(4, 1, '$2b$12$lgL.16B7mEd.Uh75Jo1PHOmDAfK2yfRZxNUP7TT39DpEBhCWYuTp6', NULL, NULL, '2026-05-15 16:07:35', '2026-04-15 16:07:35', NULL),
(5, 1, '$2b$12$u64lKgwc6FI269MWmho2lOguR9wu34nb9C/Un1OYOGuNsGXm9AmDq', NULL, NULL, '2026-05-15 18:29:30', '2026-04-15 18:29:30', NULL),
(6, 1, '$2b$12$RFa6eOKfwr0w9wDFJR1q6.sPDAELf.PYLN4ZCwn/om7GmnCEol0KO', NULL, NULL, '2026-05-15 19:52:55', '2026-04-15 19:52:55', NULL),
(7, 1, '$2b$12$qL4twZL1Vlk5GSdAdMZ9o.Ug6K2eegB3xJyy7LNQIgFV2Mc.s0Wci', NULL, NULL, '2026-05-15 20:32:17', '2026-04-15 20:32:17', NULL),
(8, 1, '$2b$12$DRLyEs6w5MOplWkDX0FoAelTWkCvAwlleBzo/zk7BBioapapnCzR.', NULL, NULL, '2026-05-15 20:52:12', '2026-04-15 20:52:12', NULL),
(9, 1, '$2b$12$EmMC47a81Z4itN4kF5rdoujWOaSZldS0yp7XluzgXfsOZOrFAknDu', NULL, NULL, '2026-05-15 21:07:13', '2026-04-15 21:07:13', NULL),
(10, 1, '$2b$12$FpeurQGMZMQA56wAHnf33.ZxcJBn.aHoW57.JsYU7poTRM01Q2t3y', NULL, NULL, '2026-05-15 21:57:50', '2026-04-15 21:57:50', NULL),
(11, 1, '$2b$12$YSGa8RLwvuPD2wRmaOCMn.7uIaJuOgZaig96S3kdoYNLl.MCPwMY6', NULL, NULL, '2026-05-15 22:12:53', '2026-04-15 22:12:53', NULL),
(12, 1, '$2b$12$6s4lfzEvp7tevw.8eTjoMePAL7a6HcSKNkGrxe1ORtaLzZv.xLcT.', NULL, NULL, '2026-05-15 22:35:17', '2026-04-15 22:35:17', NULL),
(13, 1, '$2b$12$w0DBGKF2Xs2vDAXJMEtF/uCzUuVsrarl3Fd9Ln08kW8euCJmxCdNq', NULL, NULL, '2026-05-16 11:22:31', '2026-04-16 11:22:31', NULL),
(14, 1, '$2b$12$zbuG9XDooCCuFwwArGpnuuRar01gQVUsitlqySYZIGffx1fl9g.2W', NULL, NULL, '2026-05-16 11:28:44', '2026-04-16 11:28:44', NULL),
(15, 1, '$2b$12$F.iaAxSXkNxXi.GL4pkNe.qMamuEi0aHfPlgnHkpqtdtN0DWvGPPy', NULL, NULL, '2026-05-16 12:02:14', '2026-04-16 12:02:14', NULL),
(16, 1, '$2b$12$93kRRZuwPBdfn94jSwVKReDhlO0XZVvKSVTaF7zYuktGr0mPvBkJS', NULL, NULL, '2026-05-16 22:04:07', '2026-04-16 22:04:07', NULL),
(17, 1, '$2b$12$PCsG/NIs5ZOdMZd5WwPqbuQV6.vGSqDQFmxuJgE9rOX0uWWo28LAW', NULL, NULL, '2026-05-16 22:47:30', '2026-04-16 22:47:30', NULL),
(18, 1, '$2b$12$tmQ9SVb.fjlXjBzWP6BGF.tRnVAXwUVpLdQy0Yoli5mKXeKak6JN.', NULL, NULL, '2026-05-16 22:59:34', '2026-04-16 22:59:34', NULL),
(19, 1, '$2b$12$69iZHt14oM5aF.s6JuqRQ.LLbqwJEoI5LtVs4TKkEBBodSk4IP./i', NULL, NULL, '2026-05-16 23:11:15', '2026-04-16 23:11:15', NULL),
(20, 1, '$2b$12$HpAGRphkS/9gGGibiKcm2erzZjpQ07cg4qWZEv08NgL5Is1UcKYnm', NULL, NULL, '2026-05-16 23:23:09', '2026-04-16 23:23:09', NULL),
(21, 1, '$2b$12$Y/4DfVuyURdkZySETSf40uIVDPZtNEANBitNaZzL3uOoc65x9s3P2', NULL, NULL, '2026-05-16 23:30:12', '2026-04-16 23:30:12', NULL),
(22, 1, '$2b$12$SiiJEu8tAQVbUfowgNeQZu0YiEr9XCArP9istDaXy4F8xa5moZive', NULL, NULL, '2026-05-17 11:51:41', '2026-04-17 11:51:41', NULL),
(23, 1, '$2b$12$FmZ3yYfKQoilGjs5CHjK/.oUj7C.rksQ30cJh6Pg8rcfGU0tKdYzO', NULL, NULL, '2026-05-17 14:49:27', '2026-04-17 14:49:27', NULL),
(24, 1, '$2b$12$0DrDtBORoJ5eySwKQMtxOOswliTJYaUeNyaZRuRlgdXG/MEeP3Q2m', NULL, NULL, '2026-05-17 15:16:34', '2026-04-17 15:16:34', NULL),
(25, 1, '$2b$12$C5Y/xaJmX9HweP9MIeji0O6VNXu/f6NhhdQ.N1JNnJQbWOycwj7dy', NULL, NULL, '2026-05-17 15:40:28', '2026-04-17 15:40:28', NULL),
(26, 1, '$2b$12$.lJm1RNcRs005x8HdVX7t.AiGhdaxQ/qoWigEbfq8lN6k3C2Qxv2a', NULL, NULL, '2026-05-17 15:47:59', '2026-04-17 15:47:59', NULL),
(27, 1, '$2b$12$eQrSJ1dXNqca3n2gyt0nW.sIFrG68/iBI.jhOGBs5UhPzAXGSlBg6', NULL, NULL, '2026-05-17 15:58:37', '2026-04-17 15:58:37', NULL),
(28, 1, '$2b$12$jWmNKF2IaBSWnsddA.z94O9GdEUH/oeQGsb1zkN3tjW9QbcBtdibC', NULL, NULL, '2026-05-17 17:09:46', '2026-04-17 17:09:46', NULL),
(29, 1, '$2b$12$jkmrycFFpk.iUQqJ0AhVQOgzZDDjRtCIPLK5byx9YQYa7OVffMIwu', NULL, NULL, '2026-05-17 20:00:57', '2026-04-17 20:00:57', NULL),
(30, 1, '$2b$12$e7mIWQW9smXlW33SV/Jui.hX.N0nLs3gszrRrIi2QOareQWjgvMd6', NULL, NULL, '2026-05-17 20:26:36', '2026-04-17 20:26:36', NULL),
(31, 1, '$2b$12$KanDa0tedS.OteSWb9FJ8u1XXKJVX10wxPM7OBt6UYUKdKXNGnHrC', NULL, NULL, '2026-05-17 20:43:58', '2026-04-17 20:43:58', NULL),
(32, 1, '$2b$12$lfsfTm6KmaUjXeO4AiLUXOzZfC8Q6k1jgG1bYb/iMpIs4lfWaRoCm', NULL, NULL, '2026-05-17 20:59:40', '2026-04-17 20:59:40', NULL),
(33, 1, '$2b$12$zOOCYZTp56QYR64CMPehyuk.SJlzhqxT6.P0eaFRQg7Qt/kGWDJze', NULL, NULL, '2026-05-17 21:20:55', '2026-04-17 21:20:55', NULL),
(34, 1, '$2b$12$8mgjzQOnF.Jjo2OoZxZeJOpi4O/JCkiS6/cu0r.5cni6Q.Cnvjigq', NULL, NULL, '2026-05-17 21:58:54', '2026-04-17 21:58:54', NULL),
(35, 2, '$2b$12$hI/zJ3QZdQxaNECr8AZZGeazdjcpEfKBiLQz0kBc.RuH55ISWiEQm', NULL, NULL, '2026-05-17 22:12:40', '2026-04-17 22:12:40', NULL),
(36, 1, '$2b$12$7TeQw1Z8DACfMBPZHSt9Ie85XUIxOqx2T1lZIXMF9SvBG80jncSSy', NULL, NULL, '2026-05-17 22:38:59', '2026-04-17 22:38:59', NULL),
(37, 1, '$2b$12$.qr3wKwrvFTGUYJ66MEceuoAl5K7xhiyySASvV3O.5bhDBYxonzMm', NULL, NULL, '2026-05-17 22:48:06', '2026-04-17 22:48:06', NULL),
(38, 1, '$2b$12$Ifv3LuFHO4VecKgN2igDGeZuEe8VClrp1HrntpDWy66AB5wjCro.e', NULL, NULL, '2026-05-17 23:03:06', '2026-04-17 23:03:06', NULL),
(39, 1, '$2b$12$aUvNV85finqlyLqc9A9Se.gjUViZ0UQer8TK9ugJZLYq.LSCkW8a2', NULL, NULL, '2026-05-19 12:43:33', '2026-04-19 12:43:33', NULL),
(40, 1, '$2b$12$SJ0kD6oLv4owgqz2JMJYsOxjtvAdLfgPTYICraOE08naWaujLpy52', NULL, NULL, '2026-05-19 12:56:37', '2026-04-19 12:56:37', NULL),
(41, 1, '$2b$12$mjpBc3UaJU0JkJBlG91O8.iihFh2P1mSgpeqX/lqSjGaNOoOq.VYO', NULL, NULL, '2026-05-19 12:56:56', '2026-04-19 12:56:56', NULL),
(42, 1, '$2b$12$dTDgYd6/PZGz74vemevVRuqB6n2jo2OxFNtHPWD2K.chB.ZCq4jTe', NULL, NULL, '2026-05-19 12:57:15', '2026-04-19 12:57:15', NULL),
(43, 1, '$2b$12$qjwtI67Vo/3QK4./yMe55.NiCc23PlLkO4TpKsnfZHs5bwuHnLK1W', NULL, NULL, '2026-05-19 13:00:08', '2026-04-19 13:00:08', NULL),
(44, 1, '$2b$12$3kgvapY.HzmuVSRfC4n7KejBc7rl/G.XACtuZsX9mUDWwTURWTa8.', NULL, NULL, '2026-05-19 13:07:01', '2026-04-19 13:07:01', NULL),
(45, 1, '$2b$12$o6WKbhtNF.guEw81HymOHO2keG.HfTUXM8kIMyjY9Lx3dSb2K1skS', NULL, NULL, '2026-05-19 13:26:43', '2026-04-19 13:26:43', NULL),
(46, 1, '$2b$12$Lf5aPmyoeQub7UrKWgJW4Of5LX8VmzRHxHiSVGeVftMbl3YfXD7uG', NULL, NULL, '2026-05-19 14:24:00', '2026-04-19 14:24:00', NULL),
(47, 1, '$2b$12$brcT6.3BqH2VBjHMAJ0eee6mvuHw2JaJ6vWX/WPvnajxAmNOepHKK', NULL, NULL, '2026-05-19 14:37:00', '2026-04-19 14:37:00', NULL),
(48, 1, '$2b$12$BLwzkxJyBvuK3oa3z6VDleMPFuBb7u3WtQc.6Wk/mScLT4KQhCdDq', NULL, NULL, '2026-05-19 15:54:31', '2026-04-19 15:54:31', NULL),
(49, 1, '$2b$12$B5.QDqzA1KVlI4ZCrRNQ/OzYtg03BCoVn1wETk6ig27ENaCn2YuJ2', NULL, NULL, '2026-05-19 16:09:32', '2026-04-19 16:09:32', NULL),
(50, 1, '$2b$12$iK82oxx8QYH/LLhZ3uaNbOVtuQwwGYZ3gdMq2mMtX1nXtJj6oVObK', NULL, NULL, '2026-05-19 17:28:49', '2026-04-19 17:28:49', NULL),
(51, 1, '$2b$12$ZkbElmstGPL63F6F84puu.x6ngoLzMXN7/76kM51jH04M4siWXrti', NULL, NULL, '2026-05-19 17:57:43', '2026-04-19 17:57:43', NULL),
(52, 1, '$2b$12$ZF9/wnQ7L7Otav5gPR8hOuQgp.CeqlBoQbGl/TfOeDkmo4AETnhrG', NULL, NULL, '2026-05-19 18:12:51', '2026-04-19 18:12:51', NULL),
(53, 1, '$2b$12$tleoLUTY9NUE59cdfiZMOu5I57Q/lO9l5PHAIMehke6pqSP26Yaza', NULL, NULL, '2026-05-19 18:30:39', '2026-04-19 18:30:39', NULL),
(54, 1, '$2b$12$wXbi6MPy.fMu8mbuFg.R9uoUhradq64HpNIHiChUcwO8wkGhwsFOy', NULL, NULL, '2026-05-19 18:47:04', '2026-04-19 18:47:04', NULL),
(55, 1, '$2b$12$RCdH5qXnG96QIJ0xarpNkOkIvCZw/BCzvW3cuz7hb2R5HobH8kRc6', NULL, NULL, '2026-05-19 18:48:55', '2026-04-19 18:48:55', NULL),
(56, 1, '$2b$12$RlPCuykZxecUM.ueLciPy.K03R6MPlA3VZrOTU963xeD6ytOhzb56', NULL, NULL, '2026-05-19 19:04:42', '2026-04-19 19:04:42', NULL),
(57, 1, '$2b$12$b3VI45Jgci/V96kVxYHOeuJzEwU7sPp/Mn9Yrot74.9PGxgJn/09S', NULL, NULL, '2026-05-19 19:19:59', '2026-04-19 19:19:59', NULL),
(58, 1, '$2b$12$zrSIxrT5gNWbErwikjTSf.xK6c07cNZd8JMxbSfledbkcQ/WLBqSu', NULL, NULL, '2026-05-19 20:06:15', '2026-04-19 20:06:15', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `finan_ai_prompts`
--
ALTER TABLE `finan_ai_prompts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_finan_ai_prompts_code_version` (`prompt_code`,`version`),
  ADD KEY `idx_finan_ai_prompts_lookup` (`prompt_scope`,`provider`,`document_type`,`is_active`);

--
-- Indices de la tabla `finan_alerts`
--
ALTER TABLE `finan_alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_alerts_user_id` (`user_id`);

--
-- Indices de la tabla `finan_contracts`
--
ALTER TABLE `finan_contracts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_contracts_user_id` (`user_id`),
  ADD KEY `idx_finan_contracts_payer_id` (`payer_id`);

--
-- Indices de la tabla `finan_documents`
--
ALTER TABLE `finan_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_documents_user_id` (`user_id`);

--
-- Indices de la tabla `finan_document_field_values`
--
ALTER TABLE `finan_document_field_values`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_document_field_values_document_id` (`document_id`);

--
-- Indices de la tabla `finan_document_llm_results`
--
ALTER TABLE `finan_document_llm_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_document_llm_results_document_id` (`document_id`),
  ADD KEY `idx_finan_document_llm_results_ocr_result_id` (`ocr_result_id`);

--
-- Indices de la tabla `finan_document_ocr_results`
--
ALTER TABLE `finan_document_ocr_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_document_ocr_results_document_id` (`document_id`);

--
-- Indices de la tabla `finan_expenses`
--
ALTER TABLE `finan_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_expenses_user_id` (`user_id`),
  ADD KEY `idx_finan_expenses_category_id` (`category_id`),
  ADD KEY `idx_finan_expenses_payer_id` (`payer_id`);

--
-- Indices de la tabla `finan_expense_categories`
--
ALTER TABLE `finan_expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indices de la tabla `finan_income_records`
--
ALTER TABLE `finan_income_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_income_records_user_id` (`user_id`),
  ADD KEY `idx_finan_income_records_payer_id` (`payer_id`),
  ADD KEY `idx_finan_income_records_contract_id` (`contract_id`);

--
-- Indices de la tabla `finan_insurance_policies`
--
ALTER TABLE `finan_insurance_policies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_insurance_policies_user_id` (`user_id`);

--
-- Indices de la tabla `finan_payers`
--
ALTER TABLE `finan_payers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_payers_user_id` (`user_id`);

--
-- Indices de la tabla `finan_payslip_lines`
--
ALTER TABLE `finan_payslip_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_payslip_lines_income_record_id` (`income_record_id`);

--
-- Indices de la tabla `finan_recurring_payments`
--
ALTER TABLE `finan_recurring_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_recurring_payments_user_id` (`user_id`),
  ADD KEY `idx_finan_recurring_payments_category_id` (`category_id`);

--
-- Indices de la tabla `finan_rentals`
--
ALTER TABLE `finan_rentals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_rentals_user_id` (`user_id`);

--
-- Indices de la tabla `finan_rules`
--
ALTER TABLE `finan_rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rule_code` (`rule_code`);

--
-- Indices de la tabla `finan_rule_executions`
--
ALTER TABLE `finan_rule_executions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_rule_executions_rule_id` (`rule_id`);

--
-- Indices de la tabla `finan_simulations`
--
ALTER TABLE `finan_simulations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_simulations_user_id` (`user_id`);

--
-- Indices de la tabla `finan_tax_years`
--
ALTER TABLE `finan_tax_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_finan_tax_years_user_year` (`user_id`,`fiscal_year`);

--
-- Indices de la tabla `finan_users`
--
ALTER TABLE `finan_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `finan_user_profiles`
--
ALTER TABLE `finan_user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_finan_user_profiles_user_id` (`user_id`);

--
-- Indices de la tabla `finan_user_sessions`
--
ALTER TABLE `finan_user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finan_user_sessions_user_id` (`user_id`),
  ADD KEY `idx_finan_user_sessions_expires_at` (`expires_at`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `finan_ai_prompts`
--
ALTER TABLE `finan_ai_prompts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `finan_alerts`
--
ALTER TABLE `finan_alerts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_contracts`
--
ALTER TABLE `finan_contracts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_documents`
--
ALTER TABLE `finan_documents`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `finan_document_field_values`
--
ALTER TABLE `finan_document_field_values`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT de la tabla `finan_document_llm_results`
--
ALTER TABLE `finan_document_llm_results`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `finan_document_ocr_results`
--
ALTER TABLE `finan_document_ocr_results`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `finan_expenses`
--
ALTER TABLE `finan_expenses`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `finan_expense_categories`
--
ALTER TABLE `finan_expense_categories`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT de la tabla `finan_income_records`
--
ALTER TABLE `finan_income_records`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `finan_insurance_policies`
--
ALTER TABLE `finan_insurance_policies`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_payers`
--
ALTER TABLE `finan_payers`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `finan_payslip_lines`
--
ALTER TABLE `finan_payslip_lines`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_recurring_payments`
--
ALTER TABLE `finan_recurring_payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_rentals`
--
ALTER TABLE `finan_rentals`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_rules`
--
ALTER TABLE `finan_rules`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `finan_rule_executions`
--
ALTER TABLE `finan_rule_executions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_simulations`
--
ALTER TABLE `finan_simulations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_tax_years`
--
ALTER TABLE `finan_tax_years`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `finan_users`
--
ALTER TABLE `finan_users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `finan_user_profiles`
--
ALTER TABLE `finan_user_profiles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `finan_user_sessions`
--
ALTER TABLE `finan_user_sessions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `finan_alerts`
--
ALTER TABLE `finan_alerts`
  ADD CONSTRAINT `fk_finan_alerts_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_contracts`
--
ALTER TABLE `finan_contracts`
  ADD CONSTRAINT `fk_finan_contracts_payer` FOREIGN KEY (`payer_id`) REFERENCES `finan_payers` (`id`),
  ADD CONSTRAINT `fk_finan_contracts_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_documents`
--
ALTER TABLE `finan_documents`
  ADD CONSTRAINT `fk_finan_documents_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_document_field_values`
--
ALTER TABLE `finan_document_field_values`
  ADD CONSTRAINT `fk_finan_document_field_values_document` FOREIGN KEY (`document_id`) REFERENCES `finan_documents` (`id`);

--
-- Filtros para la tabla `finan_document_llm_results`
--
ALTER TABLE `finan_document_llm_results`
  ADD CONSTRAINT `fk_finan_document_llm_results_document` FOREIGN KEY (`document_id`) REFERENCES `finan_documents` (`id`),
  ADD CONSTRAINT `fk_finan_document_llm_results_ocr` FOREIGN KEY (`ocr_result_id`) REFERENCES `finan_document_ocr_results` (`id`);

--
-- Filtros para la tabla `finan_document_ocr_results`
--
ALTER TABLE `finan_document_ocr_results`
  ADD CONSTRAINT `fk_finan_document_ocr_results_document` FOREIGN KEY (`document_id`) REFERENCES `finan_documents` (`id`);

--
-- Filtros para la tabla `finan_expenses`
--
ALTER TABLE `finan_expenses`
  ADD CONSTRAINT `fk_finan_expenses_category` FOREIGN KEY (`category_id`) REFERENCES `finan_expense_categories` (`id`),
  ADD CONSTRAINT `fk_finan_expenses_payer` FOREIGN KEY (`payer_id`) REFERENCES `finan_payers` (`id`),
  ADD CONSTRAINT `fk_finan_expenses_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_income_records`
--
ALTER TABLE `finan_income_records`
  ADD CONSTRAINT `fk_finan_income_records_contract` FOREIGN KEY (`contract_id`) REFERENCES `finan_contracts` (`id`),
  ADD CONSTRAINT `fk_finan_income_records_payer` FOREIGN KEY (`payer_id`) REFERENCES `finan_payers` (`id`),
  ADD CONSTRAINT `fk_finan_income_records_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_insurance_policies`
--
ALTER TABLE `finan_insurance_policies`
  ADD CONSTRAINT `fk_finan_insurance_policies_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_payers`
--
ALTER TABLE `finan_payers`
  ADD CONSTRAINT `fk_finan_payers_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_payslip_lines`
--
ALTER TABLE `finan_payslip_lines`
  ADD CONSTRAINT `fk_finan_payslip_lines_income_record` FOREIGN KEY (`income_record_id`) REFERENCES `finan_income_records` (`id`);

--
-- Filtros para la tabla `finan_recurring_payments`
--
ALTER TABLE `finan_recurring_payments`
  ADD CONSTRAINT `fk_finan_recurring_payments_category` FOREIGN KEY (`category_id`) REFERENCES `finan_expense_categories` (`id`),
  ADD CONSTRAINT `fk_finan_recurring_payments_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_rentals`
--
ALTER TABLE `finan_rentals`
  ADD CONSTRAINT `fk_finan_rentals_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_rule_executions`
--
ALTER TABLE `finan_rule_executions`
  ADD CONSTRAINT `fk_finan_rule_executions_rule` FOREIGN KEY (`rule_id`) REFERENCES `finan_rules` (`id`);

--
-- Filtros para la tabla `finan_simulations`
--
ALTER TABLE `finan_simulations`
  ADD CONSTRAINT `fk_finan_simulations_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_tax_years`
--
ALTER TABLE `finan_tax_years`
  ADD CONSTRAINT `fk_finan_tax_years_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_user_profiles`
--
ALTER TABLE `finan_user_profiles`
  ADD CONSTRAINT `fk_finan_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);

--
-- Filtros para la tabla `finan_user_sessions`
--
ALTER TABLE `finan_user_sessions`
  ADD CONSTRAINT `fk_finan_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `finan_users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
