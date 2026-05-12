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
      await prisma.sourceSnapshot.create({
        data: { sourceId: sid, content: String(s.content || '').slice(0, 60000), contentHash: s.content_hash || null },
      });
    }
    urlToId.set(s.url, sid);
  }
  const passageByUrl = new Map<string, string>();
  for (const s of r.sources || []) {
    const sid = urlToId.get(s.url);
    if (!sid) continue;
    const has = await prisma.passage.findFirst({ where: { sourceId: sid } });
    if (has) { passageByUrl.set(s.url, has.id); continue; }
    const p = await prisma.passage.create({
      data: { sourceId: sid, text: String(s.content || s.snippet || '').slice(0, 6000), locator: 'chunk-1' },
    });
    passageByUrl.set(s.url, p.id);
  }
  for (const c of r.claims || []) {
    const text = String(c.text).slice(0, 2000);
    const found = await prisma.claim.findFirst({ where: { investigationId: invId } });
    const match = found && found.text.slice(0, 200) === text.slice(0, 200) ? found : null;
    const cid = match ? match.id : (await prisma.claim.create({
      data: { investigationId: invId, text, status: 'SUPPORTED' } })).id;
    for (const e of c.evidence || []) {
      const pid = passageByUrl.get(e.source_url);
      if (!pid) continue;
      const quote = String(e.text).slice(0, 2000);
      const dup = await prisma.evidence.findFirst({ where: { passageId: pid } });
      const eid = dup && dup.quote.slice(0, 200) === quote.slice(0, 200) ? dup.id
        : (await prisma.evidence.create({
          data: { passageId: pid, quote, method: 'sentence-extraction', result: 'SUPPORTED' } })).id;
      await prisma.claimEvidenceLink.upsert({
        where: { claimId_evidenceId: { claimId: cid, evidenceId: eid } },
        create: { claimId: cid, evidenceId: eid, relation: 'supports' }, update: {},
      });
    }
  }
  await persistGraphAndReport(prisma, invId, workspaceId, r, urlToId, existing !== null);
