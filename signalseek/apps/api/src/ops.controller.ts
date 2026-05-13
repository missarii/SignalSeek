import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard, WorkspaceGuard } from './guards';
import { AgentClient } from './agent.client';

@UseGuards(JwtAuthGuard)
@Controller()
