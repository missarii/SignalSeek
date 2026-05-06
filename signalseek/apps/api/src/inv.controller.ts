import { Controller, Get, Param, Post, Req, Body, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard, WorkspaceGuard } from './guards';
import { JobsService } from './jobs.service';
