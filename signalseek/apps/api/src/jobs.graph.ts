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
