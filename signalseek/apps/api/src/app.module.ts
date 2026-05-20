import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ApiController } from './api.controller';
import { InvController } from './inv.controller';
import { OpsController } from './ops.controller';
import { AgentClient } from './agent.client';
import { JobsService } from './jobs.service';
import { JwtAuthGuard, WorkspaceGuard } from './guards';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me-32chars-minimum-please',
      signOptions: { expiresIn: '15m' },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
  ],
  controllers: [AuthController, ApiController, InvController, OpsController],
  providers: [
    PrismaService, AuthService, AgentClient, JobsService, JwtAuthGuard, WorkspaceGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
