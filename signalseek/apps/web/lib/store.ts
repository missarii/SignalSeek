'use client';
import { create } from 'zustand';

interface Session { accessToken: string | null; email: string | null; workspaceId: string | null; }
interface Store extends Session {
  setSession: (s: Partial<Session>) => void;
  api: (path: string, init?: RequestInit) => Promise<any>;
}
const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
export const useStore = create<Store>((set, get) => ({
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('ss_access') : null,
  email: null, workspaceId: null,
  setSession: (s) => {
    if (s.accessToken !== undefined && typeof window !== 'undefined') {
      if (s.accessToken) localStorage.setItem('ss_access', s.accessToken);
      else localStorage.removeItem('ss_access');
    }
    set(s);
  },
  api: async (path, init = {}) => {
    const tok = get().accessToken;
    const r = await fetch(`${API}/api/v1${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}), ...(init.headers || {}) },
    });
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('text/') || ct.includes('pdf')) return r.blob();
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any)?.message || JSON.stringify(data).slice(0, 300));
    return data;
  },
}));
