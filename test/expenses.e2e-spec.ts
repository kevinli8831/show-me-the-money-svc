import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateExpenseDto } from '../src/expenses/dto/create-expense.dto';

describe('ExpensesController (e2e)', () => {
  let app: INestApplication;
  let userId: number;
  let tripId: number;
  let createdExpenseId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create User
    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Expense User', email: `expense-user-${Date.now()}@example.com` })
      .expect(201);
    userId = userRes.body.id;

    // Create Trip
    const tripRes = await request(app.getHttpServer())
      .post('/trips')
      .send({ name: 'Expense Trip', creatorUserId: userId })
      .expect(201);
    tripId = tripRes.body.id;
  });

  afterAll(async () => {
    if (tripId) await request(app.getHttpServer()).delete(`/trips/${tripId}`);
    if (userId) await request(app.getHttpServer()).delete(`/users/${userId}`);
    await app.close();
  });

  it('/expenses (POST) - Create Expense', async () => {
    const createExpenseDto: CreateExpenseDto = {
      tripId: tripId,
      title: 'Lunch',
      amount: '150.00',
      createdBy: userId,
      currency: 'HKD',
    };

    const response = await request(app.getHttpServer())
      .post('/expenses')
      .send(createExpenseDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(createExpenseDto.title);
    expect(response.body.amount).toBe(createExpenseDto.amount);
    createdExpenseId = response.body.id;
  });

  it('/expenses (GET) - Get All Expenses', async () => {
    const response = await request(app.getHttpServer())
      .get('/expenses')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/expenses/:id (GET) - Get One Expense', async () => {
    const response = await request(app.getHttpServer())
      .get(`/expenses/${createdExpenseId}`)
      .expect(200);

    expect(response.body.id).toBe(createdExpenseId);
  });

  it('/expenses/:id (PATCH) - Update Expense', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/expenses/${createdExpenseId}`)
      .send({ title: 'Dinner' })
      .expect(200);

    expect(response.body.title).toBe('Dinner');
  });

  it('/expenses/:id (DELETE) - Delete Expense', async () => {
    await request(app.getHttpServer())
      .delete(`/expenses/${createdExpenseId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/expenses/${createdExpenseId}`)
      .then((res) => {
        expect(res.body).toEqual({});
      });
  });
});
