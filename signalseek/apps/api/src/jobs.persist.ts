import { PrismaService } from './prisma.service';
import { persistGraphAndReport } from './jobs.graph';

export async function persistResult(prisma: PrismaService, invId: string, workspaceId: string, r: any) {
  const existing = await prisma.report.findFirst({ where: { investigationId: invId } });
  for (const ev of r.events || []) {
    await prisma.investigationEvent.create({
      data: { investigationId: invId, type: String(ev.type || 'search.completed'), payload: ev.payload || {} },
    });
  }
  const urlToId = new Map<string, string>();
  for (const q of (r.plan?.search_queries || [])) {
    await prisma.searchQuery.create({
      data: { investigationId: invId, query: String(q), provider: process.env.SEARCH_PROVIDER || 'mock' },
    }).catch(() => undefined);
  }
  for (const s of r.sources || []) {
    const found = await prisma.source.findFirst({ where: { investigationId: invId, canonicalUrl: s.url } });
    let sid: string;
    if (found) sid = found.id;
    else {
      const created = await prisma.source.create({
        data: { investigationId: invId, workspaceId, url: s.url, canonicalUrl: s.url,
          title: String(s.title || s.url).slice(0, 500),
          snippet: String(s.snippet || '').slice(0, 2000),
          provider: s.provider || 'mock', contentHash: s.content_hash || null },
      });
      sid = created.id;
