import { useEffect, useState } from "react";
import { usePayers } from "@/application/contexts/PayersContext";
import type { Payer } from "@/domain/interfaces/payer.interface";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

function getInitialFormState() {
  return {
    payerName: "",
    taxId: "",
    payerType: "EMPLOYER" as Payer["payerType"],
    notes: "",
  };
}

export function PayersPage() {
  const { payers, isLoading, error, createPayer, updatePayer, deletePayer } =
    usePayers();
  const [formState, setFormState] = useState(getInitialFormState);
  const [editingPayerId, setEditingPayerId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPayerId, setDeletingPayerId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setSuccessMessage(null);
    }, 2800);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (editingPayerId) {
        await updatePayer(editingPayerId, {
          payerName: formState.payerName.trim(),
          taxId: formState.taxId.trim() || null,
          payerType: formState.payerType,
          notes: formState.notes.trim() || null,
        });
        setSuccessMessage("Pagador actualizado correctamente.");
      } else {
        await createPayer({
          payerName: formState.payerName.trim(),
          taxId: formState.taxId.trim() || undefined,
          payerType: formState.payerType,
          notes: formState.notes.trim() || undefined,
        });
        setSuccessMessage("Pagador creado correctamente.");
      }

      setFormState(getInitialFormState());
      setEditingPayerId(null);
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

  const handleEdit = (payer: Payer) => {
    setEditingPayerId(payer.id);
    setFormError(null);
    setSuccessMessage(null);
    setFormState({
      payerName: payer.payerName,
      taxId: payer.taxId ?? "",
      payerType: payer.payerType,
      notes: payer.notes ?? "",
    });
  };

  const handleDelete = async (payer: Payer) => {
    const confirmed = globalThis.confirm(
      `Se eliminará el pagador ${payer.payerName}. ¿Continuar?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingPayerId(payer.id);
    setFormError(null);
    setSuccessMessage(null);

    try {
      await deletePayer(payer.id);

      if (editingPayerId === payer.id) {
        setEditingPayerId(null);
        setFormState(getInitialFormState());
      }

      setSuccessMessage("Pagador eliminado correctamente.");
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar el pagador",
      );
    } finally {
      setDeletingPayerId(null);
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
              <h2 className="h4 mb-3">
                {editingPayerId ? "Editar pagador" : "Nuevo pagador"}
              </h2>
              <form className="d-grid gap-3" onSubmit={handleSubmit}>
                <input
                  className="form-control"
                  placeholder="Nombre del pagador"
                  value={formState.payerName}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      payerName: event.target.value,
                    }))
                  }
                  required
                />
                <input
                  className="form-control"
                  placeholder="NIF / CIF"
                  value={formState.taxId}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      taxId: event.target.value,
                    }))
                  }
                />
                <select
                  className="form-select"
                  value={formState.payerType}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      payerType: event.target.value as Payer["payerType"],
                    }))
                  }
                >
                  <option value="EMPLOYER">Empleador</option>
                  <option value="CLIENT">Cliente</option>
                  <option value="PUBLIC_BODY">Organismo público</option>
                  <option value="OTHER">Otro</option>
                </select>
                <textarea
                  className="form-control"
                  placeholder="Notas"
                  rows={4}
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />

                {successMessage ? (
                  <div className="alert alert-success mb-0">
                    {successMessage}
                  </div>
                ) : null}

                {formError ? (
                  <div className="alert alert-danger mb-0">{formError}</div>
                ) : null}

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-dark"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Guardando..."
                      : editingPayerId
                        ? "Guardar cambios"
                        : "Crear pagador"}
                  </button>

                  {editingPayerId ? (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => {
                        setEditingPayerId(null);
                        setFormState(getInitialFormState());
                        setFormError(null);
                      }}
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
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
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge text-bg-light">
                        {payer.payerType}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline-dark btn-sm"
                        onClick={() => handleEdit(payer)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => void handleDelete(payer)}
                        disabled={deletingPayerId === payer.id}
                      >
                        {deletingPayerId === payer.id ? "Eliminando" : "Borrar"}
                      </button>
                    </div>
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
