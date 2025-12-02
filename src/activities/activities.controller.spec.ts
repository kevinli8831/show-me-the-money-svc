import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberTokenGuard } from '../auth/guards/member-token.guard';
import { OptionalJwtGuard } from '../auth/guards/auth.guard';

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

describe('ActivitiesController', () => {
  let controller: ActivitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        { provide: ActivitiesService, useValue: mockActivitiesService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MemberTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByShareCode', () => {
    it('should return a activity', async () => {
      const mockActivity = { id: 1, name: 'Test Activity', shareCode: 'ABCD1234' };
      mockActivitiesService.findByShareCode.mockResolvedValue(mockActivity);

      const result = await controller.findByShareCode('ABCD1234');
      expect(result).toEqual(mockActivity);
      expect(mockActivitiesService.findByShareCode).toHaveBeenCalledWith('ABCD1234', []);
    });

    it('should pass include options', async () => {
      const mockActivity = { id: 1, name: 'Test Activity', shareCode: 'ABCD1234' };
      mockActivitiesService.findByShareCode.mockResolvedValue(mockActivity);

      await controller.findByShareCode('ABCD1234', 'members,expenses');
      expect(mockActivitiesService.findByShareCode).toHaveBeenCalledWith('ABCD1234', ['members', 'expenses']);
    });
  });
});
