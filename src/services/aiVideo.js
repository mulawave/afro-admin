import { api } from "@/lib/api";

export async function getAiVideoAdminConfig() {
  return api.get("/admin/ai-video/config");
}

export async function updateAiVideoAdminConfig(body) {
  return api.put("/admin/ai-video/config", body);
}

export async function getAiVideoProviders() {
  return api.get("/admin/ai-video/providers");
}

export async function updateAiVideoProvider(providerKey, body) {
  return api.put(`/admin/ai-video/providers/${providerKey}`, body);
}

export async function testAiVideoProvider(providerKey) {
  return api.post(`/admin/ai-video/providers/${providerKey}/test`, {});
}
