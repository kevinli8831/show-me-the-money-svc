import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseCategoriesService } from './expense-categories.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';

const mockDb = {
  // Add methods as needed
};

describe('ExpenseCategoriesService', () => {
  let service: ExpenseCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseCategoriesService,
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ExpenseCategoriesService>(ExpenseCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
