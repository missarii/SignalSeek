import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const h = req.headers.authorization || '';
    const tok = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!tok) throw new UnauthorizedException('missing token');
    try {
      req.user = await this.jwt.verifyAsync(tok);
      return true;
    } catch {
      throw new UnauthorizedException('invalid token');
    }
  }
}

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const wsId = req.params.wsId || req.params.id || req.body?.workspaceId;
    if (!wsId) return true;
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: wsId, userId: req.user.sub } },
    });
    if (!m) throw new ForbiddenException('not a workspace member');
    req.membership = m;
    return true;
  }
}
