"use client";

import WalletCard from "@/components/users/WalletCard";
import LedgerTable from "@/components/users/LedgerTable";

export default function EconomyTab({ detail, wallet, walletLoading, ledger, user, onWalletUpdate }) {
  const u = detail || {};

  return (
    <div className="space-y-5">
      {/* Economy Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Cash" value={fmt(u.cash)} color="emerald" prefix="₦" />
        <StatCard label="Coins" value={fmt(u.coins)} color="amber" />
        <StatCard label="VPT" value={fmt(u.vpt)} color="indigo" />
        <StatCard label="Slots" value={fmt(u.slots)} color="sky" />
        <StatCard label="Points" value={fmt(u.points)} color="violet" />
        <StatCard label="Equity %" value={fmt(u.equity_percentage)} color="rose" suffix="%" />
        <StatCard label="Blockchain Tokens" value={fmt(u.blockchain_tokens)} color="orange" />
        <StatCard label="Profit" value={fmt(u.profit)} color="teal" />
        <StatCard label="Stake Wallet" value={fmt(u.stake_wallet)} color="cyan" />
        <StatCard label="VPT Balance" value={fmt(u.vpt_balance)} color="purple" />
        <StatCard label="Badge Live Wire" value={fmt(u.badge_live_wire)} color="pink" />
        <StatCard label="Level" value={u.level ?? "—"} color="lime" />
      </div>

      {/* Wallet */}
      {walletLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--av-light-orange)] border-t-transparent" />
        </div>
      )}
      {!walletLoading && wallet && (
        <WalletCard wallet={wallet} user={user} onUpdate={onWalletUpdate} />
      )}

      {/* Ledger */}
      {!walletLoading && <LedgerTable data={ledger} />}
    </div>
  );
}

const COLOR_MAP = {
  emerald: "border-emerald-400/20 bg-emerald-500/8 text-emerald-200",
  amber: "border-amber-400/20 bg-amber-500/8 text-amber-200",
  indigo: "border-indigo-400/20 bg-indigo-500/8 text-indigo-200",
  sky: "border-sky-400/20 bg-sky-500/8 text-sky-200",
  violet: "border-violet-400/20 bg-violet-500/8 text-violet-200",
  rose: "border-rose-400/20 bg-rose-500/8 text-rose-200",
  orange: "border-orange-400/20 bg-orange-500/8 text-orange-200",
  teal: "border-teal-400/20 bg-teal-500/8 text-teal-200",
  cyan: "border-cyan-400/20 bg-cyan-500/8 text-cyan-200",
  purple: "border-purple-400/20 bg-purple-500/8 text-purple-200",
  pink: "border-pink-400/20 bg-pink-500/8 text-pink-200",
  lime: "border-lime-400/20 bg-lime-500/8 text-lime-200",
};

function StatCard({ label, value, color = "emerald", prefix, suffix }) {
  const display = `${prefix || ""}${value}${suffix || ""}`;
  return (
    <div className={`rounded-2xl border p-3 ${COLOR_MAP[color] || COLOR_MAP.emerald}`}>
      <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-lg font-bold text-white truncate" title={display}>
        {prefix}{value}{suffix}
      </p>
    </div>
  );
}

function fmt(val) {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (!isFinite(num)) return String(val);
  const abs = Math.abs(num);
  if (abs >= 1e15) return num.toExponential(2);
  if (abs >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toLocaleString("en-NG", { maximumFractionDigits: 4 });
}
