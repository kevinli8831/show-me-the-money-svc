import { Controller, Get, Req, UseGuards, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
// import { AppleOAuthGuard } from './guards/apple-oauth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private configService: ConfigService
  ) { }

  /**
   * Google Login 入口
   *
   * 當 User 訪問呢個 URL (GET /auth/google)，
   * GoogleOAuthGuard 會自動 Redirect User 去 Google 嘅 Login Page。
   */
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() req) {
    // Guard 會搞掂 Redirect，呢度唔洗寫 code
  }

  /**
   * Google Login Callback
   *
   * 當 User 係 Google Login 完，Google 會 Redirect 返黎呢個 URL。
   * GoogleOAuthGuard 會再次介入，拎 Google 俾嘅 Code 去換 User Profile。
   * 成功後，req.user 就會有 User 嘅資料。
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    // 1. 用 Google 俾嘅 User 資料 (req.user) 去做 Login
    const { accessToken, refreshToken, user } = await this.authService.login(req.user);

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:8081';

    const redirectUrl = `${frontendUrl}/auth/callback` +
      `?accessToken=${encodeURIComponent(accessToken)}` +
      `&refreshToken=${encodeURIComponent(refreshToken)}` +
      `&userId=${encodeURIComponent(user.id)}`;   // 如有需要可以把 user 資訊一起傳
    // 2. Redirect俾 Frontend (包括 Tokens)
    res.redirect(redirectUrl);
  }

  // ... Apple endpoints (commented out) ...
  // @Get('apple')
  // @UseGuards(AppleOAuthGuard)
  // async appleAuth(@Req() req) {
  //   // Guard redirects to Apple
  // }

  // @Post('apple/callback')
  // @UseGuards(AppleOAuthGuard)
  // async appleAuthRedirect(@Req() req, @Res() res) {
  //   const { accessToken, refreshToken, user } = await this.authService.login(req.user);
  //   res.json({
  //     message: 'Login successful',
  //     accessToken,
  //     refreshToken,
  //     user,
  //   });
  // }

  /**
   * Refresh Token
   *
   * 當 Access Token 過期 (e.g. 1日後)，Frontend 可以用 Refresh Token (有效期1年)
   * Call 呢個 API 黎換取一個新嘅 Access Token，唔洗 User 重新 Login。
   */
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(@Req() req) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refresh(userId, refreshToken);
  }

  /**
   * Logout
   *
   * 清除 Database 入面嘅 Refresh Token，令到 User 之後無得再用舊 Token refresh。
   * 強制 User 下次要重新 Login。
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req) {
    const userId = req.user['userId']; // JwtStrategy return userId
    await this.authService.logout(userId);
    return { message: 'Logout successful' };
  }
}
