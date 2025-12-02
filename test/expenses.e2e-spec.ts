import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateExpenseDto } from '../src/expenses/dto/create-expense.dto';

describe('ExpensesController (e2e)', () => {
  let app: INestApplication;
  let userId: number;
  let activityId: number;
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

    // Create Activity
    const activityRes = await request(app.getHttpServer())
      .post('/activities')
      .send({ name: 'Expense Activity', creatorUserId: userId })
      .expect(201);
    activityId = activityRes.body.id;
  });

  afterAll(async () => {
    if (activityId) await request(app.getHttpServer()).delete(`/activities/${activityId}`);
    if (userId) await request(app.getHttpServer()).delete(`/users/${userId}`);
    await app.close();
  });

  it('/expenses (POST) - Create Expense', async () => {
    const createExpenseDto: CreateExpenseDto = {
      activityId: activityId,
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

  it('/expenses/:id (GET) - Get One Expense (Not Found)', async () => {
    await request(app.getHttpServer())
      .get('/expenses/999999')
      .expect(404);
  });

  it('/expenses/:id (PATCH) - Update Expense', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/expenses/${createdExpenseId}`)
      .send({ title: 'Dinner' })
      .expect(200);

    expect(response.body.title).toBe('Dinner');
  });

  it('/expenses/:id (PATCH) - Update Expense (Not Found)', async () => {
    await request(app.getHttpServer())
      .patch('/expenses/999999')
      .send({ title: 'Ghost' })
      .expect(404);
  });

  it('/expenses/:id (DELETE) - Delete Expense', async () => {
    await request(app.getHttpServer())
      .delete(`/expenses/${createdExpenseId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/expenses/${createdExpenseId}`)
      .expect(404);
  });

  it('/expenses/:id (DELETE) - Delete Expense (Not Found)', async () => {
    await request(app.getHttpServer())
      .delete('/expenses/999999')
      .expect(404);
  });
});
