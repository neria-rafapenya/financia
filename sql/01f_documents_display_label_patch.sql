USE financia;

ALTER TABLE finan_documents
  ADD COLUMN display_label VARCHAR(255) NULL
  AFTER document_type;