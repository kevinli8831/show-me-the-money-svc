import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
// import { AppleStrategy } from './strategies/apple.strategy';
import { MemberTokenGuard } from './guards/member-token.guard';

@Module({
  imports: [
    PassportModule,
    HttpModule,
    JwtModule.register({}),
    ConfigModule,
    DrizzleModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    // AppleStrategy,
    MemberTokenGuard,
  ],
  exports: [AuthService, MemberTokenGuard],
})
export class AuthModule { }
