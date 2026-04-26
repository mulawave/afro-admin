export default function TransactionChargesCard({ charges, providerFees, vat }) {
  if (!charges && !providerFees && !vat) return null;

  const c = charges || {};
  const p = providerFees || {};
  const v = vat || {};

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-white">Transaction Charges &amp; VAT</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ChargeTile
          label="Total Charges Collected"
          value={c.total_collected}
          prefix="₦"
          color="amber"
        />
        <ChargeTile
          label="Service Charges (AfroVision)"
          value={c.total_service_charges}
          prefix="₦"
          color="green"
        />
        <ChargeTile
          label="Provider Fees (Paystack / FW)"
          value={p.total_collected}
          prefix="₦"
          color="blue"
        />
        <ChargeTile
          label="VAT Collected (7.5%)"
          value={v.total_collected}
          prefix="₦"
          color="red"
        />
        <ChargeTile
          label="Withdrawal Transactions"
          value={c.transaction_count}
          color="purple"
        />
      </div>

      {/* Detailed breakdown */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DetailTile
          label="Charges Pool Balance"
          value={c.balance_ngn}
          prefix="₦"
          hint="Fees collected minus refunds"
        />
        <DetailTile
          label="Provider Fees Balance"
          value={p.balance_ngn}
          prefix="₦"
          hint="Earmarked for payment providers"
        />
        <DetailTile
          label="VAT Balance (Owed to FIRS)"
          value={v.balance_ngn}
          prefix="₦"
          hint="Net VAT to remit to Federal Inland Revenue"
        />
        <DetailTile
          label="Total Refunded"
          value={(c.total_refunded || 0) + (v.total_refunded || 0)}
          prefix="₦"
          hint="Fees + VAT returned on rejected withdrawals"
        />
      </div>
    </div>
  );
}

const CHARGE_COLORS = {
  amber: "border-amber-300/18 bg-amber-500/8",
  green: "border-emerald-300/18 bg-emerald-500/8",
  blue: "border-sky-300/18 bg-sky-500/8",
  purple: "border-indigo-300/18 bg-indigo-500/8",
  red: "border-rose-300/18 bg-rose-500/8",
};

function ChargeTile({ label, value, prefix = "", color = "amber" }) {
  return (
    <div className={`rounded-lg border p-4 ${CHARGE_COLORS[color] || CHARGE_COLORS.amber}`}>
      <h4 className="text-sm font-medium text-[var(--av-light-orange)]">{label}</h4>
      <p className="mt-1 text-xl font-bold text-white">
        {typeof value === "number" ? `${prefix}${value.toLocaleString("en-NG")}` : "—"}
      </p>
    </div>
  );
}

function DetailTile({ label, value, prefix = "", hint }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
      <h4 className="text-sm font-medium text-[var(--av-light-orange)]">{label}</h4>
      <p className="mt-1 text-lg font-bold text-white">
        {typeof value === "number" ? `${prefix}${value.toLocaleString("en-NG")}` : "—"}
      </p>
      {hint && <p className="mt-1 text-[10px] text-[var(--av-light-orange)]/60">{hint}</p>}
    </div>
  );
}
