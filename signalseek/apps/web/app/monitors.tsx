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
