"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function WalletCard({ wallet, user, onUpdate }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ngn");
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState(null);

  function requestAdjust() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid positive amount");
      return;
    }

    const currencyLabel = currency === "ngn" ? "₦" : "vPT";

    setError(null);
    // One idempotency key per confirm dialog — a slow response plus a
    // repeated click (button was never disabled mid-request before) or a
    // client-side retry now applies at most once server-side.
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    setConfirm({
      title: `Fund ${currencyLabel}${parsed.toLocaleString("en-NG")}`,
      message: `Credit ${currencyLabel}${parsed.toLocaleString("en-NG")} to ${user.email}'s ${currency.toUpperCase()} balance? This action will be written to the ledger.`,
      busy: false,
      action: async (reason) => {
        setConfirm((current) => (current ? { ...current, busy: true, error: null } : current));
        try {
          await api.post("/withdrawals/fund", {
            uid: user.id ?? user.uid,
            idempotency_key: idempotencyKey,
            reason,
            ...(currency === "ngn"
              ? { amount_ngn: parsed }
              : { amount_vpt_units: parsed }),
          });
          setAmount("");
          setError(null);
          setConfirm(null);
          if (onUpdate) onUpdate();
        } catch (err) {
          setConfirm((current) =>
            current ? { ...current, busy: false, error: err.message || "Adjustment failed" } : current
          );
        }
      },
    });
  }

  return (
    <>
      <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/78">Wallet</h3>
            <p className="mt-1 text-xs text-white/46">Gift wallet balances plus linked BSC address.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/55">
            {wallet.wallet_status || "not_created"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <p className="text-xs font-medium text-emerald-200">NGN Balance</p>
            <p className="text-lg font-bold text-white">
              ₦{typeof wallet.ngn_balance === "number" ? wallet.ngn_balance.toLocaleString("en-NG") : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3">
            <p className="text-xs font-medium text-indigo-200">vPT Units</p>
            <p className="text-lg font-bold text-white">
              {typeof wallet.vpt_units === "number" ? wallet.vpt_units.toLocaleString("en-NG") : "—"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">BSC Address</p>
          <p className="mt-2 break-all font-mono text-sm text-white/76">{wallet.bsc_address || "Not created yet"}</p>
        </div>

        <div className="space-y-3 border-t border-white/8 pt-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/46">Fund Balance</p>

          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="ngn">NGN (₦)</option>
              <option value="vpt">vPT</option>
            </select>

            <input
              type="number"
              min="0"
              step="any"
              placeholder="Amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>

          {error && (
            <p className="text-xs text-red-200">{error}</p>
          )}

          <button
            onClick={requestAdjust}
            disabled={!amount}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-3 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50"
          >
            Credit Wallet
          </button>

          <p className="text-xs text-white/38">Balance removal is intentionally excluded here. Use ledger reversals for auditable corrections.</p>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        busy={confirm?.busy}
        error={confirm?.error}
        requireReason
        reasonPlaceholder="Why is this wallet being credited? (saved to the ledger and audit log)"
        onCancel={() => (confirm?.busy ? null : setConfirm(null))}
        onConfirm={(reason) => {
          if (confirm?.action && !confirm.busy) confirm.action(reason);
        }}
      />
    </>
  );
}
