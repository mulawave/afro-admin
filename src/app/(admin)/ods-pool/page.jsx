"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { ods, formatDate, formatVpt } from "@/services/ods";
import { Button, Card, ErrorNote, OdsHeader, Spinner, Stat, useAsync } from "@/components/ods/OdsUi";

export default function OdsPoolPage() {
  const first = useAsync(() => ods.publicPool(), []);
  const [more, setMore] = useState([]);
  const [before, setBefore] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const p = first.data;
  const next = before === undefined ? p?.nextBefore : before;
  const c = p?.lastConsistency;

  async function loadMore() {
    setLoading(true);
    try {
      const r = await ods.publicPool(next);
      setMore((m) => [...m, ...r.contributions]);
      setBefore(r.nextBefore);
    } finally {
      setLoading(false);
    }
  }

  const cols = [
    { key: "at", label: "When", render: (x) => <span className="text-xs text-white/60">{formatDate(x.at)}</span> },
    { key: "uid", label: "From user", render: (x) => <span className="font-mono text-xs">{x.uid}</span> },
    { key: "reason", label: "Reason", render: (x) => (x.reason === "streak_penalty" ? "Broken streak" : x.reason) },
    { key: "vpt", label: "vPT", render: (x) => <span className="font-mono tabular-nums">{formatVpt(x.vpt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Public Pool" subtitle="vPT forfeited from broken Pro streaks. Server-written only; checked weekly for consistency." />
      <ErrorNote error={first.error} onRetry={first.reload} />
      {first.loading && !p ? <Spinner /> : null}
      {p ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Pool total" value={formatVpt(p.totalVpt)} />
            <Stat label="Contributions" value={p.contributionCount.toLocaleString()} />
            <Stat
              label="Weekly consistency"
              value={c ? (c.ok ? "Consistent" : "Drift detected") : "Not run yet"}
              tone={c ? (c.ok ? "good" : "bad") : "default"}
              hint={c ? `Checked ${formatDate(c.at)}${c.ok ? "" : ` · drift ${formatVpt(c.driftVpt)}`}` : "Runs every Monday"}
            />
          </div>
          {c && !c.ok ? (
            <Card title="Consistency drift">
              <p className="text-sm text-red-200">
                Pool records {formatVpt(c.recordedVpt)} over {c.recordedCount} contributions, but the contributions add up to {formatVpt(c.contributionsVpt)} over {c.contributionsCount}. Investigate before changing anything.
              </p>
            </Card>
          ) : null}
          <DataTable columns={cols} rows={[...p.contributions, ...more]} getRowId={(x) => x.id} emptyMessage="No contributions yet." defaultPageSize={25} />
          {next ? (
            <div className="flex justify-center">
              <Button variant="ghost" onClick={loadMore} disabled={loading}>{loading ? "Loading..." : "Load more"}</Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
