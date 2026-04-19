import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="container py-5">
      <section className="card border-0 shadow-sm text-center p-5">
        <span className="page-hero__meta">404</span>
        <h1 className="display-6">La ruta solicitada no existe</h1>
        <p className="text-secondary mb-4">
          La navegación está protegida y centralizada; vuelve al inicio para
          continuar.
        </p>
        <div>
          <Link className="btn btn-dark" to="/">
            Ir al dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
