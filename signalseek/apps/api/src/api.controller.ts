import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard, WorkspaceGuard } from './guards';
import { JobsService } from './jobs.service';
import { AgentClient } from './agent.client';

export class CreateInvDto {
  @IsString() @MinLength(8) question!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() depth?: string;
  @IsOptional() @IsInt() @Min(1) @Max(4) maxRounds?: number;
  @IsOptional() @IsInt() @Min(1) @Max(20) maxQueries?: number;
  @IsOptional() @IsInt() @Min(1) @Max(50) maxSources?: number;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class ApiController {
  constructor(private prisma: PrismaService, private jobs: JobsService, private agent: AgentClient) {}

  @Get('health/live') live() { return { status: 'ok', service: 'api' }; }
  @Get('health/ready') async ready() {
    try { await this.prisma.$queryRaw`SELECT 1`; return { status: 'ready', db: true }; }
    catch { return { status: 'degraded', db: false }; }
  }
  @Get('metrics') async metrics(@Req() req: any) {
    return {
      investigations: await this.prisma.investigation.count(),
      reports: await this.prisma.report.count(),
      sources: await this.prisma.source.count(),
      user: req.user?.sub,
    };
  }
  @Get('workspaces') async ws(@Req() req: any) {
    const ms = await this.prisma.workspaceMember.findMany({
      where: { userId: req.user.sub }, include: { workspace: true },
    });
    return ms.map((m: any) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role }));
  }
  @Post('workspaces') async createWs(@Req() req: any, @Body() b: { name: string }) {
    const ws = await this.prisma.workspace.create({ data: { name: String(b.name || 'Workspace').slice(0, 200) } });
    await this.prisma.workspaceMember.create({ data: { workspaceId: ws.id, userId: req.user.sub, role: 'OWNER' } });
    await this.prisma.auditLog.create({ data: { userId: req.user.sub, workspaceId: ws.id, action: 'workspace.create', detail: { name: ws.name } } });
    return ws;
  }
  @Get('workspaces/:id') @UseGuards(WorkspaceGuard) async getWs(@Param('id') id: string) {
    return this.prisma.workspace.findUnique({ where: { id } });
  }
  @Get('workspaces/:id/members') @UseGuards(WorkspaceGuard) async members(@Param('id') id: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId: id }, include: { user: { select: { email: true, name: true } } },
    });
  }
  @Post('workspaces/:wsId/investigations') @UseGuards(WorkspaceGuard)
  async createInv(@Param('wsId') wsId: string, @Req() req: any, @Body() b: CreateInvDto) {
    if ((req.membership.role as string) === 'VIEWER') return { error: 'viewers cannot create investigations' };
    const inv = await this.prisma.investigation.create({
      data: {
        workspaceId: wsId, question: b.question, description: b.description || null,
        depth: b.depth || 'standard', maxRounds: b.maxRounds ?? 4,
        maxQueries: b.maxQueries ?? 20, maxSources: b.maxSources ?? 50,
        createdById: req.user.sub, status: 'QUEUED',
      },
    });
    try {
      const plan: any = await this.agent.plan({ question: b.question, description: b.description || '',
        max_rounds: inv.maxRounds, max_queries: inv.maxQueries });
      await this.prisma.researchPlan.create({
        data: { investigationId: inv.id, objective: plan.objective,
          subquestions: plan.subquestions || [], searchQueries: plan.search_queries || [],
          sourceCategories: plan.source_categories || [] },
      });
      await this.jobs.emit(inv.id, 'plan.created', { objective: plan.objective });
    } catch {
      await this.prisma.researchPlan.create({
        data: { investigationId: inv.id, objective: `Answer: ${b.question}`,
          subquestions: ['state?', 'figures?', 'disagreements?'], searchQueries: [b.question],
          sourceCategories: ['web'] },
      });
    }
    await this.jobs.emit(inv.id, 'investigation.created', { question: b.question });
    this.jobs.enqueueInvestigation(inv.id);
    return this.prisma.investigation.findUnique({ where: { id: inv.id }, include: { plan: true } });
  }
  @Get('workspaces/:wsId/investigations') @UseGuards(WorkspaceGuard)
  async listInv(@Param('wsId') wsId: string) {
    return this.prisma.investigation.findMany({
      where: { workspaceId: wsId }, orderBy: { createdAt: 'desc' }, take: 50, include: { plan: true },
    });
  }
}
