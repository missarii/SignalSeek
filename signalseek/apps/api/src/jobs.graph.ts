import { PrismaService } from './prisma.service';

export async function persistGraphAndReport(
  prisma: PrismaService, invId: string, workspaceId: string, r: any,
  urlToId: Map<string, string>, hasReport: boolean,
) {
  for (const k of r.contradictions || []) {
    const dup = await prisma.contradiction.findFirst({ where: { investigationId: invId } });
    if (!dup || !dup.claimA.startsWith(String(k.claim_a).slice(0, 60))) {
      await prisma.contradiction.create({
        data: { investigationId: invId, claimA: String(k.claim_a).slice(0, 2000),
          claimB: String(k.claim_b).slice(0, 2000),
          kind: String(k.kind || 'genuine'), explanation: String(k.explanation || '').slice(0, 2000) },
      });
    }
  }
  const entId = new Map<string, string>();
  for (const e of r.entities || []) {
    const norm = String(e.normalized || e.name || '').toLowerCase().slice(0, 200);
    if (!norm) continue;
    const up = await prisma.entity.upsert({
      where: { workspaceId_normalized: { workspaceId, normalized: norm } },
      create: { workspaceId, name: String(e.name).slice(0, 300), normalized: norm,
        type: String(e.type || 'Concept').slice(0, 100) },
      update: { lastSeen: new Date() },
    });
