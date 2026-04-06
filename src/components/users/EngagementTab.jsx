"use client";

import { useState } from "react";
import TablePagination from "@/components/ui/TablePagination";
import useTablePagination from "@/hooks/useTablePagination";

export default function EngagementTab({ detail, subcollections }) {
  const [section, setSection] = useState("badges");

  const u = detail || {};
  const badges = subcollections?.badges?.items || [];
  const brands = subcollections?.brands?.items || [];
  const invites = subcollections?.invites?.items || [];
  const ratings = subcollections?.ratings?.items || [];
  const ratingsMeta = subcollections?.ratings_meta?.items || [];
  const contacts = subcollections?.contacts?.items || [];

  const ratingsSummary = ratingsMeta.find((r) => r._id === "summary");

  return (
    <div className="space-y-5">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <QuickStat label="Level" value={u.level ?? "—"} />
        <QuickStat label="Streak" value={u.streakCount ?? 0} />
        <QuickStat label="Tags" value={u.tagsCount ?? 0} />
        <QuickStat label="Avg Rating" value={ratingsSummary ? ratingsSummary.avg?.toFixed(1) : "—"} />
        <QuickStat label="Contacts" value={contacts.length} />
      </div>

      {/* Section Switcher */}
      <div className="flex gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
        <SectionBtn active={section === "badges"} onClick={() => setSection("badges")} label={`Badges (${badges.length})`} />
        <SectionBtn active={section === "brands"} onClick={() => setSection("brands")} label={`Brands (${brands.length})`} />
        <SectionBtn active={section === "invites"} onClick={() => setSection("invites")} label={`Invites (${invites.length})`} />
        <SectionBtn active={section === "ratings"} onClick={() => setSection("ratings")} label={`Ratings (${ratings.length})`} />
      </div>

      {section === "badges" && <BadgesGrid data={badges} />}
      {section === "brands" && <BrandsList data={brands} />}
      {section === "invites" && <InvitesTable data={invites} />}
      {section === "ratings" && <RatingsTable data={ratings} />}
    </div>
  );
}

function SectionBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition-all ${
        active ? "bg-white/10 text-white shadow" : "text-white/45 hover:bg-white/[0.05] hover:text-white/65"
      }`}
    >
      {label}
    </button>
  );
}

function QuickStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
      <p className="text-[11px] uppercase tracking-wider text-white/42">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function BadgesGrid({ data }) {
  if (!data.length) return <EmptyState label="No badges earned" />;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {data.map((badge, i) => (
        <div key={badge._id || i} className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/8 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-lg">
            🏅
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-amber-100">{badge.name || badge._id}</p>
            <p className="text-[11px] text-amber-200/60">{fmtDate(badge.earnedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BrandsList({ data }) {
  if (!data.length) return <EmptyState label="No brands created" />;

  return (
    <div className="space-y-3">
      {data.map((brand, i) => (
        <div key={brand._id || i} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          {brand.logoUrl && (
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="h-12 w-12 rounded-xl border border-white/10 object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">{brand.name || "—"}</p>
              {brand.isVerifiedBrand && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">Verified</span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${brand.isActive ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"}`}>
                {brand.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/50">{brand.category || "—"} · {brand.city || "—"}, {brand.country || "—"}</p>
            {brand.intro && <p className="mt-1 line-clamp-2 text-xs text-white/40">{brand.intro}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function InvitesTable({ data }) {
  const pagination = useTablePagination(data, { defaultPageSize: 10 });

  if (!data.length) return <EmptyState label="No invites sent" />;

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Code</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Email</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {pagination.pagedRows.map((inv, i) => (
              <tr key={inv._id || i} className="hover:bg-white/[0.04]">
                <td className="px-3 py-2 font-mono text-xs text-white/70">{inv.code || "—"}</td>
                <td className="px-3 py-2 text-xs text-white/80">{[inv.ref_fname, inv.ref_mname, inv.ref_lname].filter(Boolean).join(" ") || "—"}</td>
                <td className="px-3 py-2 text-xs text-white/60">{inv.ref_email || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${inv.status === "accepted" ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200"}`}>
                    {inv.status || "—"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-white/55">{fmtDate(inv.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

function RatingsTable({ data }) {
  if (!data.length) return <EmptyState label="No ratings" />;

  return (
    <div className="space-y-2">
      {data.map((r, i) => (
        <div key={r._id || i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, s) => (
              <span key={s} className={`text-sm ${s < (r.stars || 0) ? "text-amber-400" : "text-white/20"}`}>★</span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/70">{r.remark || "No comment"}</p>
            <p className="mt-0.5 text-[11px] text-white/40">{r.role || "—"} · {fmtDate(r.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] py-8 text-center text-sm text-white/40">{label}</div>
  );
}

function fmtDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  } catch {
    return "—";
  }
}
