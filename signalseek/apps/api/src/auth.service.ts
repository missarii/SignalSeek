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
