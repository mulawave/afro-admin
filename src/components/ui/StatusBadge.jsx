export default function StatusBadge({ status }) {
  const styles = {
    active: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    enabled: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    success: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    approved: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    distributed: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    suspended: "border border-red-400/30 bg-red-500/10 text-red-200",
    disabled: "border border-red-400/30 bg-red-500/10 text-red-200",
    rejected: "border border-red-400/30 bg-red-500/10 text-red-200",
    failed: "border border-red-400/30 bg-red-500/10 text-red-200",
    pending: "border border-amber-400/30 bg-amber-500/10 text-amber-200",
    processing: "border border-amber-400/30 bg-amber-500/10 text-amber-200",
    swapped: "border border-amber-400/30 bg-amber-500/10 text-amber-200",
    inactive: "border border-white/10 bg-white/5 text-white/55",
    deleted: "border border-white/10 bg-white/5 text-white/55",
    cancelled: "border border-white/10 bg-white/5 text-white/55",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        styles[status] || "border border-white/10 bg-white/5 text-white/70"
      }`}
    >
      {status}
    </span>
  );
}
