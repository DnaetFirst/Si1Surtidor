import { Body, Controller, Get, HttpCode, HttpException, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Request, Response } from 'express';
import { AuthService } from '../application/service';
import { Public } from './decorators';
import { CsrfGuard } from './guards';
import { AuthRequest, SessionUser } from './types';
class LoginDto {
    @ApiProperty({ format: 'email', example: 'usuario@example.com' })
    @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
    @MaxLength(100)
    correo!: string;
    @ApiProperty({ format: 'password', maxLength: 128 })
    @IsString()
    @MinLength(1)
    @MaxLength(128)
    contrasena!: string;
}
@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
    private readonly attempts = new Map<string, {
        total: number;
        until: number;
    }>();
    constructor(private readonly auth: AuthService, private readonly csrf: CsrfGuard) { }
    private cookies(res: Response, result: {
        access: string;
        refresh: string;
        expiresAt: Date;
    }) {
        const base = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.COOKIE_SECURE === 'true', path: '/' };
        res.cookie('access_token', result.access, { ...base, maxAge: 15 * 60 * 1000 });
        res.cookie('refresh_token', result.refresh, { ...base, expires: result.expiresAt });
    }
    @Public()
    @Get('csrf')
    @ApiOperation({ summary: 'Obtener token CSRF para formularios' })
    token(
    @Req()
    req: Request,
    @Res({ passthrough: true })
    res: Response) { return { csrfToken: this.csrf.issue(req, res) }; }
    @Public()
    @Post('login')
    @HttpCode(200)
    async login(
    @Body()
    dto: LoginDto,
    @Req()
    req: Request,
    @Res({ passthrough: true })
    res: Response) {
        const now = Date.now();
        for (const [key, value] of this.attempts)
            if (value.until < now)
                this.attempts.delete(key);
        const key = req.ip ?? 'unknown';
        const rate = this.attempts.get(key) ?? { total: 0, until: now + 15 * 60 * 1000 };
        this.attempts.set(key, rate);
        if (++rate.total > 100)
            throw new HttpException('Demasiados intentos. Intenta más tarde.', 429);
        const result = await this.auth.login(dto.correo, dto.contrasena, req);
        this.cookies(res, result);
        return { user: result.user };
    }
    @Get('me')
    me(
    @Req()
    req: AuthRequest): {
        user: SessionUser;
    } { return { user: req.user }; }
    @Public()
    @Post('refresh')
    @HttpCode(200)
    async refresh(
    @Req()
    req: Request,
    @Res({ passthrough: true })
    res: Response) {
        const result = await this.auth.refresh(req.cookies?.refresh_token);
        this.cookies(res, result);
        return { user: result.user };
    }
    @Public()
    @Post('logout')
    @HttpCode(204)
    async logout(
    @Req()
    req: Request,
    @Res({ passthrough: true })
    res: Response) {
        await this.auth.logout(req, req.cookies?.refresh_token);
        for (const name of ['access_token', 'refresh_token', 'csrf_token'])
            res.clearCookie(name, { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true' });
    }
}
