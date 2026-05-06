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
