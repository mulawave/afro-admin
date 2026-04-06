"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAdminToken } from "@/lib/api";
import Drawer from "@/components/ui/Drawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

const INPUT_CLASS = "w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/28";
const TEXTAREA_CLASS = "w-full min-h-28 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/28";
const TOGGLE_ON = "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)] text-white";
const TOGGLE_OFF = "border-white/10 bg-white/6 text-white/68 hover:bg-white/10";

const SECTION_META = {
  hero: { label: "Hero Slides", itemKey: "slides" },
  featured_channels: { label: "Featured Channels", itemKey: "items" },
  live_now: { label: "Streams Happening Now", itemKey: "items" },
  upcoming_shows: { label: "Upcoming Shows", itemKey: "items" },
  challenge: { label: "Challenge", itemKey: "stats" },
  updates: { label: "Latest Updates", itemKey: "items" },
  social_links: { label: "Social Links" },
};

const DIRECT_API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://afrovision-backend-134538542038.us-central1.run.app").replace(/\/$/, "");

const LOCAL_DEFAULT_DESIGN = {
  hero: {
    key: "hero",
    enabled: true,
    sort_order: 1,
    auto_rotate_ms: 6000,
    slides: [
      { id: "hero-1", enabled: true, sort_order: 1, type: "live", icon: "🔴", subtitle: "LIVE NOW", title: "AfroBeats Friday Night", description: "The biggest Afrobeats DJs are live right now. Join the party, send gifts, and earn VPT while vibing with thousands of fans.", cta_label: "Watch Live Now", cta_href: "/live", secondary_cta_label: "Browse All Live", secondary_cta_href: "/live", image_url: null, linked_channel_id: null, channel_name: "AfroBeats Live", is_live: true, viewers: 12400 },
      { id: "hero-2", enabled: true, sort_order: 2, type: "promo", icon: "🎬", subtitle: "Africa's Premier Streaming Platform", title: "Watch. Earn. Connect.", description: "Join thousands of creators and viewers on the continent's most vibrant live streaming community. Earn VPT rewards while you watch.", cta_label: "Explore Channels", cta_href: "/channels", secondary_cta_label: "Download App", secondary_cta_href: "/download", image_url: null, linked_channel_id: null, channel_name: "", is_live: false, viewers: null },
      { id: "hero-3", enabled: true, sort_order: 3, type: "challenge", icon: "🏆", subtitle: "Season 1 — ₦5M+ Prize Pool", title: "AfroVision Challenge", description: "Compete, stream, and win big. The continent's biggest creator challenge is live. 200+ contestants, 10 categories, real prizes.", cta_label: "Join the Challenge", cta_href: "#challenge", secondary_cta_label: "Watch Auditions", secondary_cta_href: "/challenge/auditions", image_url: null, linked_channel_id: null, channel_name: "", is_live: false, viewers: null },
      { id: "hero-4", enabled: true, sort_order: 4, type: "live", icon: "🔴", subtitle: "LIVE NOW", title: "Tech Talk: AI in Africa", description: "Join the conversation about artificial intelligence and its impact on African tech ecosystems. Top speakers, real insights.", cta_label: "Watch Live Now", cta_href: "/live", secondary_cta_label: "Set Reminder", secondary_cta_href: "/schedule", image_url: null, linked_channel_id: null, channel_name: "Tech Africa", is_live: true, viewers: 3200 },
    ],
  },
  featured_channels: {
    key: "featured_channels",
    enabled: true,
    sort_order: 2,
    title: "🔥 Featured Channels",
    subtitle: "Trending live and popular channels right now",
    cta_label: "View All →",
    cta_href: "/channels",
    auto_slide: true,
    shuffle_items: false,
    items: [],
  },
  live_now: {
    key: "live_now",
    enabled: true,
    sort_order: 3,
    badge_text: "Live Now",
    title: "Streams Happening Now",
    subtitle: "Jump in before you miss out",
    cta_label: "View All Live →",
    cta_href: "/live",
    auto_slide: true,
    shuffle_items: false,
    items: [],
  },
  upcoming_shows: {
    key: "upcoming_shows",
    enabled: true,
    sort_order: 4,
    title: "📅 Upcoming Shows",
    subtitle: "Don't miss these live events — set a reminder",
    cta_label: "Full Schedule →",
    cta_href: "/schedule",
    shuffle_items: false,
    items: [
      { id: "show-1", enabled: true, sort_order: 1, title: "AfroBeats Friday Night", channel: "AfroBeats Live", category: "Music", scheduled_at: new Date(Date.now() + 3 * 3600000).toISOString(), icon: "🎵" },
      { id: "show-2", enabled: true, sort_order: 2, title: "Tech Talk: AI in Africa", channel: "Tech Africa", category: "Technology", scheduled_at: new Date(Date.now() + 8 * 3600000).toISOString(), icon: "💻" },
      { id: "show-3", enabled: true, sort_order: 3, title: "Stand-Up Special: Lagos Laughs", channel: "Lagos Comedy Club", category: "Comedy", scheduled_at: new Date(Date.now() + 26 * 3600000).toISOString(), icon: "😂" },
      { id: "show-4", enabled: true, sort_order: 4, title: "Safari Sunset Stream", channel: "Safari Streams", category: "Nature", scheduled_at: new Date(Date.now() + 50 * 3600000).toISOString(), icon: "🦁" },
      { id: "show-5", enabled: true, sort_order: 5, title: "Amapiano Live Mix", channel: "Amapiano Radio", category: "Music", scheduled_at: new Date(Date.now() + 72 * 3600000).toISOString(), icon: "🎧" },
      { id: "show-6", enabled: true, sort_order: 6, title: "Startup Pitch Night", channel: "Startup Hub", category: "Business", scheduled_at: new Date(Date.now() + 96 * 3600000).toISOString(), icon: "🚀" },
    ],
  },
  challenge: {
    key: "challenge",
    enabled: true,
    sort_order: 5,
    badge_icon: "🏆",
    badge_text: "Season 1 — Now Open",
    title: "AfroVision Challenge",
    highlight_text: "Challenge",
    description: "Compete with creators across Africa. Stream your best content, grow your audience, and win prizes that launch careers. The stage is yours.",
    cta_label: "🚀 Join the Challenge",
    cta_href: "/challenge",
    secondary_cta_label: "View Rules & Prizes",
    secondary_cta_href: "/challenge/rules",
    stats: [
      { id: "challenge-stat-1", enabled: true, sort_order: 1, label: "Prize Pool", value: "₦5M+" },
      { id: "challenge-stat-2", enabled: true, sort_order: 2, label: "Contestants", value: "200+" },
      { id: "challenge-stat-3", enabled: true, sort_order: 3, label: "Categories", value: "10" },
      { id: "challenge-stat-4", enabled: true, sort_order: 4, label: "Days Left", value: "30" },
    ],
  },
  updates: {
    key: "updates",
    enabled: true,
    sort_order: 6,
    title: "✨ Latest Updates",
    subtitle: "What's new on the platform — features, fixes, and milestones",
    cta_label: "All Updates →",
    cta_href: "/updates",
    shuffle_items: false,
    items: [
      { id: "update-1", enabled: true, sort_order: 1, title: "Premium Streams Launched", summary: "Exclusive premium content is now available. Subscribe to channels for ad-free viewing and creator-only perks.", date: "Mar 28, 2026", icon: "⭐", tag: "New Feature" },
      { id: "update-2", enabled: true, sort_order: 2, title: "Creator Subscriptions Added", summary: "Support your favorite creators with monthly subscriptions. Unlock badges, emotes, and exclusive streams.", date: "Mar 15, 2026", icon: "💎", tag: "Monetization" },
      { id: "update-3", enabled: true, sort_order: 3, title: "Real-Time Gifting Upgraded", summary: "Send animated gifts during live streams. New gift tiers and effects make every stream more exciting.", date: "Mar 02, 2026", icon: "🎁", tag: "Enhancement" },
      { id: "update-4", enabled: true, sort_order: 4, title: "VPT Wallet Integration", summary: "Earn and spend VPT tokens across the platform. Seamless wallet experience with instant transfers.", date: "Feb 18, 2026", icon: "💰", tag: "Economy" },
      { id: "update-5", enabled: true, sort_order: 5, title: "Multi-Language Support", summary: "AfroVision now supports Swahili, Yoruba, Hausa, Zulu, French, and Portuguese alongside English.", date: "Feb 05, 2026", icon: "🌐", tag: "Platform" },
      { id: "update-6", enabled: true, sort_order: 6, title: "Enhanced Stream Quality", summary: "Adaptive bitrate streaming with up to 4K quality. Lower latency for real-time interactions.", date: "Jan 20, 2026", icon: "📺", tag: "Performance" },
    ],
  },
  social_links: [
    { id: "social-twitter", platform: "twitter", label: "Twitter / X", url: "", enabled: false, sort_order: 1 },
    { id: "social-instagram", platform: "instagram", label: "Instagram", url: "", enabled: false, sort_order: 2 },
    { id: "social-youtube", platform: "youtube", label: "YouTube", url: "", enabled: false, sort_order: 3 },
    { id: "social-tiktok", platform: "tiktok", label: "TikTok", url: "", enabled: false, sort_order: 4 },
    { id: "social-facebook", platform: "facebook", label: "Facebook", url: "", enabled: false, sort_order: 5 },
    { id: "social-linkedin", platform: "linkedin", label: "LinkedIn", url: "", enabled: false, sort_order: 6 },
  ],
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortByOrder(items = []) {
  return [...items].sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0));
}

