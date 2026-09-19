"use client";

import StatusBadge from "@/components/ui/StatusBadge";

function formatNgn(amount) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString("en-NG")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OverviewTab({ overview }) {
  const { stats, financials, settings } = overview;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Distributors"
          value={stats.distributor_count}
          sub={`${stats.active_distributors} active`}
          icon="distributor"
        />
        <StatCard
          label="Total Marketers"
          value={stats.marketer_count}
          icon="marketer"
        />
        <StatCard
          label="TV Devices"
          value={stats.device_count}
          sub={`${stats.active_devices} active`}
          icon="device"
        />
        <StatCard
          label="Disabled TVs"
          value={stats.disabled_devices}
          sub="Kill switch"
          icon="kill"
          tone={stats.disabled_devices > 0 ? "red" : "neutral"}
        />
      </div>

      {/* Financials */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/50">Financial Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FinancialField label="Total Revenue" value={formatNgn(financials.total_revenue_ngn)} />
          <FinancialField label="AfroVision Share" value={formatNgn(financials.afrovision_share_ngn)} />
          <FinancialField label="Distributor Share" value={formatNgn(financials.distributor_share_ngn)} />
          <FinancialField label="Payments Received" value={formatNgn(financials.payments_received_ngn)} />
          <FinancialField
            label="Remittance Due"
            value={formatNgn(financials.remittance_due_ngn)}
            highlight={financials.remittance_due_ngn > 0}
          />
          <FinancialField label="Total Activations" value={financials.activations} />
        </div>
      </div>

      {/* Settings Snapshot */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/50">Global Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FinancialField label="Activation Price" value={formatNgn(settings.activation_price_ngn)} />
          <FinancialField label="License Fee" value={formatNgn(settings.license_fee_ngn)} />
          <FinancialField label="License Duration" value={`${settings.license_duration_days} days`} />
          <FinancialField label="Default Split (AfroVision)" value={`${settings.default_split_percent_afrovision}%`} />
          <FinancialField label="Config Version" value={settings.config_version} />
          <FinancialField label="QR Whitelist Users" value={(settings.qr_whitelist_user_ids || []).length} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs text-white/45">TV App Version:</span>
          <StatusBadge status="active" />
          <span className="text-sm text-white/70">
            {settings.tv_app?.latest_version_name || "1.0.0"} (code: {settings.tv_app?.latest_version_code || 1})
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, tone = "neutral" }) {
  const toneClass = tone === "red"
    ? "border-red-400/30 bg-red-500/8"
    : "border-white/10 bg-white/4";

  return (
    <div className={`rounded-[1.5rem] border ${toneClass} p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl`}>
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone === "red" ? "text-red-200" : "text-white"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
    </div>
  );
}

function FinancialField({ label, value, highlight }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
      <label className="mb-1 block text-xs text-white/45">{label}</label>
      <p className={`text-sm font-semibold ${highlight ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
