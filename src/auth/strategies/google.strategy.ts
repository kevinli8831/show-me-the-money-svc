import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    /**
     * Google Strategy 設定
     * 
     * clientID/clientSecret: 係 Google Cloud Console 申請嘅。
     * callbackURL: Google Login 完之後會 Redirect 返黎呢個 URL。
     * scope: 請求 User 俾我地存取咩資料 (email, profile)。
     */
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    } as any);
  }

  /**
   * Validate Callback
   * 
   * 當 Google 驗證成功，會 Call 呢個 function。
   * profile: Google 俾我地嘅 User 資料。
   * done: Passport 嘅 callback function。
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Call AuthService 去處理 User (Create or Get)
    const user = await this.authService.validateOAuthUser(profile, 'google');
    done(null, user);
  }
}
