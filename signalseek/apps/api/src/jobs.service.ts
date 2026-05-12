import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AgentClient } from './agent.client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService, private agent: AgentClient) {}
  enqueueInvestigation(id: string) {
    setImmediate(() => this.executeInvestigation(id).catch(() => undefined));
  }
  async emit(invId: string, type: string, payload: unknown) {
    return this.prisma.investigationEvent.create({ data: { investigationId: invId, type, payload: payload as object } });
  }
  async executeInvestigation(id: string) {
    const inv = await this.prisma.investigation.findUnique({ where: { id }, include: { plan: true } });
    if (!inv || inv.status === 'CANCELLED' || inv.status === 'COMPLETED' || inv.status === 'RUNNING') return;
    await this.prisma.investigation.update({ where: { id }, data: { status: 'RUNNING' } });
    await this.emit(id, 'investigation.started', { question: inv.question });
    const run = await this.prisma.investigationRun.create({ data: { investigationId: id } });
    try {
      const result: any = await this.agent.run({
        investigation_id: id, workspace_id: inv.workspaceId,
        question: inv.question, description: inv.description || '',
        plan: inv.plan ? {
          objective: inv.plan.objective,
          subquestions: inv.plan.subquestions as string[],
          search_queries: inv.plan.searchQueries as string[],
          source_categories: inv.plan.sourceCategories as string[] } : null,
        max_rounds: inv.maxRounds, max_queries: inv.maxQueries,
        max_sources: inv.maxSources, demo: (process.env.SEARCH_PROVIDER || 'mock') === 'mock',
      });
      const { persistResult } = await import('./jobs.persist');
      await persistResult(this.prisma, id, inv.workspaceId, result);
      await this.prisma.investigationRun.update({ where: { id: run.id }, data: { status: 'COMPLETED', finishedAt: new Date(), round: result.rounds_executed || 0 } });
      const cur = await this.prisma.investigation.findUnique({ where: { id } });
      if (cur && cur.status !== 'CANCELLED') {
        await this.prisma.investigation.update({ where: { id }, data: { status: 'COMPLETED' } });
      }
