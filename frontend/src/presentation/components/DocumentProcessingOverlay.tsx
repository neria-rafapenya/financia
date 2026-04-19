interface DocumentProcessingOverlayProps {
  title: string;
  message: string;
  ariaLabel: string;
}

export function DocumentProcessingOverlay({
  title,
  message,
  ariaLabel,
}: Readonly<DocumentProcessingOverlayProps>) {
  return (
    <div
      className="documents-upload-overlay"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="documents-upload-overlay__panel">
        <div
          className="spinner-border documents-upload-overlay__spinner"
          aria-hidden="true"
        />
        <strong className="documents-upload-overlay__title">{title}</strong>
        <p className="documents-upload-overlay__text mb-0">{message}</p>
      </div>
    </div>
  );
}
