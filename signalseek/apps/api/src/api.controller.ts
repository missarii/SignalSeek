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
