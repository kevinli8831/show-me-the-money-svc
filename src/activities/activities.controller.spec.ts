import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';

// Mock dependencies
const mockActivitiesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addMember: jest.fn(),
  removeMember: jest.fn(),
  join: jest.fn(),
  findByShareCode: jest.fn(),
};

const mockUsersService = {
  claimVirtualUser: jest.fn(),
  claimGuestMember: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('ActivitiesController', () => {
  let controller: ActivitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DrizzleAsyncProvider,
          useValue: {}, // Mock empty object as we don't use it directly in controller tests but guards might need it
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with array of tokens', async () => {
      const memberTokens = ['mt-1', 'mt-2'];
      mockActivitiesService.findAll.mockResolvedValue([]);

      await controller.findAll(undefined, memberTokens);

      expect(mockActivitiesService.findAll).toHaveBeenCalledWith([], memberTokens);
    });

    it('should call service.findAll with single token', async () => {
      const memberToken = 'mt-1';
      mockActivitiesService.findAll.mockResolvedValue([]);

      await controller.findAll(undefined, memberToken);

      expect(mockActivitiesService.findAll).toHaveBeenCalledWith([], memberToken);
    });
  });
});
