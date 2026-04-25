import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

class RegisterDto { @IsEmail() email!: string; @IsString() @MinLength(10) password!: string; @IsString() name!: string; }
class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }
class RefreshDto { @IsString() refreshToken!: string; }

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  private setRefreshCookie(res: Response, tok: string) {
    res.cookie('ss_refresh', tok, {
      httpOnly: true, sameSite: 'lax', secure: (process.env.NODE_ENV || '') === 'production',
      maxAge: 14 * 24 * 3600 * 1000, path: '/api/v1/auth',
    });
  }
  @Post('register') async register(@Body() b: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const out = await this.auth.register(b.email, b.password, b.name);
    this.setRefreshCookie(res, out.refreshToken);
    return out;
  }
  @Post('login') async login(@Body() b: LoginDto, @Res({ passthrough: true }) res: Response) {
    const out = await this.auth.login(b.email, b.password);
    this.setRefreshCookie(res, out.refreshToken);
    return out;
  }
  @Post('refresh') async refresh(@Body() b: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tok = b.refreshToken || (req.cookies?.ss_refresh as string);
    const out = await this.auth.refresh(tok);
    this.setRefreshCookie(res, out.refreshToken);
    return out;
  }
  @Post('logout') async logout(@Body() b: RefreshDto, @Req() req: Request) {
    const tok = b.refreshToken || (req.cookies?.ss_refresh as string);
    if (tok) await this.auth.logout(tok);
    return { ok: true };
  }
  @Get('me') async me(@Req() req: Request) {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return { user: null };
    try {
      const [, payload] = h.slice(7).split('.');
