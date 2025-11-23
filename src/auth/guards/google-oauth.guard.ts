import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * 
 * 繼承自 NestJS 嘅 AuthGuard('google')。
 * 
 * 用途：
 * 1. 放在 /auth/google 上：自動 Redirect 去 Google Login Page。
 * 2. 放在 /auth/google/callback 上：自動處理 Google Redirect 返黎嘅 Code，
 *    並 Call GoogleStrategy.validate()。
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor() {
    super({
      accessType: 'offline',
    });
  }
}
