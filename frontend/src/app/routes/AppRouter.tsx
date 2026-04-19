import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/app/layout/AppLayout";
import { AlertsPage } from "@/presentation/pages/AlertsPage";
import { ContractsPage } from "@/presentation/pages/ContractsPage";
import { DashboardPage } from "@/presentation/pages/DashboardPage";
import { DocumentRepositoryPage } from "@/presentation/pages/DocumentRepositoryPage";
import { DocumentsPage } from "@/presentation/pages/DocumentsPage";
import { ExpensesPage } from "@/presentation/pages/ExpensesPage";
import { IncomesPage } from "@/presentation/pages/IncomesPage";
import { LaborDocumentsPage } from "@/presentation/pages/LaborDocumentsPage";
import { LoginPage } from "@/presentation/pages/LoginPage";
import { NotFoundPage } from "@/presentation/pages/NotFoundPage";
import { PayersPage } from "@/presentation/pages/PayersPage";
import { ProfilePage } from "@/presentation/pages/ProfilePage";
import { RecurringPaymentsPage } from "@/presentation/pages/RecurringPaymentsPage";
import { SimulationsPage } from "@/presentation/pages/SimulationsPage";
import { TaxesPage } from "@/presentation/pages/TaxesPage";
import { PrivateRoutes } from "./PrivateRoutes";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoutes />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/payers" element={<PayersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:documentId" element={<DocumentsPage />} />
          <Route path="/documents/labor" element={<LaborDocumentsPage />} />
          <Route
            path="/documents/repository"
            element={<DocumentRepositoryPage />}
          />
          <Route path="/incomes" element={<IncomesPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route
            path="/recurring-payments"
            element={<RecurringPaymentsPage />}
          />
          <Route path="/taxes" element={<TaxesPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
