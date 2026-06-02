'use client';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { Dashboard } from './dashboard';

export default function Home() {
  const { api, accessToken, setSession } = useStore();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [msg, setMsg] = useState('');
  const [health, setHealth] = useState<any>(null);
  useEffect(() => { api('/health/ready').then(setHealth).catch(() => undefined); }, []);
  const auth = async (mode: 'login' | 'register') => {
    try {
      const out = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      setSession({ accessToken: out.accessToken, email: out.user.email });
    } catch (e: any) { setMsg(e.message); }
  };
  if (!accessToken) {
    return (
      <main className="space-y-4">
