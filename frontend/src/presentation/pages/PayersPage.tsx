import { useState } from "react";
import { usePayers } from "@/application/contexts/PayersContext";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

export function PayersPage() {
  const { payers, isLoading, error, createPayer } = usePayers();
  const [payerName, setPayerName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await createPayer({
        payerName,
        taxId,
        payerType: "EMPLOYER",
        notes,
      });

      setPayerName("");
      setTaxId("");
      setNotes("");
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo crear el pagador",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        title="Pagadores"
        description="Gestión inicial de empleadores, clientes u organismos pagadores conectados a la API real."
        meta="Catálogo"
      />

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Nuevo pagador</h2>
              <form className="d-grid gap-3" onSubmit={handleSubmit}>
                <input
                  className="form-control"
                  placeholder="Nombre del pagador"
                  value={payerName}
                  onChange={(event) => setPayerName(event.target.value)}
                  required
                />
                <input
                  className="form-control"
                  placeholder="NIF / CIF"
                  value={taxId}
                  onChange={(event) => setTaxId(event.target.value)}
                />
                <textarea
                  className="form-control"
                  placeholder="Notas"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />

                {formError ? (
                  <div className="alert alert-danger mb-0">{formError}</div>
                ) : null}

                <button
                  className="btn btn-dark"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Crear pagador"}
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-8">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Listado</h2>
              {isLoading ? (
                <LoadingPanel message="Cargando pagadores..." />
              ) : null}
              {error ? <div className="alert alert-danger">{error}</div> : null}

              {!isLoading && !payers.length ? (
                <p className="mb-0 text-secondary">
                  Todavía no hay pagadores registrados.
                </p>
              ) : null}

              <div className="list-stack">
                {payers.map((payer) => (
                  <article key={payer.id} className="entity-card">
                    <div>
                      <h3>{payer.payerName}</h3>
                      <p className="mb-1">
                        {payer.taxId ?? "Sin identificador fiscal"}
                      </p>
                      <small>{payer.notes ?? "Sin notas adicionales"}</small>
                    </div>
                    <span className="badge text-bg-light">
                      {payer.payerType}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
