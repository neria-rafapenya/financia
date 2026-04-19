import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/application/contexts/AuthContext";
import { DashboardProvider } from "@/application/contexts/DashboardContext";
import { DocumentsProvider } from "@/application/contexts/DocumentsContext";
import { PayersProvider } from "@/application/contexts/PayersContext";
import { AppRouter } from "./routes/AppRouter";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DashboardProvider>
          <PayersProvider>
            <DocumentsProvider>
              <AppRouter />
            </DocumentsProvider>
          </PayersProvider>
        </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
