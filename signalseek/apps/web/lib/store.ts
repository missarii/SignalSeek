'use client';
import { create } from 'zustand';

interface Session { accessToken: string | null; email: string | null; workspaceId: string | null; }
interface Store extends Session {
  setSession: (s: Partial<Session>) => void;
  api: (path: string, init?: RequestInit) => Promise<any>;
}
const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
export const useStore = create<Store>((set, get) => ({
