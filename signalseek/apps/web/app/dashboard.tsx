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
