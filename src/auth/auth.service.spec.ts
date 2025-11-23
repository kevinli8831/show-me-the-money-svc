import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_token'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock dependencies
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_token'),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JWT_ACCESS_EXPIRES_IN') return '1d';
    if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
    return null;
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateOAuthUser', () => {
    const mockProfile = {
      id: '12345',
      emails: [{ value: 'test@example.com' }],
      displayName: 'Test User',
      photos: [{ value: 'photo.jpg' }],
    };

    it('should return existing user if found', async () => {
      const existingUser = { id: 1, email: 'test@example.com', providerId: '12345' };
      mockDb.where.mockResolvedValueOnce([existingUser]); // Mock findFirst result

      const result = await service.validateOAuthUser(mockProfile, 'google');
      expect(result).toEqual(existingUser);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should create and return new user if not found', async () => {
      mockDb.where.mockResolvedValueOnce([]); // Mock findFirst result (empty)
      const newUser = { ...mockProfile, id: 1 };
      mockDb.returning.mockResolvedValueOnce([newUser]); // Mock insert result

      const result = await service.validateOAuthUser(mockProfile, 'google');
      expect(result).toEqual(newUser);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user = { id: 1, email: 'test@example.com' };
      mockDb.returning.mockResolvedValueOnce([{ ...user, refreshToken: 'hashed_token' }]);
      const result = await service.login(user);

      expect(result).toHaveProperty('accessToken', 'mock_token');
      expect(result).toHaveProperty('refreshToken', 'mock_token');
      expect(result).toHaveProperty('user');
      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
