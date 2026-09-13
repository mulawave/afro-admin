import { api } from "@/lib/api";

// Channels
export function searchChannels() {
  return api.get("/admin/channels");
}

export function injectChannelViews(channelId, amount) {
  return api.post(`/admin/channels/${channelId}/views/inject`, { amount });
}

export function removeChannelViews(channelId, amount) {
  return api.post(`/admin/channels/${channelId}/views/remove`, { amount });
}

export function injectChannelFollowers(channelId, amount) {
  return api.post(`/admin/channels/${channelId}/followers/inject`, { amount });
}

export function removeChannelFollowers(channelId, amount) {
  return api.post(`/admin/channels/${channelId}/followers/remove`, { amount });
}

// Waves
export function searchWaves({ waveId, channelId, limit } = {}) {
  const params = new URLSearchParams();
  if (waveId) params.set("waveId", waveId);
  if (channelId) params.set("channelId", channelId);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return api.get(`/admin/waves/search${qs ? `?${qs}` : ""}`);
}

export function injectWaveViews(waveId, amount) {
  return api.post(`/admin/waves/${waveId}/views/inject`, { amount });
}

export function removeWaveViews(waveId, amount) {
  return api.post(`/admin/waves/${waveId}/views/remove`, { amount });
}

export function injectWaveReplays(waveId, amount) {
  return api.post(`/admin/waves/${waveId}/replays/inject`, { amount });
}

export function removeWaveReplays(waveId, amount) {
  return api.post(`/admin/waves/${waveId}/replays/remove`, { amount });
}
