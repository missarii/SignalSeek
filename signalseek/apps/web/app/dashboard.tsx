'use client';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { DetailPanels } from './panels';
import { MonitorsPanel } from './monitors';

export function Dashboard() {
  const { api, setSession, workspaceId, email } = useStore();
  const [ws, setWs] = useState<any[]>([]);
  const [invs, setInvs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [integ, setInteg] = useState<any>(null);
  const [q, setQ] = useState('What is the adoption of open RAN among European telecom operators?');
  const [msg, setMsg] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  const load = async () => {
    try {
      const w = await api('/workspaces');
      setWs(w);
      const wid = workspaceId || w[0]?.id;
      if (w[0] && !workspaceId) setSession({ workspaceId: w[0].id });
      if (wid) {
        setInvs(await api(`/workspaces/${wid}/investigations`));
        setReports(await api(`/workspaces/${wid}/reports`));
      }
      setInteg(await api('/integrations'));
    } catch (e: any) { setMsg(e.message); }
  };
  useEffect(() => { load(); }, [workspaceId]);
  const createWs = async () => {
    const w = await api('/workspaces', { method: 'POST', body: JSON.stringify({ name: 'Demo workspace' }) });
    setSession({ workspaceId: w.id }); load();
  };
  const startInv = async () => {
    const wid = workspaceId || ws[0]?.id;
    if (!wid) { setMsg('create a workspace first'); return; }
    const inv = await api(`/workspaces/${wid}/investigations`, {
      method: 'POST', body: JSON.stringify({ question: q, maxRounds: 4, maxQueries: 20, maxSources: 50 }),
    });
    setMsg(`investigation ${inv.id} queued (demo providers)`);
    load();
  };
  const openInv = async (id: string) => {
    const [inv, ev, src] = await Promise.all([
      api(`/investigations/${id}`), api(`/investigations/${id}/evidence`), api(`/investigations/${id}/sources`),
    ]);
    setDetail({ inv, ev, src });
    const s = new EventSource(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/investigations/${id}/events/stream`);
    const acc: any[] = [];
    s.onmessage = (m) => { try { acc.push(JSON.parse((m as MessageEvent).data)); setEvents([...acc]); } catch {} };
    (window as any)._es?.close(); (window as any)._es = s;
  };
  const openReport = async (id: string) => setDetail({ report: await api(`/reports/${id}`) });

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-300">SignalSeek</h1>
        <div className="flex gap-2 text-sm items-center">
          <span className="text-slate-400">{email || ''}</span>
          <button className="px-2 py-1 rounded bg-slate-800" onClick={() => setSession({ accessToken: null })}>Logout</button>
        </div>
      </header>
      {msg && <p className="text-sm text-amber-300">{msg}</p>}
      <section className="p-4 rounded bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="font-semibold">New investigation</h2>
        <div className="flex gap-2 flex-wrap">
          <input className="flex-1 min-w-[240px] p-2 rounded bg-slate-950 border border-slate-700" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="px-4 py-2 rounded bg-indigo-600" onClick={startInv}>Start</button>
          <button className="px-4 py-2 rounded bg-slate-700" onClick={createWs}>New workspace</button>
        </div>
        {integ && <p className="text-xs text-slate-500">search={integ.searchProvider} llm={integ.llmProvider} {integ.note || ''}</p>}
      </section>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="p-4 rounded bg-slate-900 border border-slate-800">
          <h2 className="font-semibold mb-2">Investigations ({invs.length})</h2>
          <ul className="space-y-1 text-sm">
            {invs.map((i: any) => (
              <li key={i.id}>
                <button className="text-left hover:text-indigo-300" onClick={() => openInv(i.id)}>
                  [{i.status}] {String(i.question).slice(0, 90)}
                </button>
              </li>
            ))}
            {invs.length === 0 && <li className="text-slate-500">No investigations yet.</li>}
          </ul>
        </section>
        <section className="p-4 rounded bg-slate-900 border border-slate-800">
          <h2 className="font-semibold mb-2">Reports ({reports.length})</h2>
          <ul className="space-y-1 text-sm">
