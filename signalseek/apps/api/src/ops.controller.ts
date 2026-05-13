import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard, WorkspaceGuard } from './guards';
import { AgentClient } from './agent.client';

@UseGuards(JwtAuthGuard)
@Controller()
export class OpsController {
  constructor(private prisma: PrismaService, private agent: AgentClient) {}
  @Get('workspaces/:wsId/reports') @UseGuards(WorkspaceGuard)
  async reports(@Param('wsId') wsId: string) {
    return this.prisma.report.findMany({ where: { workspaceId: wsId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }
  @Get('reports/:id') async report(@Param('id') id: string) {
    return this.prisma.report.findUnique({ where: { id }, include: { citations: true, versions: true } });
  }
  @Get('reports/:id/versions') async versions(@Param('id') id: string) {
    return this.prisma.reportVersion.findMany({ where: { reportId: id }, orderBy: { version: 'asc' } });
  }
  @Get('reports/:id/export') async exp(@Param('id') id: string, @Req() req: any) {
    const format = String(req.query.format || 'markdown');
    const r = await this.prisma.report.findUnique({ where: { id }, include: { citations: true } });
    if (!r) return { error: 'not found' };
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (format === 'html') {
      req.res.setHeader('Content-Type', 'text/html');
