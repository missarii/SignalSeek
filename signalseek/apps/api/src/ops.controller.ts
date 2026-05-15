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
      return req.res.send(`<!doctype html><html><body><h1>${esc(r.title)}</h1><pre>${esc(r.markdown)}</pre></body></html>`);
    }
    if (format === 'pdf') {
      req.res.setHeader('Content-Type', 'application/pdf');
      const text = r.markdown.replace(/[^\x20-\x7E\n]/g, '?').slice(0, 8000);
      let content = 'BT /F1 9 Tf 40 780 Td 11 TL ';
      for (const ln of text.split('\n').slice(0, 120)) {
        content += `(${(ln || ' ').slice(0, 110).replace(/[()\\]/g, ' ')}) Tj T* `;
      }
      content += 'ET';
      const pdf = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n4 0 obj<</Length ${content.length}>>stream\n${content}\nendstream\nendobj\ntrailer<</Root 1 0 R>>\n%%EOF`;
      return req.res.send(Buffer.from(pdf));
    }
    req.res.setHeader('Content-Type', 'text/markdown');
    return req.res.send(r.markdown);
  }
  @Post('workspaces/:wsId/monitors') @UseGuards(WorkspaceGuard)
  async createMon(@Param('wsId') wsId: string, @Body() b: { topic: string; query: string; schedule: string }) {
    if (!['daily', 'weekly'].includes(b.schedule)) return { error: 'schedule must be daily or weekly' };
    const m = await this.prisma.monitor.create({
      data: { workspaceId: wsId, topic: b.topic, query: b.query, schedule: b.schedule },
