import Link from "next/link";

const ACCENT_COLORS = {
  blue: "from-sky-400/18 to-sky-500/4 border-sky-300/18",
  green: "from-emerald-400/18 to-emerald-500/4 border-emerald-300/18",
  purple: "from-indigo-400/18 to-violet-500/4 border-indigo-300/18",
  amber: "from-amber-300/24 to-orange-400/6 border-amber-200/22",
};

export default function StatCard({ title, value, accent = "blue", href = null, hint = null }) {
  const className = `rounded-[1.75rem] border bg-gradient-to-br p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl transition ${ACCENT_COLORS[accent] || ACCENT_COLORS.blue} ${href ? "hover:border-white/30 hover:brightness-105" : ""}`;
  const content = (
    <>
      <h3 className="text-sm font-medium text-white/58">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-white">{format(value)}</p>
      {hint ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/42">{hint}</p> : null}
    </>
  );

  if (href) {
    return <Link href={href} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}

function format(v) {
  if (typeof v === "number") {
    return v.toLocaleString("en-NG");
  }
  return v ?? "—";
}
