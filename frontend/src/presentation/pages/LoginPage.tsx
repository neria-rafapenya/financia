import { useState } from "react";
import { useAuth } from "@/application/contexts/AuthContext";
import { env } from "@/shared/config/env";
import { FormFieldInfo } from "@/shared/components/FormFieldInfo";

export function LoginPage() {
  const auth = useAuth();
  const [email, setEmail] = useState("rafa@rafapenya.com");
  const [password, setPassword] = useState("JRK441e22");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await auth.login({
        email: email.trim(),
        password,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo iniciar sesion",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container py-5">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 col-xl-10">
            <div className="login-panel">
              <section className="login-panel__intro">
                <span className="login-panel__eyebrow">{env.appName}</span>
                <h1>
                  Controla ingresos, gastos y documentos desde un único panel.
                </h1>
                <p className="mt-5">
                  FINANCIA te ayuda a centralizar tu información económica para
                  consultar ingresos, registrar gastos, revisar documentos
                  procesados y mantener una visión clara de tu situación
                  financiera en el día a día.
                </p>
              </section>

              <section className="login-panel__form card border-0 shadow-lg">
                <div className="card-body p-4 p-lg-5">
                  <h2 className="h3 mb-4">Acceso</h2>

                  <form className="d-grid gap-3" onSubmit={handleSubmit}>
                    <div>
                      <label className="form-label" htmlFor="email">
                        Email
                        <FormFieldInfo text="Correo electrónico con el que accedes a tu cuenta." />
                      </label>
                      <input
                        id="email"
                        className="form-control form-control-lg"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="password">
                        Password
                        <FormFieldInfo text="Contraseña asociada a tu cuenta para iniciar sesión." />
                      </label>
                      <input
                        id="password"
                        className="form-control form-control-lg"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    {error ? (
                      <div className="alert alert-danger mb-0">{error}</div>
                    ) : null}

                    <button
                      className="btn btn-warning btn-lg w-100"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Entrando..." : "Entrar al panel"}
                    </button>
                  </form>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
