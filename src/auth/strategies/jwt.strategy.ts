import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    /**
     * JWT Strategy 設定
     * 
     * jwtFromRequest: 點樣從 Request 拎個 Token (通常係 Header: Authorization: Bearer <Token>)。
     * ignoreExpiration: 是否忽略過期 (false = 過期即刻 Error)。
     * secretOrKey: 用黎驗證簽名嘅 Secret Key (要同 generate 嗰陣一樣)。
     */
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET') || 'secret',
    });
  }

  /**
   * Validate Payload
   * 
   * 當 Token 驗證成功 (簽名啱 + 未過期)，Passport 會 Decode 個 Token 變成 payload。
   * 然後 Call 呢個 function。
   * 
   * Return 嘅野會放入 req.user。
   */
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
