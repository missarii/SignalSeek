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
