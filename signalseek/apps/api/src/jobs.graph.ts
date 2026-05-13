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
    entId.set(norm, up.id);
  }
  for (const rel of r.relationships || []) {
    const a = entId.get(String(rel.from || '').toLowerCase());
    const b = entId.get(String(rel.to || '').toLowerCase());
    if (!a || !b) continue;
    const dup = await prisma.relationship.findFirst({
      where: { fromId: a, toId: b, type: String(rel.type || 'RELATED_TO') },
    });
    const rid = dup ? dup.id : (await prisma.relationship.create({
      data: { fromId: a, toId: b, type: String(rel.type || 'RELATED_TO').slice(0, 100) } })).id;
    const firstEv = await prisma.evidence.findFirst({
      where: { passage: { source: { investigationId: invId } } },
    });
    if (firstEv) {
      await prisma.relationshipEvidence.upsert({
        where: { relationshipId_evidenceId: { relationshipId: rid, evidenceId: firstEv.id } },
        create: { relationshipId: rid, evidenceId: firstEv.id }, update: {},
      });
    }
