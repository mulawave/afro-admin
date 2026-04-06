export default function PoolsCard({ pools }) {
  if (!pools) return null;

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-white">Pool Balances</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PoolTile label="Operations (₦)" value={pools.operations_ngn} color="blue" />
        <PoolTile label="Community (₦)" value={pools.community_ngn} color="green" />
        <PoolTile label="Operations (vPT)" value={pools.operations_vpt} color="purple" />
        <PoolTile label="Community (vPT)" value={pools.community_vpt} color="amber" />
      </div>
    </div>
  );
}

const POOL_COLORS = {
  blue: "border-sky-300/18 bg-sky-500/8",
  green: "border-emerald-300/18 bg-emerald-500/8",
  purple: "border-indigo-300/18 bg-indigo-500/8",
  amber: "border-amber-300/18 bg-amber-500/8",
};

function PoolTile({ label, value, color = "blue" }) {
  return (
    <div className={`rounded-lg border p-4 ${POOL_COLORS[color] || POOL_COLORS.blue}`}>
      <h4 className="text-sm font-medium text-white/58">{label}</h4>
      <p className="mt-1 text-xl font-bold text-white">
        {typeof value === "number" ? value.toLocaleString("en-NG") : "—"}
      </p>
    </div>
  );
}
