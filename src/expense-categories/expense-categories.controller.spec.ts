import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ExpenseCategoriesController', () => {
  let controller: ExpenseCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseCategoriesController],
      providers: [
        {
          provide: ExpenseCategoriesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ExpenseCategoriesController>(ExpenseCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
