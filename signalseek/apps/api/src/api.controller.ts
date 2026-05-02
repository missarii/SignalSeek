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
