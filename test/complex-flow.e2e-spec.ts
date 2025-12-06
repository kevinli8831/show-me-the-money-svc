import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateActivityDto } from 'src/activities/dto/create-activity.dto';
import { CreateExpenseDto } from 'src/expenses/dto/create-expense.dto';

describe('Complex Flow (e2e) - Activity Lifecycle', () => {
  let app: INestApplication;

  // Test Data
  let userAId: number;
  let userBId: number;
  let activityId: number;
  let creatorToken: string; // User A's token
  let memberTokenB: string; // User B's token
  let expenseId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    // Teardown: Delete Activity (Cascades to Members and Expenses)
    if (activityId && creatorToken) {
      await request(app.getHttpServer())
        .delete(`/activities/${activityId}`)
        .set('x-member-token', creatorToken)
        .expect(200);
    }
    // Delete Users
    if (userAId) await request(app.getHttpServer()).delete(`/users/${userAId}`);
    if (userBId) await request(app.getHttpServer()).delete(`/users/${userBId}`);

    await app.close();
  });

  it('1. Create Users A and B', async () => {
    // Create User A
    const resA = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'User A',
        email: `user-a-${Date.now()}@test.com`,
      })
      .expect(201);
    userAId = resA.body.data.id;

    // Create User B
    const resB = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'User B',
        email: `user-b-${Date.now()}@test.com`,
      })
      .expect(201);
    userBId = resB.body.data.id;
  });

  it('2. User A creates Activity', async () => {
    const createActivityDto: CreateActivityDto = {
      name: 'Kyoto Trip',
      description: 'Complex Flow Test Trip',
      creatorUserId: userAId,
    };

    const response = await request(app.getHttpServer())
      .post('/activities')
      .send(createActivityDto)
      .expect(201);

    activityId = response.body.data.activity.id;
    creatorToken = response.body.data.member.memberToken; // User A's token

    expect(response.body.data.activity.name).toBe('Kyoto Trip');
    expect(creatorToken).toBeDefined();
  });

  it('3. Add User B to Activity', async () => {
    // Add User B
    await request(app.getHttpServer())
      .post(`/activities/${activityId}/members`)
      .send({ userId: userBId })
      .expect(201);

    // Fetch members to get User B's token
    const activityWithMembers = await request(app.getHttpServer())
      .get(`/activities/${activityId}?include=members`)
      .expect(200);

    const members = activityWithMembers.body.data.members;
    const memberB = members.find((m: any) => m.userId === userBId);

    expect(memberB).toBeDefined();
    memberTokenB = memberB.memberToken;
    expect(memberTokenB).toBeDefined();
  });

  it('4. User A creates an Expense (Dinner)', async () => {
    // Scenario: Dinner cost 300. User A pays 300.
    // Split: A pays 150 (owed), B pays 150 (owed).
    // Technically:
    // A: Paid 300, Owed 150 -> Net +150
    // B: Paid 0, Owed 150 -> Net -150

    const createExpenseDto: CreateExpenseDto = {
      activityId,
      description: 'Dinner',
      totalAmount: '300.00',
      currency: 'HKD',
      createdByToken: creatorToken,
      participants: [
        {
          memberToken: creatorToken,
          paidAmount: '300.00', // A paid everything
          owedAmount: '150.00', // A's share
        },
        {
          memberToken: memberTokenB,
          paidAmount: '0.00',   // B paid nothing
          owedAmount: '150.00', // B's share
        }
      ]
    };

    const response = await request(app.getHttpServer())
      .post('/expenses')
      .send(createExpenseDto)
      .expect(201);

    expenseId = response.body.data.id;
    expect(response.body.data.totalAmount).toBe('300.00');
    expect(response.body.data.description).toBe('Dinner');
  });

  it('5. Verify Expense Participants', async () => {
    const response = await request(app.getHttpServer())
      .get(`/expenses/${expenseId}`)
      .expect(200);

    const participants = response.body.data.participants;
    expect(participants.length).toBe(2);

    const partA = participants.find((p: any) => p.memberToken === creatorToken);
    const partB = participants.find((p: any) => p.memberToken === memberTokenB);

    // Check A
    expect(parseFloat(partA.paidAmount)).toBe(300.00);
    expect(parseFloat(partA.owedAmount)).toBe(150.00);

    // Check B
    expect(parseFloat(partB.paidAmount)).toBe(0.00);
    expect(parseFloat(partB.owedAmount)).toBe(150.00);
  });

  it('6. Verify Activity includes Expenses', async () => {
    const response = await request(app.getHttpServer())
      .get(`/activities/${activityId}?include=expenses`)
      .expect(200);

    const expenses = response.body.data.expenses;
    expect(expenses.length).toBeGreaterThan(0);

    const dinnerExpense = expenses.find((e: any) => e.id === expenseId);
    expect(dinnerExpense).toBeDefined();
    expect(parseFloat(dinnerExpense.totalAmount)).toBe(300.00);
  });
});
