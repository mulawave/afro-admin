const ACCENT_COLORS = {
  blue: "border-blue-500",
  green: "border-green-500",
  purple: "border-purple-500",
  amber: "border-amber-500",
};

export default function StatCard({ title, value, accent = "blue" }) {
  return (
    <div
      className={`bg-white shadow-sm rounded-lg p-5 border-l-4 ${ACCENT_COLORS[accent] || ACCENT_COLORS.blue}`}
    >
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{format(value)}</p>
    </div>
  );
}

function format(v) {
  if (typeof v === "number") {
    return v.toLocaleString("en-NG");
  }
  return v ?? "—";
}
