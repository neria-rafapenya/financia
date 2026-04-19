import { useState } from "react";
import { useAuth } from "@/application/contexts/AuthContext";
import { AuthRepository } from "@/infrastructure/repositories/AuthRepository";
import { AuthService } from "@/application/services/AuthService";
import { PageHero } from "@/presentation/components/PageHero";

const authService = new AuthService(new AuthRepository());

export function ProfilePage() {
  const auth = useAuth();
  const [fullName, setFullName] = useState(auth.user?.fullName ?? "");
  const [taxId, setTaxId] = useState(auth.user?.taxId ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      await authService.updateCurrentUser({
        fullName: fullName.trim(),
        taxId: taxId.trim() || null,
      });
      await auth.refreshUser();
      setProfileMessage("Perfil fiscal actualizado correctamente.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el perfil",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError(null);
    setPasswordMessage(null);
    setIsSavingPassword(true);

    try {
      await authService.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage(
        "Contraseña actualizada. Será necesario volver a iniciar sesión en otros dispositivos.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cambiar la contraseña",
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        title="Perfil y fiscalidad"
        description="Configura tu identidad fiscal y tu acceso para que la detección de facturas, obligaciones y simulaciones sea más fiable."
        meta="Perfil"
      />

      {error ? <div className="alert alert-danger mb-0">{error}</div> : null}

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Datos personales y fiscales</h2>
              <form className="d-grid gap-3" onSubmit={handleSaveProfile}>
                <input
                  className="form-control"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nombre completo"
                  required
                />
                <input
                  className="form-control"
                  value={auth.user?.email ?? ""}
                  disabled
                />
                <input
                  className="form-control"
                  value={taxId}
                  onChange={(event) => setTaxId(event.target.value)}
                  placeholder="NIF / NIE / CIF"
                />

                {profileMessage ? (
                  <div className="alert alert-success mb-0">
                    {profileMessage}
                  </div>
                ) : null}

                <button
                  className="btn btn-dark"
                  type="submit"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Guardando..." : "Guardar perfil"}
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-6">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Seguridad de acceso</h2>
              <form className="d-grid gap-3" onSubmit={handleChangePassword}>
                <input
                  className="form-control"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Contraseña actual"
                  required
                />
                <input
                  className="form-control"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Nueva contraseña"
                  minLength={8}
                  required
                />

                {passwordMessage ? (
                  <div className="alert alert-success mb-0">
                    {passwordMessage}
                  </div>
                ) : null}

                <button
                  className="btn btn-outline-dark"
                  type="submit"
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? "Actualizando..." : "Cambiar contraseña"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
