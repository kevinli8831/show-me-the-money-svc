import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GoogleOAuthGuard } from '../src/auth/guards/google-oauth.guard';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from '../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockUser = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    picture: 'http://example.com/photo.jpg',
    accessToken: 'mock_access_token',
  };

  beforeEach(async () => {

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(GoogleOAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser; // Simulate strategy returning user
          return true;
        },
      })
      .overrideProvider(AuthService)
      .useValue({
        login: jest.fn().mockResolvedValue({
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
          user: mockUser,
        }),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === 'GOOGLE_CLIENT_ID') return 'mock_client_id';
          if (key === 'GOOGLE_CLIENT_SECRET') return 'mock_client_secret';
          if (key === 'GOOGLE_CALLBACK_URL') return 'http://localhost:3000/auth/google/callback';
          if (key === 'JWT_ACCESS_SECRET') return 'mock_jwt_secret';
          if (key === 'JWT_REFRESH_SECRET') return 'mock_refresh_secret';
          if (key === 'DATABASE_URL') return 'postgres://user:pass@localhost:5432/db';
          return null;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.skip('/auth/google/callback (GET)', () => {
    return request(app.getHttpServer())
      .get('/auth/google/callback')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', 'Login successful');
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user).toHaveProperty('email', mockUser.email);
      });
  });
});