function resequence(items = []) {
  return sortByOrder(items).map((item, index) => ({
    ...item,
    sort_order: index + 1,
  }));
}

function resolveMediaUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return DIRECT_API_BASE ? `${DIRECT_API_BASE}${url}` : url;
}

function sectionTitle(key) {
  return SECTION_META[key]?.label || key;
}

function sectionItemCount(key, section) {
  const arrayKey = SECTION_META[key]?.itemKey;
  if (!arrayKey) return 0;
  return Array.isArray(section[arrayKey]) ? section[arrayKey].length : 0;
}

function channelDisplayName(channel) {
  if (!channel) return "Unknown channel";
  return channel.name || channel.owner_display_name || channel.id;
}

function channelStatus(channel) {
  if (!channel) return "Missing";
  if (channel.banner_url && channel.logo_url) return "Ready";
  if (channel.banner_url || channel.logo_url) return "Partial";
  return "Placeholder";
}

function statusTone(channel) {
  if (!channel) return "border-red-400/25 bg-red-500/10 text-red-200";
  if (channel.banner_url && channel.logo_url) return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  if (channel.banner_url || channel.logo_url) return "border-amber-400/25 bg-amber-500/10 text-amber-200";
  return "border-white/10 bg-white/6 text-white/65";
}

function ItemCard({ title, subtitle, children, actions, preview }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_18px_36px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {preview ? <div className="lg:w-56 shrink-0">{preview}</div> : null}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
              {subtitle ? <p className="mt-1 text-xs text-white/52">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${active ? TOGGLE_ON : TOGGLE_OFF}`}
    >
      {label}
    </button>
  );
}

function SmallAction({ label, onClick, tone = "default", disabled = false }) {
  const toneClass = tone === "danger"
    ? "border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/16"
    : tone === "accent"
      ? "border-[var(--av-light-orange)]/35 bg-[rgba(245,193,108,0.12)] text-white hover:brightness-105"
      : "border-white/10 bg-white/6 text-white/72 hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border px-3 py-2 text-xs font-medium transition disabled:opacity-45 ${toneClass}`}
    >
      {label}
    </button>
  );
}

