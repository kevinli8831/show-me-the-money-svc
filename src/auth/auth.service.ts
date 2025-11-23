import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as schema from '../drizzle/schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: NeonHttpDatabase<typeof schema>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
