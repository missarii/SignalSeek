'use client';
import { useState } from 'react';
import { useStore } from '../lib/store';
import { GraphView } from './graph';

export function MonitorsPanel({ workspaceId }: { workspaceId: string | null }) {
  const { api } = useStore();
  const [topic, setTopic] = useState('Open RAN adoption');
  const [query, setQuery] = useState('open RAN adoption Europe');
  const [monitors, setMonitors] = useState<any[]>([]);
  const [graph, setGraph] = useState<any>({ nodes: [], edges: [] });
  const load = async () => {
    if (!workspaceId) return;
    setMonitors(await api(`/workspaces/${workspaceId}/monitors`));
  };
  const create = async () => {
    if (!workspaceId) return;
    await api(`/workspaces/${workspaceId}/monitors`, {
      method: 'POST', body: JSON.stringify({ topic, query, schedule: 'weekly' }),
    });
    load();
  };
  const loadGraph = async (invId: string) => setGraph(await api(`/investigations/${invId}/graph`));
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <section className="p-4 rounded bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="font-semibold">Trend monitors</h2>
        <input className="w-full p-2 rounded bg-slate-950 border border-slate-700" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        <input className="w-full p-2 rounded bg-slate-950 border border-slate-700" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Query" />
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded bg-indigo-600 text-sm" onClick={create}>Create (weekly)</button>
          <button className="px-3 py-1.5 rounded bg-slate-700 text-sm" onClick={load}>Refresh</button>
        </div>
        <ul className="text-sm space-y-1">
          {monitors.map((m: any) => <li key={m.id} className="text-slate-300">{m.paused ? '[paused]' : '[active]'} {m.topic} — {m.schedule}</li>)}
          {monitors.length === 0 && <li className="text-slate-500 text-sm">No monitors yet.</li>}
        </ul>
      </section>
      <section className="p-4 rounded bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="font-semibold">Knowledge graph</h2>
        <p className="text-xs text-slate-500">Every edge links to persisted evidence. Paste an investigation ID to visualize.</p>
        <GraphLoader onLoad={loadGraph} />
        <GraphView nodes={graph.nodes} edges={graph.edges} />
      </section>
    </div>
  );
}

