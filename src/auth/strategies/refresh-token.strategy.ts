import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    /**
     * Refresh Token Strategy 設定
     *
     * passReqToCallback: true -> 令到 validate function 可以拎到 req object。
     * 因為我地需要拎返個 raw refresh token string 去同 database 做對比。
     */
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_REFRESH_SECRET') || 'secret',
      passReqToCallback: true,
    });
  }

  /**
   * Validate
   *
   * 除了 decode payload 之外，我地仲將個 raw refresh token 放入去 req.user。
   * 方便之後 AuthService.refresh() 用黎做 security check。
   */
  validate(req: Request, payload: any) {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    return { ...payload, refreshToken };
  }
}
