import { PrismaService } from './prisma.service';
import { persistGraphAndReport } from './jobs.graph';

export async function persistResult(prisma: PrismaService, invId: string, workspaceId: string, r: any) {
  const existing = await prisma.report.findFirst({ where: { investigationId: invId } });
  for (const ev of r.events || []) {
