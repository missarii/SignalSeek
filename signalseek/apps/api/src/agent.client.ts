import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentClient {
  private base = (process.env.AGENT_INTERNAL_URL || 'http://agent:8001').replace(/\/$/, '');
  private secret = process.env.AGENT_INTERNAL_AUTH_SECRET || '';
  private headers() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.secret}` };
  }
  async plan(body: unknown) {
    const r = await fetch(`${this.base}/plan`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`agent plan failed: ${r.status} ${await r.text()}`);
    return r.json();
