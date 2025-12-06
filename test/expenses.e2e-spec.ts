import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateExpenseDto } from '../src/expenses/dto/create-expense.dto';
import { CreateActivityDto } from '../src/activities/dto/create-activity.dto';

describe('ExpensesController (e2e)', () => {
  let app: INestApplication;
  let user1Id: number;
  let activityId: number;
  let memberToken: string;
  let createdExpenseId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 1. Create User
    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Expense User', email: `expense-user-${Date.now()}@example.com` })
      .expect(201);
    user1Id = userRes.body.data.id;

    // 2. Create Activity
    const createActivityDto: CreateActivityDto = {
      name: 'Expense Activity',
      creatorUserId: user1Id
    };

    const activityRes = await request(app.getHttpServer())
      .post('/activities')
      .send(createActivityDto)
      .expect(201);

    activityId = activityRes.body.data.activity.id;
    memberToken = activityRes.body.data.member.memberToken;
  });

  afterAll(async () => {
    if (activityId && memberToken) {
      await request(app.getHttpServer())
        .delete(`/activities/${activityId}`)
        .set('x-member-token', memberToken)
        .expect(200);
    }
    if (user1Id) await request(app.getHttpServer()).delete(`/users/${user1Id}`);
    await app.close();
  });

  it('/expenses (POST) - Create Expense', async () => {
    const createExpenseDto: CreateExpenseDto = {
      activityId: activityId,
      description: 'Lunch',
      totalAmount: '150.00',
      currency: 'HKD',
      createdByToken: memberToken,
      participants: [
        {
          memberToken: memberToken,
          paidAmount: '150.00',
          owedAmount: '150.00',
        }
      ]
    };

    const response = await request(app.getHttpServer())
      .post('/expenses')
      .send(createExpenseDto)
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.description).toBe(createExpenseDto.description);
    expect(response.body.data.totalAmount).toBe(createExpenseDto.totalAmount);
    createdExpenseId = response.body.data.id;
  });

  it('/expenses (GET) - Get All Expenses', async () => {
    const response = await request(app.getHttpServer())
      .get('/expenses')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('/expenses/:id (GET) - Get One Expense', async () => {
    const response = await request(app.getHttpServer())
      .get(`/expenses/${createdExpenseId}`)
      .expect(200);

    expect(response.body.data.id).toBe(createdExpenseId);
  });

  it('/expenses/:id (GET) - Get One Expense (Not Found)', async () => {
    await request(app.getHttpServer())
      .get('/expenses/999999')
      .expect(404);
  });

  it('/expenses/:id (PATCH) - Update Expense', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/expenses/${createdExpenseId}`)
      .set('x-member-token', memberToken)
      .send({ description: 'Dinner' })
      .expect(200);

    expect(response.body.data.description).toBe('Dinner');
  });

  it('/expenses/:id (PATCH) - Update Expense (Not Found)', async () => {
    await request(app.getHttpServer())
      .patch('/expenses/999999')
      .send({ description: 'Ghost' })
      .expect(404);
  });

  it('/expenses/:id (DELETE) - Delete Expense', async () => {
    await request(app.getHttpServer())
      .delete(`/expenses/${createdExpenseId}`)
      .set('x-member-token', memberToken)
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
