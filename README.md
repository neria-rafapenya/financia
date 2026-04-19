# financia

## Tests E2E del frontend

Se ha preparado Playwright en el frontend para empezar por la pantalla de documentos.

Comandos principales:

- `cd frontend && yarn test:e2e`
- `cd frontend && yarn test:e2e:documents`
- `cd frontend && yarn test:e2e:ui`

El setup de Playwright arranca frontend y backend si no están ya levantados, reutiliza sesión autenticada mediante `storageState` y permite sobreescribir las credenciales con `PLAYWRIGHT_E2E_EMAIL` y `PLAYWRIGHT_E2E_PASSWORD`.

Primer alcance cubierto:

- `http://127.0.0.1:5173/documents`

Prerequisito funcional:

- El backend debe poder arrancar con su configuración local y tener disponible un usuario válido para login.
