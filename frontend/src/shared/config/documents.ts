export const DOCUMENT_UPLOAD_MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024;
export const DOCUMENT_UPLOAD_RAW_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const DOCUMENT_IMAGE_OPTIMIZATION_THRESHOLD_BYTES = 4 * 1024 * 1024;

export function formatDocumentFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
