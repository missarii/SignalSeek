import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

class RegisterDto { @IsEmail() email!: string; @IsString() @MinLength(10) password!: string; @IsString() name!: string; }
class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }
class RefreshDto { @IsString() refreshToken!: string; }

@Controller('auth')
