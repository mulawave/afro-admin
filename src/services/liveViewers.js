import { api } from "@/lib/api";

export function getLiveOverview() {
  return api.get("/admin/channels/live-overview");
}
