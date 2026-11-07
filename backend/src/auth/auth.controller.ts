import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { changePasswordSchema, loginSchema, type ChangePasswordDto, type LoginDto } from './auth.dto.js';
import type { AuthUser } from './auth-user.js';

const COOKIE = 'rcs_rt';
const COOKIE_PATH = '/api/auth';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Tokens = { accessToken: string; refreshToken: string; expiresIn: number; user: AuthUser | null };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: Number(process.env.LOGIN_RATE_LIMIT ?? 10), ttl: 60_000 } }) // per IP
  async login(@Body({ schema: loginSchema }) body: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.login(body.accountNumber, body.password));
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[COOKIE];
    if (!token) throw new UnauthorizedException('Not signed in');
    try {
      return this.respond(res, await this.auth.refresh(token));
    } catch (err) {
      res.clearCookie(COOKIE, { path: COOKIE_PATH });
      throw err;
    }
  }

  @Post('logout')
  @Public()
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[COOKIE]);
    res.clearCookie(COOKIE, { path: COOKIE_PATH });
  }

  @Get('me')
  @Can.Anyone()
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Post('change-password')
  @Can.Anyone()
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body({ schema: changePasswordSchema }) body: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.changePassword(user, body.currentPassword, body.newPassword));
  }

  // The refresh token only ever travels in an httpOnly cookie; the body carries the short-lived access token.
  private respond(res: Response, { refreshToken, ...rest }: Tokens) {
    res.cookie(COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      // Secure cookies need HTTPS (or localhost). COOKIE_SECURE=false only for a trusted LAN without HTTPS.
      secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
      path: COOKIE_PATH,
      maxAge: REFRESH_TTL_MS,
    });
    return rest;
  }
}
