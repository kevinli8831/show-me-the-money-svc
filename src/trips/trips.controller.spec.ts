import { Test, TestingModule } from '@nestjs/testing';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberTokenGuard } from '../auth/guards/member-token.guard';
import { OptionalJwtGuard } from '../auth/guards/auth.guard';

const mockTripsService = {
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

describe('TripsController', () => {
  let controller: TripsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        { provide: TripsService, useValue: mockTripsService },
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

    controller = module.get<TripsController>(TripsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByShareCode', () => {
    it('should return a trip', async () => {
      const mockTrip = { id: 1, name: 'Test Trip', shareCode: 'ABCD1234' };
      mockTripsService.findByShareCode.mockResolvedValue(mockTrip);

      const result = await controller.findByShareCode('ABCD1234');
      expect(result).toEqual(mockTrip);
      expect(mockTripsService.findByShareCode).toHaveBeenCalledWith('ABCD1234', []);
    });

    it('should pass include options', async () => {
      const mockTrip = { id: 1, name: 'Test Trip', shareCode: 'ABCD1234' };
      mockTripsService.findByShareCode.mockResolvedValue(mockTrip);

      await controller.findByShareCode('ABCD1234', 'members,expenses');
      expect(mockTripsService.findByShareCode).toHaveBeenCalledWith('ABCD1234', ['members', 'expenses']);
    });
  });
});
