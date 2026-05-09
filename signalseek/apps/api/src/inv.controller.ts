import { Controller, Get, Param, Post, Req, Body, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard, WorkspaceGuard } from './guards';
import { JobsService } from './jobs.service';
import { AgentClient } from './agent.client';

@UseGuards(JwtAuthGuard)
@Controller()
export class InvController {
  constructor(private prisma: PrismaService, private jobs: JobsService, private agent: AgentClient) {}
  @Get('investigations/:id') async getInv(@Param('id') id: string, @Req() req: any) {
    const inv = await this.prisma.investigation.findUnique({ where: { id }, include: { plan: true, runs: true } });
    if (!inv) return { error: 'not found' };
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: inv.workspaceId, userId: req.user.sub } },
    });
    if (!m) return { error: 'forbidden' };
    return inv;
  }
  @Post('investigations/:id/cancel') async cancel(@Param('id') id: string, @Req() req: any) {
    await this.prisma.investigation.update({ where: { id }, data: { status: 'CANCELLED' } });
    await this.jobs.emit(id, 'investigation.cancelled', { by: req.user.sub });
    return { ok: true };
  }
  @Post('investigations/:id/resume') async resume(@Param('id') id: string) {
    const inv = await this.prisma.investigation.findUnique({ where: { id } });
    if (!inv) return { error: 'not found' };
    if (inv.status === 'COMPLETED') return { ok: true, resumed: false };
    await this.prisma.investigation.update({ where: { id }, data: { status: 'QUEUED' } });
    this.jobs.enqueueInvestigation(id);
    return { ok: true, resumed: true };
  }
  @Post('investigations/:id/start') async start(@Param('id') id: string) {
    await this.prisma.investigation.update({ where: { id }, data: { status: 'QUEUED' } });
    this.jobs.enqueueInvestigation(id);
    return { ok: true };
  }
  @Get('investigations/:id/events') async events(@Param('id') id: string) {
    return this.prisma.investigationEvent.findMany({
      where: { investigationId: id }, orderBy: { createdAt: 'asc' }, take: 500,
    });
  }
  @Get('investigations/:id/events/stream') async stream(@Param('id') id: string, @Req() req: any) {
    const res = req.res;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    let last = 0;
    const timer = setInterval(async () => {
      try {
        const evs = await this.prisma.investigationEvent.findMany({
          where: { investigationId: id }, orderBy: { createdAt: 'asc' }, take: 500,
        });
        for (const e of evs.slice(last)) {
          res.write(`data: ${JSON.stringify({ id: (e as any).id, type: (e as any).type, payload: (e as any).payload, at: (e as any).createdAt })}\n\n`);
        }
        last = evs.length;
        const inv: any = await this.prisma.investigation.findUnique({ where: { id } });
        if (inv && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(inv.status)) {
          res.write(`data: ${JSON.stringify({ type: 'investigation.status', status: inv.status })}\n\n`);
          clearInterval(timer);
          res.end();
        }
