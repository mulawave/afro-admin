"use client";

import StatusBadge from "@/components/ui/StatusBadge";

export default function OverviewTab({ detail, role, setRole, kycStatus, setKycStatus, isPremium, setIsPremium }) {
  const u = detail || {};

  const fullName = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ") || u.name || u.email || "—";
  const location = [u.city, u.state, u.country].filter(Boolean).join(", ") || "—";

  return (
    <div className="space-y-5">
      {/* Avatar + Profile Summary */}
      <div className="flex items-start gap-4">
        {(u.profilePicture || u.avatar_url) ? (
          <img
            src={u.profilePicture || u.avatar_url}
            alt={fullName}
            className="h-16 w-16 rounded-2xl border border-white/10 object-cover shrink-0"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] text-lg font-bold text-[var(--av-dark-blue)] shrink-0">
            {(fullName?.[0] || "?").toUpperCase()}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 flex-1">
          <MetaItem label="Full Name" value={fullName} />
          <MetaItem label="Email" value={u.email || "—"} />
          <MetaItem label="Mobile" value={u.mobile || u.phoneNumber || "—"} />
          <MetaItem label="Location" value={location} />
          <MetaItem label="Address" value={u.address || "—"} span2 />
          <MetaItem
            label="Phone Number"
            value={u.phoneNumber || "—"}
          />
          <MetaItem
            label="Referral Source"
            value={
              u.referralSource === "Other, please specify" && u.referralSourceDetail
                ? u.referralSourceDetail
                : u.referralSource || "—"
            }
            span2
          />
          <MetaItem
            label="Profile Setup"
            value={
              <span className={`inline-flex items-center gap-1.5 ${u.profile_setup_complete ? "text-emerald-300" : "text-amber-300"}`}>
                <span className={`inline-block h-2 w-2 rounded-full ${u.profile_setup_complete ? "bg-emerald-400" : "bg-amber-400"}`} />
                {u.profile_setup_complete ? "Complete" : "Incomplete"}
              </span>
            }
          />
        </div>
      </div>

      {/* Identity & Account */}
      <Section title="Identity">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <MetaItem label="VPin ID" value={u.vpinId || "—"} />
          <MetaItem label="Ref Code" value={u.refCode || "—"} />
          <MetaItem label="Sponsor UID" value={u.sponsoruid ? truncateUid(u.sponsoruid) : "—"} />
          <MetaItem label="Canonical UID" value={u.canonical_uid ? truncateUid(u.canonical_uid) : "—"} />
          <MetaItem label="Currency" value={u.currency || u.preferred_currency || "—"} />
          <MetaItem label="Verified" value={u.isVerified ? "Yes" : "No"} />
        </div>
      </Section>

      {/* Subscription */}
      <Section title="Subscription">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetaItem label="Plan" value={u.subscription_plan || "none"} />
          <MetaItem label="Status" value={u.subscription_status || "inactive"} />
          <MetaItem label="Expiry" value={u.subscription_expiry ? new Date(u.subscription_expiry).toLocaleDateString() : "—"} />
          <MetaItem label="First Subscribed" value={u.first_subscription_at ? new Date(u.first_subscription_at).toLocaleDateString() : "—"} />
        </div>
      </Section>

      {/* Bank Details */}
      {u.bank && typeof u.bank === "object" && (
        <Section title="Bank Details">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <MetaItem label="Bank" value={u.bank.name || "—"} />
            <MetaItem label="Account Name" value={u.bank.accountName || "—"} />
            <MetaItem label="Account Number" value={u.bank.accountNumber || "—"} />
          </div>
        </Section>
      )}

      {/* Access Controls */}
      <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/78">Access Controls</h3>
            <p className="mt-1 text-xs text-white/45">Update admin-managed user attributes.</p>
          </div>
          <StatusBadge status={isPremium ? "active" : "inactive"} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Role" value={role} onChange={setRole} options={["viewer", "creator", "admin"]} />
          <SelectField label="KYC" value={kycStatus} onChange={setKycStatus} options={["none", "pending", "verified", "rejected", "minor_pending"]} />
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/42">Premium Creator</label>
            <button
              onClick={() => setIsPremium((prev) => !prev)}
              className={`inline-flex rounded-full border px-3 py-2 text-sm font-medium ${
                isPremium
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/6 text-white/68"
              }`}
            >
              {isPremium ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <Section title="Dates">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetaItem label="Created" value={formatDate(u.created_at || u.createdAt)} />
          <MetaItem label="Updated" value={formatDate(u.updatedAt)} />
          <MetaItem label="Last Seen" value={formatDate(u.lastSeen)} />
          <MetaItem
            label="Online"
            value={
              <span className={`inline-flex items-center gap-1.5 ${u.online ? "text-emerald-300" : "text-white/55"}`}>
                <span className={`inline-block h-2 w-2 rounded-full ${u.online ? "bg-emerald-400" : "bg-white/30"}`} />
                {u.online ? "Online" : "Offline"}
              </span>
            }
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/78">{title}</h3>
      {children}
    </div>
  );
}

function MetaItem({ label, value, span2 }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">{label}</p>
      <p className="mt-1 break-all text-sm text-white/80">{typeof value === "string" ? value : value}</p>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/42">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function truncateUid(uid) {
  if (!uid || uid.length <= 16) return uid || "—";
  return uid.slice(0, 8) + "..." + uid.slice(-8);
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}
