"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function WalletCard({ wallet, user, onUpdate }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ngn");
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function requestAdjust(type) {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid positive amount");
      return;
    }

    const adjustAmount = type === "add" ? parsed : -parsed;
    const label = type === "add" ? "Add" : "Remove";
    const currencyLabel = currency === "ngn" ? "₦" : "vPT";

    // Safety: prevent negative balance on removal
    if (type === "remove") {
      const current = currency === "ngn" ? wallet.ngn_balance : wallet.vpt_units;
      if (parsed > current) {
        setError(`Cannot remove more than current balance (${currencyLabel}${Number(current).toLocaleString("en-NG")})`);
        return;
      }
    }

    setError(null);
    setConfirm({
      title: `${label} ${currencyLabel}${parsed.toLocaleString("en-NG")}`,
      message: `${label} ${currencyLabel}${parsed.toLocaleString("en-NG")} ${type === "add" ? "to" : "from"} ${user.email}'s ${currency.toUpperCase()} balance? This action will be recorded in the ledger.`,
      action: async () => {
        setLoading(true);
        try {
          await api.post("/admin/wallet/adjust", {
            uid: user.uid,
            currency,
            amount: adjustAmount,
          });
          setAmount("");
          setError(null);
          if (onUpdate) onUpdate();
        } catch (err) {
          setError(err.message || "Adjustment failed");
        } finally {
          setLoading(false);
        }
      },
    });
  }

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Wallet</h3>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">NGN Balance</p>
            <p className="text-lg font-bold text-green-800">
              ₦{typeof wallet.ngn_balance === "number" ? wallet.ngn_balance.toLocaleString("en-NG") : "—"}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium">vPT Units</p>
            <p className="text-lg font-bold text-purple-800">
              {typeof wallet.vpt_units === "number" ? wallet.vpt_units.toLocaleString("en-NG") : "—"}
            </p>
          </div>
        </div>

        {/* Adjustment Controls */}
        <div className="border-t border-gray-200 pt-3 space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Balance Adjustment</p>

          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => requestAdjust("add")}
              disabled={loading || !amount}
              className="flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              + Add
            </button>
            <button
              onClick={() => requestAdjust("remove")}
              disabled={loading || !amount}
              className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              − Remove
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.action) await confirm.action();
          setConfirm(null);
        }}
      />
    </>
  );
}