export default function DesignPage() {
  const [design, setDesign] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [draft, setDraft] = useState(null);
  const [uploadingTarget, setUploadingTarget] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirm, setConfirm] = useState(null);

  const [usingLocalDefaults, setUsingLocalDefaults] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [designRes, channelsRes] = await Promise.allSettled([
        api.get("/admin/design/homepage"),
        api.get("/admin/channels"),
      ]);

      const designOk = designRes.status === "fulfilled" && designRes.value?.design;
      const channelsOk = channelsRes.status === "fulfilled" && channelsRes.value?.channels;

      if (designOk) {
        setDesign(designRes.value.design);
        setUsingLocalDefaults(false);
      } else {
        setDesign(deepClone(LOCAL_DEFAULT_DESIGN));
        setUsingLocalDefaults(true);
      }

      setChannels(channelsOk ? channelsRes.value.channels : []);
      setError(null);
    } catch (err) {
      setDesign(deepClone(LOCAL_DEFAULT_DESIGN));
      setChannels([]);
      setUsingLocalDefaults(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const orderedSections = design
    ? Object.entries(design)
        .map(([key, section]) => ({ key, section }))
        .sort((left, right) => (left.section.sort_order || 0) - (right.section.sort_order || 0))
    : [];

  const channelMap = new Map(channels.map((channel) => [channel.id, channel]));

  async function persistDesign(nextDesign, successMessage, options = {}) {
    if (usingLocalDefaults) {
      setDesign(nextDesign);
      setFeedback({ tone: "success", message: `${successMessage} (local preview only — deploy backend to persist)` });
      if (options.closeEditor) {
        setEditingKey(null);
        setDraft(null);
      }
      return nextDesign;
    }
    try {
      setSaving(true);
      const response = await api.patch("/admin/design/homepage", { design: nextDesign });
      setDesign(response.design || nextDesign);
      setFeedback({ tone: "success", message: successMessage });
      if (options.closeEditor) {
        setEditingKey(null);
        setDraft(null);
      }
      setError(null);
      return response.design || nextDesign;
    } catch (err) {
      const message = err.message || "Failed to save homepage design";
      setFeedback({ tone: "error", message });
      return null;
    } finally {
      setSaving(false);
    }
  }

  function openEditor(key) {
    if (!design?.[key]) return;
    setEditingKey(key);
    setDraft(deepClone(design[key]));
  }

  function closeEditor() {
    if (saving) return;
    setEditingKey(null);
    setDraft(null);
    setUploadingTarget(null);
  }

  function updateDraftField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateDraftArray(arrayKey, updater) {
    setDraft((current) => ({
      ...current,
      [arrayKey]: resequence(updater(sortByOrder(current[arrayKey] || []))),
    }));
  }

  function updateDraftItem(arrayKey, itemId, field, value) {
    updateDraftArray(arrayKey, (items) =>
      items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  }

  function addDraftItem(arrayKey, value) {
    updateDraftArray(arrayKey, (items) => [...items, value]);
  }

  function removeDraftItem(arrayKey, itemId) {
    updateDraftArray(arrayKey, (items) => items.filter((item) => item.id !== itemId));
  }

  function moveDraftItem(arrayKey, itemId, direction) {
    updateDraftArray(arrayKey, (items) => {
      const index = items.findIndex((item) => item.id === itemId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
      const nextItems = [...items];
      const [item] = nextItems.splice(index, 1);
      nextItems.splice(nextIndex, 0, item);
      return nextItems;
    });
  }

  function moveSection(key, direction) {
    if (!design) return;
    const sections = orderedSections.map(({ key: sectionKey }) => sectionKey);
    const index = sections.indexOf(key);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) return;

    const reordered = [...sections];
    const [item] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, item);

    const nextDesign = deepClone(design);
    reordered.forEach((sectionKey, orderIndex) => {
      nextDesign[sectionKey].sort_order = orderIndex + 1;
    });

    persistDesign(nextDesign, `Reordered ${sectionTitle(key)}.`);
  }

  function toggleSection(key) {
    if (!design?.[key]) return;
    const nextDesign = deepClone(design);
    nextDesign[key].enabled = !nextDesign[key].enabled;
    persistDesign(nextDesign, `${nextDesign[key].enabled ? "Enabled" : "Disabled"} ${sectionTitle(key)}.`);
  }

  async function handleAssetUpload(file, itemId) {
    if (!file || !editingKey) return;
    try {
      setUploadingTarget(itemId);
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.upload("/admin/design/homepage/assets", formData);
      updateDraftItem("slides", itemId, "image_url", response.image_url || null);
      setFeedback({ tone: "success", message: "Hero image uploaded." });
    } catch (err) {
      setFeedback({ tone: "error", message: err.message || "Failed to upload image" });
    } finally {
      setUploadingTarget(null);
    }
  }

  async function handleBrandingUpload(file, field) {
    if (!file) return;
    try {
      setUploadingTarget(field);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("file", file);

      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/proxy/admin/design/homepage/branding?field=${field}`);
        const token = getAdminToken();
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(new Error(data.error || `Upload failed (${xhr.status})`));
          } catch { reject(new Error("Invalid server response")); }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      if (response.image_url) {
        setDesign((prev) => {
          if (!prev) return prev;
          const next = deepClone(prev);
          next.branding = next.branding || { logo_url: null, favicon_url: null };
          next.branding[field] = response.image_url;
          return next;
        });
        setFeedback({ tone: "success", message: `${field === "logo_url" ? "Logo" : "Favicon"} uploaded successfully.` });
      }
    } catch (err) {
      setFeedback({ tone: "error", message: err.message || "Failed to upload branding asset" });
    } finally {
      setUploadingTarget(null);
      setUploadProgress(0);
    }
  }

  async function removeBrandingAsset(field) {
    if (!design) return;
    const nextDesign = deepClone(design);
    nextDesign.branding = nextDesign.branding || { logo_url: null, favicon_url: null };
    nextDesign.branding[field] = null;
    await persistDesign(nextDesign, `${field === "logo_url" ? "Logo" : "Favicon"} removed.`);
  }

  async function saveDraft() {
    if (!editingKey || !draft || !design) return;
    const nextDesign = deepClone(design);
    nextDesign[editingKey] = draft;
    const saved = await persistDesign(nextDesign, `Updated ${sectionTitle(editingKey)}.`, { closeEditor: true });
    if (saved) {
      setDraft(null);
      setEditingKey(null);
    }
  }

  function addHeroSlide() {
    addDraftItem("slides", {
      id: createId("hero"),
      enabled: true,
      sort_order: (draft?.slides?.length || 0) + 1,
      type: "promo",
      icon: "🎬",
      subtitle: "New Slide",
      title: "New hero headline",
      description: "Add the supporting hero copy for this slide.",
      cta_label: "Learn More",
      cta_href: "/",
      secondary_cta_label: "",
      secondary_cta_href: "/",
      image_url: null,
      linked_channel_id: "",
      channel_name: "",
      is_live: false,
      viewers: "",
    });
  }

  function addFeaturedItem() {
    const fallbackChannel = channels[0]?.id || "";
    addDraftItem("items", {
      id: createId("featured"),
      enabled: true,
      sort_order: (draft?.items?.length || 0) + 1,
      channel_id: fallbackChannel,
      emoji: "",
      title_override: "",
    });
  }

  function addLiveItem() {
    const fallbackChannel = channels[0]?.id || "";
    addDraftItem("items", {
      id: createId("live"),
      enabled: true,
      sort_order: (draft?.items?.length || 0) + 1,
      channel_id: fallbackChannel,
      emoji: "🎬",
      title_override: "",
    });
  }

  function addUpcomingItem() {
    addDraftItem("items", {
      id: createId("show"),
      enabled: true,
      sort_order: (draft?.items?.length || 0) + 1,
      title: "New upcoming show",
      channel: "Channel name",
      category: "Category",
      scheduled_at: new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16),
      icon: "🎬",
    });
  }

  function addChallengeStat() {
    addDraftItem("stats", {
      id: createId("challenge-stat"),
      enabled: true,
      sort_order: (draft?.stats?.length || 0) + 1,
      label: "Metric",
      value: "0",
    });
  }

  function addUpdateItem() {
    addDraftItem("items", {
      id: createId("update"),
      enabled: true,
      sort_order: (draft?.items?.length || 0) + 1,
      title: "New update",
      summary: "Summarize the platform update here.",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      icon: "✨",
      tag: "Platform",
    });
  }

  function confirmRemoval(arrayKey, itemId, label) {
    setConfirm({
      title: "Remove Item",
      message: `Remove "${label}" from ${sectionTitle(editingKey)}?`,
      destructive: true,
      confirmLabel: "Remove",
      action: async () => {
        removeDraftItem(arrayKey, itemId);
        return true;
      },
    });
  }

  function renderChannelSelect(item, arrayKey) {
    const selected = channelMap.get(item.channel_id);
    return (
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Channel</label>
        <select
          value={item.channel_id}
          onChange={(event) => updateDraftItem(arrayKey, item.id, "channel_id", event.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Select a channel</option>
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channelDisplayName(channel)}
            </option>
          ))}
        </select>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${statusTone(selected)}`}>
          <span>{channelStatus(selected)}</span>
          {selected ? <span>Banner {selected.banner_url ? "yes" : "placeholder"} · Logo {selected.logo_url ? "yes" : "placeholder"}</span> : null}
        </div>
      </div>
    );
  }

  function renderHeroEditor() {
    const slides = sortByOrder(draft?.slides || []);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Auto rotate (ms)</label>
            <input
              type="number"
              min="3000"
              step="500"
              value={draft.auto_rotate_ms || 6000}
              onChange={(event) => updateDraftField("auto_rotate_ms", event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex items-end gap-2">
            <ToggleButton active={draft.enabled} label={draft.enabled ? "Section Enabled" : "Section Disabled"} onClick={() => updateDraftField("enabled", !draft.enabled)} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Slides</h3>
            <p className="mt-1 text-xs text-white/48">Manage hero images, linked channels, badges, and CTA text.</p>
          </div>
          <SmallAction label="+ Add Slide" onClick={addHeroSlide} tone="accent" />
        </div>

        <div className="space-y-4">
          {slides.map((slide, index) => {
            const linkedChannel = channelMap.get(slide.linked_channel_id);
            const imageUrl = resolveMediaUrl(slide.image_url);
            return (
              <ItemCard
                key={slide.id}
                title={slide.title || `Slide ${index + 1}`}
                subtitle={`${slide.subtitle || "No badge text"}${linkedChannel ? ` · Linked to ${channelDisplayName(linkedChannel)}` : ""}`}
                preview={
                  <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(23,58,109,0.6),rgba(5,10,48,0.92))]">
                    <div
                      className="h-40 bg-cover bg-center"
                      style={imageUrl ? { backgroundImage: `linear-gradient(180deg,rgba(5,10,48,0.18),rgba(5,10,48,0.72)), url(${imageUrl})` } : undefined}
                    >
                      {!imageUrl ? <div className="flex h-full items-center justify-center text-5xl text-white/30">🖼</div> : null}
                    </div>
                    <div className="border-t border-white/8 px-4 py-3 text-xs text-white/52">
                      {slide.image_url ? "Custom image" : linkedChannel?.banner_url ? "Channel banner fallback" : "Placeholder background"}
                    </div>
                  </div>
                }
                actions={
                  <>
                    <ToggleButton active={slide.enabled} label={slide.enabled ? "Enabled" : "Disabled"} onClick={() => updateDraftItem("slides", slide.id, "enabled", !slide.enabled)} />
                    <SmallAction label="Up" onClick={() => moveDraftItem("slides", slide.id, -1)} disabled={index === 0} />
                    <SmallAction label="Down" onClick={() => moveDraftItem("slides", slide.id, 1)} disabled={index === slides.length - 1} />
                    <SmallAction label="Remove" tone="danger" onClick={() => confirmRemoval("slides", slide.id, slide.title || `Slide ${index + 1}`)} />
                  </>
                }
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Badge / Subtitle</label>
                    <input value={slide.subtitle || ""} onChange={(event) => updateDraftItem("slides", slide.id, "subtitle", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Icon / Emoji</label>
                    <input value={slide.icon || ""} onChange={(event) => updateDraftItem("slides", slide.id, "icon", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/72">Headline</label>
                    <input value={slide.title || ""} onChange={(event) => updateDraftItem("slides", slide.id, "title", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/72">Description</label>
                    <textarea value={slide.description || ""} onChange={(event) => updateDraftItem("slides", slide.id, "description", event.target.value)} className={TEXTAREA_CLASS} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Primary CTA Label</label>
                    <input value={slide.cta_label || ""} onChange={(event) => updateDraftItem("slides", slide.id, "cta_label", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Primary CTA Link</label>
                    <input value={slide.cta_href || ""} onChange={(event) => updateDraftItem("slides", slide.id, "cta_href", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Secondary CTA Label</label>
                    <input value={slide.secondary_cta_label || ""} onChange={(event) => updateDraftItem("slides", slide.id, "secondary_cta_label", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Secondary CTA Link</label>
                    <input value={slide.secondary_cta_href || ""} onChange={(event) => updateDraftItem("slides", slide.id, "secondary_cta_href", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div className="lg:col-span-2">{renderChannelSelect(slide, "slides")}</div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Channel label override</label>
                    <input value={slide.channel_name || ""} onChange={(event) => updateDraftItem("slides", slide.id, "channel_name", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/72">Viewers override</label>
                      <input type="number" min="0" value={slide.viewers ?? ""} onChange={(event) => updateDraftItem("slides", slide.id, "viewers", event.target.value)} className={INPUT_CLASS} />
                    </div>
                    <div className="flex items-end">
                      <ToggleButton active={Boolean(slide.is_live)} label={slide.is_live ? "Live badge on" : "Live badge off"} onClick={() => updateDraftItem("slides", slide.id, "is_live", !slide.is_live)} />
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-3">
                    <label className="block text-sm font-medium text-white/72">Hero image</label>
                    <input
                      value={slide.image_url || ""}
                      onChange={(event) => updateDraftItem("slides", slide.id, "image_url", event.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Paste a hosted image URL or upload below"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/72 transition hover:bg-white/10">
                        <span>{uploadingTarget === slide.id ? "Uploading..." : "Upload image"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleAssetUpload(file, slide.id);
                            }
                            event.target.value = "";
                          }}
                        />
                      </label>
                      {slide.image_url ? <span className="text-xs text-white/45">Saved path: {slide.image_url}</span> : null}
                    </div>
                  </div>
                </div>
              </ItemCard>
            );
          })}
        </div>
      </div>
    );
  }

  function renderFeaturedEditor() {
    const items = sortByOrder(draft?.items || []);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Section title</label>
            <input value={draft.title || ""} onChange={(event) => updateDraftField("title", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Section subtitle</label>
            <input value={draft.subtitle || ""} onChange={(event) => updateDraftField("subtitle", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">CTA label</label>
            <input value={draft.cta_label || ""} onChange={(event) => updateDraftField("cta_label", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">CTA link</label>
            <input value={draft.cta_href || ""} onChange={(event) => updateDraftField("cta_href", event.target.value)} className={INPUT_CLASS} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleButton active={draft.enabled} label={draft.enabled ? "Section Enabled" : "Section Disabled"} onClick={() => updateDraftField("enabled", !draft.enabled)} />
          <ToggleButton active={Boolean(draft.auto_slide)} label={draft.auto_slide ? "Auto slide on" : "Auto slide off"} onClick={() => updateDraftField("auto_slide", !draft.auto_slide)} />
          <ToggleButton active={Boolean(draft.shuffle_items)} label={draft.shuffle_items ? "Shuffle on" : "Shuffle off"} onClick={() => updateDraftField("shuffle_items", !draft.shuffle_items)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Channel cards</h3>
            <p className="mt-1 text-xs text-white/48">Select which channels appear and keep the card media ready with banner and logo fallbacks.</p>
          </div>
          <SmallAction label="+ Add Channel" onClick={addFeaturedItem} tone="accent" />
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const channel = channelMap.get(item.channel_id);
            const bannerUrl = resolveMediaUrl(channel?.banner_url);
            return (
              <ItemCard
                key={item.id}
                title={channelDisplayName(channel)}
                subtitle={`${channel?.category || "No category"} · ${channelStatus(channel)}`}
                preview={
                  <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(23,58,109,0.6),rgba(5,10,48,0.92))]">
                    <div className="relative h-40 bg-cover bg-center" style={bannerUrl ? { backgroundImage: `linear-gradient(180deg,rgba(5,10,48,0.18),rgba(5,10,48,0.72)), url(${bannerUrl})` } : undefined}>
                      {!bannerUrl ? <div className="flex h-full items-center justify-center text-5xl text-white/30">📺</div> : null}
                      <div className="absolute bottom-3 left-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/12 bg-[rgba(245,193,108,0.92)] text-sm font-bold text-[var(--av-dark-blue)] shadow-lg">
                        {channel?.logo_url ? <img src={resolveMediaUrl(channel.logo_url)} alt={channelDisplayName(channel)} className="h-full w-full object-cover" /> : channelDisplayName(channel).split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                }
                actions={
                  <>
                    <ToggleButton active={item.enabled} label={item.enabled ? "Enabled" : "Disabled"} onClick={() => updateDraftItem("items", item.id, "enabled", !item.enabled)} />
                    <SmallAction label="Up" onClick={() => moveDraftItem("items", item.id, -1)} disabled={index === 0} />
                    <SmallAction label="Down" onClick={() => moveDraftItem("items", item.id, 1)} disabled={index === items.length - 1} />
                    <SmallAction label="Remove" tone="danger" onClick={() => confirmRemoval("items", item.id, channelDisplayName(channel))} />
                  </>
                }
              >
                {renderChannelSelect(item, "items")}
              </ItemCard>
            );
          })}
        </div>
      </div>
    );
  }

  function renderLiveEditor() {
    const items = sortByOrder(draft?.items || []);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Badge text</label>
            <input value={draft.badge_text || ""} onChange={(event) => updateDraftField("badge_text", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Section title</label>
            <input value={draft.title || ""} onChange={(event) => updateDraftField("title", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-white/72">Section subtitle</label>
            <input value={draft.subtitle || ""} onChange={(event) => updateDraftField("subtitle", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">CTA label</label>
            <input value={draft.cta_label || ""} onChange={(event) => updateDraftField("cta_label", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">CTA link</label>
            <input value={draft.cta_href || ""} onChange={(event) => updateDraftField("cta_href", event.target.value)} className={INPUT_CLASS} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleButton active={draft.enabled} label={draft.enabled ? "Section Enabled" : "Section Disabled"} onClick={() => updateDraftField("enabled", !draft.enabled)} />
          <ToggleButton active={Boolean(draft.auto_slide)} label={draft.auto_slide ? "Auto slide on" : "Auto slide off"} onClick={() => updateDraftField("auto_slide", !draft.auto_slide)} />
          <ToggleButton active={Boolean(draft.shuffle_items)} label={draft.shuffle_items ? "Shuffle on" : "Shuffle off"} onClick={() => updateDraftField("shuffle_items", !draft.shuffle_items)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Live cards</h3>
            <p className="mt-1 text-xs text-white/48">Pick channels, preserve the existing emoji layer, and let the website pull live thumbnails from channel or current stream media.</p>
          </div>
          <SmallAction label="+ Add Live Card" onClick={addLiveItem} tone="accent" />
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const channel = channelMap.get(item.channel_id);
            const bannerUrl = resolveMediaUrl(channel?.banner_url);
            return (
              <ItemCard
                key={item.id}
                title={item.title_override || channelDisplayName(channel)}
                subtitle={`${channel?.category || "No category"} · Emoji ${item.emoji || "🎬"}`}
                preview={
                  <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(23,58,109,0.6),rgba(5,10,48,0.92))]">
                    <div className="flex h-40 items-center justify-center bg-cover bg-center text-5xl" style={bannerUrl ? { backgroundImage: `linear-gradient(180deg,rgba(5,10,48,0.22),rgba(5,10,48,0.72)), url(${bannerUrl})` } : undefined}>
                      <span className="drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]">{item.emoji || "🎬"}</span>
                    </div>
                  </div>
                }
                actions={
                  <>
                    <ToggleButton active={item.enabled} label={item.enabled ? "Enabled" : "Disabled"} onClick={() => updateDraftItem("items", item.id, "enabled", !item.enabled)} />
                    <SmallAction label="Up" onClick={() => moveDraftItem("items", item.id, -1)} disabled={index === 0} />
                    <SmallAction label="Down" onClick={() => moveDraftItem("items", item.id, 1)} disabled={index === items.length - 1} />
                    <SmallAction label="Remove" tone="danger" onClick={() => confirmRemoval("items", item.id, item.title_override || channelDisplayName(channel))} />
                  </>
                }
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="lg:col-span-2">{renderChannelSelect(item, "items")}</div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Emoji overlay</label>
                    <input value={item.emoji || ""} onChange={(event) => updateDraftItem("items", item.id, "emoji", event.target.value)} className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/72">Title override</label>
                    <input value={item.title_override || ""} onChange={(event) => updateDraftItem("items", item.id, "title_override", event.target.value)} className={INPUT_CLASS} placeholder="Leave blank to use current stream title" />
                  </div>
                </div>
              </ItemCard>
            );
          })}
        </div>
      </div>
    );
  }

  function renderUpcomingEditor() {
    const items = sortByOrder(draft?.items || []);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Section title</label>
            <input value={draft.title || ""} onChange={(event) => updateDraftField("title", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Section subtitle</label>
            <input value={draft.subtitle || ""} onChange={(event) => updateDraftField("subtitle", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">CTA label</label>
            <input value={draft.cta_label || ""} onChange={(event) => updateDraftField("cta_label", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">CTA link</label>
            <input value={draft.cta_href || ""} onChange={(event) => updateDraftField("cta_href", event.target.value)} className={INPUT_CLASS} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ToggleButton active={draft.enabled} label={draft.enabled ? "Section Enabled" : "Section Disabled"} onClick={() => updateDraftField("enabled", !draft.enabled)} />
          <ToggleButton active={Boolean(draft.shuffle_items)} label={draft.shuffle_items ? "Shuffle on" : "Shuffle off"} onClick={() => updateDraftField("shuffle_items", !draft.shuffle_items)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Upcoming show cards</h3>
            <p className="mt-1 text-xs text-white/48">Maintain the existing countdown card layout while managing icon, timing, category, and channel copy.</p>
          </div>
          <SmallAction label="+ Add Show" onClick={addUpcomingItem} tone="accent" />
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <ItemCard
              key={item.id}
              title={item.title || `Show ${index + 1}`}
              subtitle={`${item.channel || "Unknown channel"} · ${item.category || "No category"}`}
              preview={
                <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(10,16,64,0.92)] p-5">
                  <div className="mb-4 text-3xl">{item.icon || "🎬"}</div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/52">{item.channel}</p>
                    <p className="text-[11px] text-white/40">{item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : "No time set"}</p>
                  </div>
                </div>
              }
              actions={
                <>
                  <ToggleButton active={item.enabled} label={item.enabled ? "Enabled" : "Disabled"} onClick={() => updateDraftItem("items", item.id, "enabled", !item.enabled)} />
                  <SmallAction label="Up" onClick={() => moveDraftItem("items", item.id, -1)} disabled={index === 0} />
                  <SmallAction label="Down" onClick={() => moveDraftItem("items", item.id, 1)} disabled={index === items.length - 1} />
                  <SmallAction label="Remove" tone="danger" onClick={() => confirmRemoval("items", item.id, item.title || `Show ${index + 1}`)} />
                </>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Title</label>
                  <input value={item.title || ""} onChange={(event) => updateDraftItem("items", item.id, "title", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Emoji / Icon</label>
                  <input value={item.icon || ""} onChange={(event) => updateDraftItem("items", item.id, "icon", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Channel</label>
                  <input value={item.channel || ""} onChange={(event) => updateDraftItem("items", item.id, "channel", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Category</label>
                  <input value={item.category || ""} onChange={(event) => updateDraftItem("items", item.id, "category", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-white/72">Scheduled time</label>
                  <input type="datetime-local" value={(item.scheduled_at || "").slice(0, 16)} onChange={(event) => updateDraftItem("items", item.id, "scheduled_at", event.target.value)} className={INPUT_CLASS} />
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      </div>
    );
  }

  function renderChallengeEditor() {
    const stats = sortByOrder(draft?.stats || []);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Badge icon</label>
            <input value={draft.badge_icon || ""} onChange={(event) => updateDraftField("badge_icon", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Badge text</label>
            <input value={draft.badge_text || ""} onChange={(event) => updateDraftField("badge_text", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Title</label>
            <input value={draft.title || ""} onChange={(event) => updateDraftField("title", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Highlighted text</label>
            <input value={draft.highlight_text || ""} onChange={(event) => updateDraftField("highlight_text", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-white/72">Description</label>
            <textarea value={draft.description || ""} onChange={(event) => updateDraftField("description", event.target.value)} className={TEXTAREA_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Primary CTA label</label>
            <input value={draft.cta_label || ""} onChange={(event) => updateDraftField("cta_label", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Primary CTA link</label>
            <input value={draft.cta_href || ""} onChange={(event) => updateDraftField("cta_href", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Secondary CTA label</label>
            <input value={draft.secondary_cta_label || ""} onChange={(event) => updateDraftField("secondary_cta_label", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Secondary CTA link</label>
            <input value={draft.secondary_cta_href || ""} onChange={(event) => updateDraftField("secondary_cta_href", event.target.value)} className={INPUT_CLASS} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ToggleButton active={draft.enabled} label={draft.enabled ? "Section Enabled" : "Section Disabled"} onClick={() => updateDraftField("enabled", !draft.enabled)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Challenge stats</h3>
            <p className="mt-1 text-xs text-white/48">Edit the current metrics without changing the front-end layout.</p>
          </div>
          <SmallAction label="+ Add Stat" onClick={addChallengeStat} tone="accent" />
        </div>

        <div className="space-y-4">
          {stats.map((item, index) => (
            <ItemCard
              key={item.id}
              title={item.label || `Stat ${index + 1}`}
              subtitle={item.value || "No value"}
              preview={
                <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(10,16,64,0.92)] p-5 text-center">
                  <p className="text-3xl font-extrabold text-[var(--av-orange)]">{item.value || "0"}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white/45">{item.label || "Metric"}</p>
                </div>
              }
              actions={
                <>
                  <ToggleButton active={item.enabled} label={item.enabled ? "Enabled" : "Disabled"} onClick={() => updateDraftItem("stats", item.id, "enabled", !item.enabled)} />
                  <SmallAction label="Up" onClick={() => moveDraftItem("stats", item.id, -1)} disabled={index === 0} />
                  <SmallAction label="Down" onClick={() => moveDraftItem("stats", item.id, 1)} disabled={index === stats.length - 1} />
                  <SmallAction label="Remove" tone="danger" onClick={() => confirmRemoval("stats", item.id, item.label || `Stat ${index + 1}`)} />
                </>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Label</label>
                  <input value={item.label || ""} onChange={(event) => updateDraftItem("stats", item.id, "label", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Value</label>
                  <input value={item.value || ""} onChange={(event) => updateDraftItem("stats", item.id, "value", event.target.value)} className={INPUT_CLASS} />
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      </div>
    );
  }

  function renderUpdatesEditor() {
    const items = sortByOrder(draft?.items || []);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Section title</label>
            <input value={draft.title || ""} onChange={(event) => updateDraftField("title", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">Section subtitle</label>
            <input value={draft.subtitle || ""} onChange={(event) => updateDraftField("subtitle", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">CTA label</label>
            <input value={draft.cta_label || ""} onChange={(event) => updateDraftField("cta_label", event.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/72">CTA link</label>
            <input value={draft.cta_href || ""} onChange={(event) => updateDraftField("cta_href", event.target.value)} className={INPUT_CLASS} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ToggleButton active={draft.enabled} label={draft.enabled ? "Section Enabled" : "Section Disabled"} onClick={() => updateDraftField("enabled", !draft.enabled)} />
          <ToggleButton active={Boolean(draft.shuffle_items)} label={draft.shuffle_items ? "Shuffle on" : "Shuffle off"} onClick={() => updateDraftField("shuffle_items", !draft.shuffle_items)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Update cards</h3>
            <p className="mt-1 text-xs text-white/48">Edit every card headline, summary, icon, tag, and date while keeping the live website layout unchanged.</p>
          </div>
          <SmallAction label="+ Add Update" onClick={addUpdateItem} tone="accent" />
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <ItemCard
              key={item.id}
              title={item.title || `Update ${index + 1}`}
              subtitle={`${item.tag || "No tag"} · ${item.date || "No date"}`}
              preview={
                <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(10,16,64,0.92)] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-3xl">{item.icon || "✨"}</span>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">{item.tag || "Tag"}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-xs leading-6 text-white/52">{item.summary}</p>
                </div>
              }
              actions={
                <>
                  <ToggleButton active={item.enabled} label={item.enabled ? "Enabled" : "Disabled"} onClick={() => updateDraftItem("items", item.id, "enabled", !item.enabled)} />
                  <SmallAction label="Up" onClick={() => moveDraftItem("items", item.id, -1)} disabled={index === 0} />
                  <SmallAction label="Down" onClick={() => moveDraftItem("items", item.id, 1)} disabled={index === items.length - 1} />
                  <SmallAction label="Remove" tone="danger" onClick={() => confirmRemoval("items", item.id, item.title || `Update ${index + 1}`)} />
                </>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Title</label>
                  <input value={item.title || ""} onChange={(event) => updateDraftItem("items", item.id, "title", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Tag</label>
                  <input value={item.tag || ""} onChange={(event) => updateDraftItem("items", item.id, "tag", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Date label</label>
                  <input value={item.date || ""} onChange={(event) => updateDraftItem("items", item.id, "date", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Emoji / Icon</label>
                  <input value={item.icon || ""} onChange={(event) => updateDraftItem("items", item.id, "icon", event.target.value)} className={INPUT_CLASS} />
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-white/72">Summary</label>
                  <textarea value={item.summary || ""} onChange={(event) => updateDraftItem("items", item.id, "summary", event.target.value)} className={TEXTAREA_CLASS} />
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      </div>
    );
  }

  const PLATFORM_OPTIONS = [
    { value: "twitter", label: "Twitter / X" },
    { value: "instagram", label: "Instagram" },
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
    { value: "facebook", label: "Facebook" },
    { value: "linkedin", label: "LinkedIn" },
  ];

  const PLATFORM_ICONS = {
    twitter: "𝕏",
    instagram: "📷",
    youtube: "▶",
    tiktok: "♪",
    facebook: "f",
    linkedin: "in",
  };

  function addSocialLink() {
    const current = Array.isArray(draft) ? draft : [];
    const newLink = {
      id: createId("social"),
      platform: "twitter",
      label: "New Link",
      url: "",
      enabled: false,
      sort_order: current.length + 1,
    };
    setDraft(resequence([...current, newLink]));
  }

  function updateSocialItem(itemId, field, value) {
    setDraft((current) => {
      const items = Array.isArray(current) ? current : [];
      return resequence(items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
    });
  }

  function removeSocialItem(itemId) {
    setDraft((current) => {
      const items = Array.isArray(current) ? current : [];
      return resequence(items.filter((item) => item.id !== itemId));
    });
  }

  function moveSocialItem(itemId, direction) {
    setDraft((current) => {
      const items = Array.isArray(current) ? [...(current || [])] : [];
      const sorted = sortByOrder(items);
      const index = sorted.findIndex((item) => item.id === itemId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) return current;
      const [item] = sorted.splice(index, 1);
      sorted.splice(nextIndex, 0, item);
      return resequence(sorted);
    });
  }

  function renderSocialLinksEditor() {
    const items = sortByOrder(Array.isArray(draft) ? draft : []);
    return (
      <div className="space-y-6">
        <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/66">
          <p>Manage the social media links shown in the website footer. Toggle each link on or off — disabled links are hidden from visitors. Enter the full URL for each platform.</p>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{items.length} Social Link{items.length !== 1 ? "s" : ""}</h3>
          <SmallAction label="+ Add Link" onClick={addSocialLink} tone="accent" />
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <ItemCard
              key={item.id}
              title={
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-xs font-bold text-white/80">
                    {PLATFORM_ICONS[item.platform] || "?"}
                  </span>
                  {item.label || item.platform}
                </span>
              }
              subtitle={item.url ? item.url : "No URL set"}
              actions={
                <>
                  <ToggleButton active={item.enabled} label={item.enabled ? "Visible" : "Hidden"} onClick={() => updateSocialItem(item.id, "enabled", !item.enabled)} />
                  <SmallAction label="Up" onClick={() => moveSocialItem(item.id, -1)} disabled={index === 0} />
                  <SmallAction label="Down" onClick={() => moveSocialItem(item.id, 1)} disabled={index === items.length - 1} />
                  <SmallAction label="Remove" tone="danger" onClick={() => {
                    setConfirm({
                      title: "Remove Item",
                      message: `Remove "${item.label}" from Social Links?`,
                      destructive: true,
                      confirmLabel: "Remove",
                      action: async () => { removeSocialItem(item.id); return true; },
                    });
                  }} />
                </>
              }
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Platform</label>
                  <select
                    value={item.platform}
                    onChange={(event) => {
                      const selected = PLATFORM_OPTIONS.find((o) => o.value === event.target.value);
                      updateSocialItem(item.id, "platform", event.target.value);
                      if (selected) updateSocialItem(item.id, "label", selected.label);
                    }}
                    className={INPUT_CLASS}
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Display Label</label>
                  <input value={item.label || ""} onChange={(event) => updateSocialItem(item.id, "label", event.target.value)} className={INPUT_CLASS} placeholder="Twitter / X" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">URL</label>
                  <input value={item.url || ""} onChange={(event) => updateSocialItem(item.id, "url", event.target.value)} className={INPUT_CLASS} placeholder="https://twitter.com/AfroVisionTV" />
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      </div>
    );
  }

  function renderDrawerContent() {
    if (!editingKey || !draft) return null;
    if (editingKey === "hero") return renderHeroEditor();
    if (editingKey === "featured_channels") return renderFeaturedEditor();
    if (editingKey === "live_now") return renderLiveEditor();
    if (editingKey === "upcoming_shows") return renderUpcomingEditor();
    if (editingKey === "challenge") return renderChallengeEditor();
    if (editingKey === "updates") return renderUpdatesEditor();
    if (editingKey === "social_links") return renderSocialLinksEditor();
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Website Design</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/58">
            Manage the homepage hero, live channel rows, challenge block, upcoming shows, and updates from one source of truth. The website keeps the current visual structure while every section, item, text, image, order, and enable state becomes admin-controlled.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {orderedSections.length} sections
          </span>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {channels.length} channels available
          </span>
        </div>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

      {usingLocalDefaults && !loading ? (
        <div className="rounded-[1.5rem] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Showing local default design data. The backend design endpoint is not reachable yet — deploy the updated backend to enable persistence. Edits work as a local preview until then.
        </div>
      ) : null}

      {error && !loading ? (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadData} className="ml-3 underline">Retry</button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      ) : null}

      {!loading && design ? (
        <>
        {/* Branding — Logo & Favicon */}
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-lg">🎨</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Branding</h2>
              <p className="mt-1 text-xs text-white/48">Logo and favicon used across the admin panel and public website.</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Logo */}
            <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Logo</h3>
                  <p className="mt-1 text-xs text-white/48">Replaces the placeholder &quot;A&quot; icon in navbar and footer.</p>
                </div>
                {design.branding?.logo_url ? (
                  <SmallAction label="Remove" tone="danger" onClick={() => removeBrandingAsset("logo_url")} disabled={saving} />
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-20 h-20 rounded-2xl border border-white/10 bg-white/6 flex items-center justify-center overflow-hidden">
                  {design.branding?.logo_url ? (
                    <img src={resolveMediaUrl(design.branding.logo_url)} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl text-white/30">🖼</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/72 transition hover:bg-white/10">
                    <span>{uploadingTarget === "logo_url" ? "Uploading..." : "Upload logo"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingTarget === "logo_url"}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleBrandingUpload(file, "logo_url");
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-white/38">PNG, JPG, or WebP. Square recommended.</p>
                  {uploadingTarget === "logo_url" && uploadProgress > 0 ? (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--av-light-orange)] transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-[11px] font-medium text-[var(--av-light-orange)]">{uploadProgress}%</p>
                    </div>
                  ) : null}
                  {design.branding?.logo_url ? <p className="text-[11px] text-white/45 break-all">{design.branding.logo_url}</p> : null}
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Favicon</h3>
                  <p className="mt-1 text-xs text-white/48">Browser tab icon for admin and website.</p>
                </div>
                {design.branding?.favicon_url ? (
                  <SmallAction label="Remove" tone="danger" onClick={() => removeBrandingAsset("favicon_url")} disabled={saving} />
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-16 h-16 rounded-xl border border-white/10 bg-white/6 flex items-center justify-center overflow-hidden">
                  {design.branding?.favicon_url ? (
                    <img src={resolveMediaUrl(design.branding.favicon_url)} alt="Favicon" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-xl text-white/30">🌐</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/72 transition hover:bg-white/10">
                    <span>{uploadingTarget === "favicon_url" ? "Uploading..." : "Upload favicon"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingTarget === "favicon_url"}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleBrandingUpload(file, "favicon_url");
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-white/38">PNG or ICO. 32×32 or 64×64 recommended.</p>
                  {uploadingTarget === "favicon_url" && uploadProgress > 0 ? (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--av-light-orange)] transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-[11px] font-medium text-[var(--av-light-orange)]">{uploadProgress}%</p>
                    </div>
                  ) : null}
                  {design.branding?.favicon_url ? <p className="text-[11px] text-white/45 break-all">{design.branding.favicon_url}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {orderedSections.map(({ key, section }, index) => (
            <div key={key} className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-sm font-semibold text-white/82">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-white">{sectionTitle(key)}</h2>
                      <p className="mt-1 text-xs text-white/48">
                        {sectionItemCount(key, section)} managed item{sectionItemCount(key, section) === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${section.enabled ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/6 text-white/60"}`}>
                      {section.enabled ? "Enabled" : "Disabled"}
                    </span>
                    {typeof section.auto_slide === "boolean" ? (
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${section.auto_slide ? "border-[var(--av-light-orange)]/30 bg-[rgba(245,193,108,0.12)] text-white" : "border-white/10 bg-white/6 text-white/60"}`}>
                        {section.auto_slide ? "Auto slide" : "Manual slide"}
                      </span>
                    ) : null}
                    {typeof section.shuffle_items === "boolean" ? (
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${section.shuffle_items ? "border-sky-400/25 bg-sky-500/10 text-sky-200" : "border-white/10 bg-white/6 text-white/60"}`}>
                        {section.shuffle_items ? "Shuffle on" : "Shuffle off"}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <SmallAction label="Up" onClick={() => moveSection(key, -1)} disabled={index === 0 || saving} />
                  <SmallAction label="Down" onClick={() => moveSection(key, 1)} disabled={index === orderedSections.length - 1 || saving} />
                  <SmallAction label={section.enabled ? "Disable" : "Enable"} onClick={() => toggleSection(key)} disabled={saving} />
                  <SmallAction label="Edit" onClick={() => openEditor(key)} tone="accent" disabled={saving} />
                </div>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/66">
                {key === "hero" ? (
                  <p>{section.slides?.length || 0} hero slides with image, CTA, and live badge controls.</p>
                ) : key === "featured_channels" ? (
                  <p>{section.items?.length || 0} selected channels. Cards automatically pull channel banner and logo, with placeholders when media is missing.</p>
                ) : key === "live_now" ? (
                  <p>{section.items?.length || 0} live cards. Cards preserve the existing emoji layer while using channel or stream imagery in the background.</p>
                ) : key === "upcoming_shows" ? (
                  <p>{section.items?.length || 0} upcoming events with icon, title, timing, category, and reminder copy.</p>
                ) : key === "challenge" ? (
                  <p>{section.stats?.length || 0} challenge metrics plus badge, headline, CTA, and descriptive copy.</p>
                ) : (
                  <p>{section.items?.length || 0} update cards with editable icon, tag, title, summary, and date labels.</p>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      ) : null}

      {/* Social Links Card */}
      {design?.social_links ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-lg">
                  🔗
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-white">Social Links</h2>
                  <p className="mt-1 text-xs text-white/48">
                    Footer social media links — {(design.social_links.filter((l) => l.enabled) || []).length} active, {(design.social_links.filter((l) => !l.enabled) || []).length} hidden
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {sortByOrder(design.social_links).map((link) => (
                  <span
                    key={link.id}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${link.enabled ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/6 text-white/60"}`}
                  >
                    {link.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SmallAction label="Edit" onClick={() => openEditor("social_links")} tone="accent" disabled={saving} />
            </div>
          </div>
          <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/66">
            <p>Manage which social media icons appear in the website footer. Enable a link and set the URL — disabled links are automatically hidden from visitors.</p>
          </div>
        </div>
      ) : null}

      <Drawer
        open={Boolean(editingKey && draft)}
        onClose={closeEditor}
        title={editingKey ? `Edit ${sectionTitle(editingKey)}` : "Edit Section"}
        width="max-w-5xl"
      >
        {draft ? (
          <div className="space-y-6">
            {renderDrawerContent()}
            <div className="sticky bottom-0 border-t border-white/8 bg-[var(--admin-surface-strong)] pt-5">
              <div className="flex flex-wrap justify-end gap-3">
                <button onClick={closeEditor} disabled={saving} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={saveDraft} disabled={saving} className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Section"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm?.action) {
            setConfirm(null);
            return;
          }
          const shouldClose = await confirm.action();
          if (shouldClose !== false) {
            setConfirm(null);
          }
        }}
      />
    </div>
  );
}