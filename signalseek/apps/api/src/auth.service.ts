import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from './prisma.service';
import { hashToken, newToken } from './util';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  async register(email: string, password: string, name?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) throw new UnauthorizedException('registration failed');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, name: name || null },
    });
    return this.issueTokens(user.id, user.email);
  }
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('invalid credentials');
    }
    return this.issueTokens(user.id, user.email);
  }
  async issueTokens(userId: string, email: string) {
    const access = await this.jwt.signAsync({ sub: userId, email }, { expiresIn: '15m' });
    const refresh = newToken();
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(refresh), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) },
    });
    return { accessToken: access, refreshToken: refresh, user: { id: userId, email } };
  }
  async refresh(token: string) {
    const rec = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) }, include: { user: true },
    });
    if (!rec || rec.revokedAt || rec.expiresAt < new Date()) throw new UnauthorizedException('invalid refresh token');
    await this.prisma.refreshToken.update({ where: { id: rec.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(rec.userId, rec.user.email);
  }
  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  async me(userId: string) {
    return this.prisma.user.findUnique({
