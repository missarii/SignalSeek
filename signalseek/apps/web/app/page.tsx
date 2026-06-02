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
        <h1 className="text-3xl font-bold text-indigo-300">SignalSeek</h1>
        <p className="text-slate-400">Evidence-grounded research. Local demo mode needs no paid keys.</p>
        <div className="grid gap-2 max-w-md">
          <input className="p-2 rounded bg-slate-900 border border-slate-700" placeholder="name (register)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="p-2 rounded bg-slate-900 border border-slate-700" placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="p-2 rounded bg-slate-900 border border-slate-700" placeholder="password (min 10 chars)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-indigo-600" onClick={() => auth('register')}>Register</button>
            <button className="px-4 py-2 rounded bg-slate-700" onClick={() => auth('login')}>Login</button>
          </div>
          {msg && <p className="text-sm text-amber-300">{msg}</p>}
          {health && <p className="text-xs text-slate-500">API: {JSON.stringify(health)}</p>}
        </div>
      </main>
    );
  }
  return <Dashboard />;
}
