import { expect, test } from "@playwright/test";

test.describe("/documents", () => {
  test("muestra el espacio documental autenticado", async ({ page }) => {
    await page.goto("/documents");

    await expect(page).toHaveURL(/\/documents$/);
    await expect(
      page.getByRole("heading", { name: "Documentos", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nueva carga documental" }),
    ).toBeVisible();
    await expect(
      page.getByText("Arrastra un archivo aquí o haz clic para seleccionarlo"),
    ).toBeVisible();
    await expect(page.getByLabel("Tipo documental")).toBeVisible();
    await expect(page.getByLabel("Fecha del documento")).toBeVisible();
    await expect(page.getByLabel("Notas")).toBeVisible();
    await expect(page.getByLabel("Instrucciones para el LLM")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Subir y analizar" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("heading", { name: "Últimos documentos" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Abrir listado documental" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Detalle procesado" }),
    ).toBeVisible();
  });
});
