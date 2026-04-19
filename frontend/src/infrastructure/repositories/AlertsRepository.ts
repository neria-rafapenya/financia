import type { AlertRecord } from "@/domain/interfaces/alert.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class AlertsRepository {
  listAlerts() {
    return fetchWithAuth<AlertRecord[]>("/alerts");
  }

  markAsRead(alertId: number) {
    return fetchWithAuth<{ success: boolean }>(`/alerts/${alertId}/read`, {
      method: "PUT",
    });
  }

  resolveAlert(alertId: number) {
    return fetchWithAuth<{ success: boolean }>(`/alerts/${alertId}/resolve`, {
      method: "PUT",
    });
  }
}
