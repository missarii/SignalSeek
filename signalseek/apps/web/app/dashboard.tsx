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
