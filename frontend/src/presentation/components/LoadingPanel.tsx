interface LoadingPanelProps {
  message?: string;
}

export function LoadingPanel({
  message = "Cargando...",
}: Readonly<LoadingPanelProps>) {
  return (
    <div className="loading-panel card border-0 shadow-sm">
      <div className="card-body d-flex align-items-center gap-3 p-4">
        <div className="spinner-border text-info" aria-hidden="true" />
        <div>
          <p className="mb-0 fw-semibold">{message}</p>
        </div>
      </div>
    </div>
  );
}
