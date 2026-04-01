export default function PoolsCard({ pools }) {
  if (!pools) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Pool Balances</h2>
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
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  purple: "bg-purple-50 border-purple-200",
  amber: "bg-amber-50 border-amber-200",
};

function PoolTile({ label, value, color = "blue" }) {
  return (
    <div className={`rounded-lg border p-4 ${POOL_COLORS[color] || POOL_COLORS.blue}`}>
      <h4 className="text-sm text-gray-600 font-medium">{label}</h4>
      <p className="text-xl font-bold text-gray-900 mt-1">
        {typeof value === "number" ? value.toLocaleString("en-NG") : "—"}
      </p>
    </div>
  );
}
