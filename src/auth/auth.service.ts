import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as schema from '../drizzle/schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: NeonHttpDatabase<typeof schema>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  /**
   * Exchange Google Authorization Code for User Profile
   * 
   * 專為 Mobile App (Expo / React Native) 設計的 Google Login 流程。
   * 
   * 流程：
   * 1. Frontend (App) 使用 `expo-auth-session` 彈出 Google Login 畫面。
   * 2. User 登入後，Google 返回一個 Authorization Code 給 Frontend。
   * 3. Frontend 將此 Code 連同 `redirectUri` 和 `codeVerifier` (PKCE) 發送給此 Backend API。
   * 4. Backend 使用這些資料向 Google 換取 Access Token 和 ID Token。
   * 5. Backend 解析 ID Token 取得 User Profile，並完成登入/註冊。
   * 
   * @param code Google Authorization Code
   * @param redirectUri Frontend 使用的 Redirect URI (必須與 Frontend 一致)
   * @param codeVerifier PKCE 驗證碼 (必須與 Frontend 生成的一致)
   */
  async exchangeCodeForUser(code: string, redirectUri?: string, codeVerifier?: string) {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID').trim();
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET').trim();

    // Use provided redirectUri or fallback to env
    const finalRedirectUri = redirectUri || this.configService.get('GOOGLE_CALLBACK_URL').trim();

    console.log('Client ID:', clientId);
    console.log('Client Secret length:', clientSecret?.length);
    console.log('Redirect URI:', finalRedirectUri);
    console.log('Code Verifier:', codeVerifier);

    if (!clientSecret || !clientId) {
      throw new Error('Missing client credentials in env');
    }

    const params: any = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: finalRedirectUri,
      grant_type: 'authorization_code',
    };

    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }

    try {
      const tokenRes = await firstValueFrom(
        this.httpService.post(
          'https://oauth2.googleapis.com/token',
          new URLSearchParams(params).toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        ),
      );
      const { id_token } = tokenRes.data;

      // Decode ID Token to get user info
      const profile = this.decodeGoogleIdToken(id_token);

      // Validate/Create User
      return this.validateOAuthUser(profile, 'google');
    } catch (error) {
      console.error('Error exchanging Google code:', error.response?.data || error.message);
      throw new UnauthorizedException('Invalid Google Authorization Code');
    }
  }

  private decodeGoogleIdToken(idToken: string) {
    const base64Payload = idToken.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
    const jsonPayload = JSON.parse(payload);

    return {
      id: jsonPayload.sub,
      emails: [{ value: jsonPayload.email }],
      displayName: jsonPayload.name,
      photos: [{ value: jsonPayload.picture }],
    };
  }

  /**
   * 驗證 OAuth User
   * 
   * 當 Google/Apple Login 成功後，會 Call 呢個 function。
   * 1. 檢查 Database 有無呢個 User (by provider & providerId)。
   * 2. 如果有，直接 return 舊 User。
   * 3. 如果無，Create 一個新 User 入 Database。
   */
  async validateOAuthUser(profile: any, provider: 'google' | 'apple') {
    // Check if user exists
    const [existingUser] = await this.db.select().from(schema.users).where(
      and(
        eq(schema.users.provider, provider),
        eq(schema.users.providerId, profile.id),
      ),
    );

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const newUsers = await this.db.insert(schema.users).values({
      email: profile.emails?.[0]?.value,
      name: profile.displayName || profile.name?.givenName || 'New User',
      provider: provider,
      providerId: profile.id,
      avatarUrl: profile.photos?.[0]?.value,
      userType: provider, // 'google' or 'apple'
    }).returning();

    return newUsers[0];
  }

  /**
   * Login (Generate Tokens)
   * 
   * 1. Generate Access Token (短命，1日)。
   * 2. Generate Refresh Token (長命，1年)。
   * 3. 將 Refresh Token Hash 之後存入 Database (安全起見)。
   * 4. Return 兩個 Token 俾 Frontend。
   */
  async login(user: any) {
    const payload = { sub: user.id, email: user.email };

    // 1. Generate Access Token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: '1d',
    });

    // 2. Generate Refresh Token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '365d',
    });

    // 3. Hash Refresh Token & Save to DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.db.update(schema.users)
      .set({ refreshToken: hashedRefreshToken })
      .where(eq(schema.users.id, user.id));

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Refresh Access Token
   * 
   * 當 Frontend 用 Refresh Token 黎換新 Access Token 時 Call。
   * 1. Check User 是否存在。
   * 2. Check User 是否有 Refresh Token。
   * 3. 用 bcrypt 比較 Frontend 俾嘅 Token 同 Database 存嘅 Hash 是否吻合。
   * 4. 如果吻合，Generate 一個新嘅 Access Token。
   */
  async refresh(userId: number, refreshToken: string) {
    const [user] = await this.db.select().from(schema.users).where(
      eq(schema.users.id, userId),
    );

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Access Denied');
    }

    const payload = { sub: user.id, email: user.email };
    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: '1d',
    });

    return {
      accessToken: newAccessToken,
    };
  }

  /**
   * Logout
   * 
   * 將 Database 入面嘅 Refresh Token Set 做 null。
   * 咁樣 User 就無得再用舊 Token refresh，一定要重新 Login。
   */
  async logout(userId: number) {
    await this.db.update(schema.users)
      .set({ refreshToken: null })
      .where(eq(schema.users.id, userId));
  }
}
