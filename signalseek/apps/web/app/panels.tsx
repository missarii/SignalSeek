'use client';
export function DetailPanels({ detail, events }: { detail: any; events: any[] }) {
  if (!detail && events.length === 0) return null;
  return (
    <div className="space-y-4">
      {events.length > 0 && (
        <section className="p-4 rounded bg-slate-900 border border-slate-800">
          <h2 className="font-semibold mb-2">Live progress ({events.length})</h2>
          <ul className="text-xs space-y-1 max-h-48 overflow-auto">
            {events.slice(-30).map((e: any, i: number) => (
              <li key={i} className="text-slate-400">{e.type} — {JSON.stringify(e.payload || e).slice(0, 160)}</li>
            ))}
          </ul>
        </section>
      )}
      {detail?.report && (
        <section className="p-4 rounded bg-slate-900 border border-slate-800">
          <h2 className="font-semibold">{detail.report.title}</h2>
          <pre className="whitespace-pre-wrap text-sm text-slate-300 mt-2">{detail.report.markdown}</pre>
          <h3 className="mt-3 font-semibold text-sm">Citations</h3>
          <ul className="text-xs text-slate-400">
            {detail.report.citations?.map((c: any) => <li key={c.id}>[{c.key}] {c.url}</li>)}
          </ul>
        </section>
      )}
      {detail?.inv && (
        <section className="p-4 rounded bg-slate-900 border border-slate-800 space-y-2">
          <h2 className="font-semibold">[{detail.inv.status}] {detail.inv.question}</h2>
          <p className="text-xs text-slate-500">Objective: {detail.inv.plan?.objective}</p>
          <h3 className="text-sm font-semibold">Sources ({detail.src.length})</h3>
          <ul className="text-xs text-slate-400">
            {detail.src.map((s: any) => <li key={s.id}>{s.title} — {s.canonicalUrl}</li>)}
          </ul>
          <h3 className="text-sm font-semibold">Claims ({detail.ev.claims.length})</h3>
          <ul className="text-xs text-slate-300 space-y-1">
            {detail.ev.claims.map((c: any) => <li key={c.id}>• {c.text} [{c.evidenceLinks.length} evidence]</li>)}
          </ul>
          <h3 className="text-sm font-semibold">Contradictions ({detail.ev.contradictions.length})</h3>
