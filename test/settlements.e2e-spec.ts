import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateSettlementDto } from '../src/settlements/dto/create-settlement.dto';
import { CreateActivityDto } from '../src/activities/dto/create-activity.dto';

describe('SettlementsController (e2e)', () => {
  let app: INestApplication;
  let user1Id: number;
  let user2Id: number;
  let activityId: number;
  let payerToken: string;
  let receiverToken: string; // Creator
  let createdSettlementId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 1. Create Users
    const u1 = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'User 1', email: `u1-${Date.now()}@example.com` });
    user1Id = u1.body.data.id;

    const u2 = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'User 2', email: `u2-${Date.now()}@example.com` });
    user2Id = u2.body.data.id;

    // 2. Create Activity (User 1 is creator)
    const createActivityDto: CreateActivityDto = {
      name: 'Settlement Activity',
      creatorUserId: user1Id
    };
    const activity = await request(app.getHttpServer())
      .post('/activities')
      .send(createActivityDto)
      .expect(201);
    activityId = activity.body.data.activity.id;
    receiverToken = activity.body.data.member.memberToken;

    // 3. Add User 2 to Activity -> Get Payer Token
    // API returns { message: 'Member added successfully' }, doesn't return member token/object directly?
    // ActivitiesService.addMember returns { message: ... }.
    // So we must fetch members to get the token.
    await request(app.getHttpServer())
      .post(`/activities/${activityId}/members`)
      .send({ userId: user2Id })
      .expect(201);

    // Fetch members to find token for User 2
    const activityWithMembers = await request(app.getHttpServer())
      .get(`/activities/${activityId}?include=members`);

    const members = activityWithMembers.body.data.members;
    const payerMember = members.find((m: any) => m.userId === user2Id);
    payerToken = payerMember.memberToken;
  });

  afterAll(async () => {
    if (activityId && receiverToken) {
      await request(app.getHttpServer())
        .delete(`/activities/${activityId}`)
        .set('x-member-token', receiverToken)
        .expect(200);
    }
    if (user1Id) await request(app.getHttpServer()).delete(`/users/${user1Id}`);
    if (user2Id) await request(app.getHttpServer()).delete(`/users/${user2Id}`);
    await app.close();
  });

  it('/settlements (POST) - Create Settlement', async () => {
    const createSettlementDto: CreateSettlementDto = {
      activityId: activityId,
      payerToken: payerToken,
      receiverToken: receiverToken,
      amount: '50.00',
      description: 'Test Settlement',
    };

    const response = await request(app.getHttpServer())
      .post('/settlements')
      .send(createSettlementDto)
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.amount).toBe(createSettlementDto.amount);
    createdSettlementId = response.body.data.id;
  });

  it('/settlements (GET) - Get All Settlements', async () => {
    const response = await request(app.getHttpServer())
      .get('/settlements')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('/settlements/:id (GET) - Get One Settlement', async () => {
    const response = await request(app.getHttpServer())
      .get(`/settlements/${createdSettlementId}`)
      .expect(200);

    expect(response.body.data.id).toBe(createdSettlementId);
  });

  it('/settlements/:id (GET) - Get One Settlement (Not Found)', async () => {
    await request(app.getHttpServer())
      .get('/settlements/999999')
      .expect(404);
  });

  it('/settlements/:id (PATCH) - Update Settlement', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/settlements/${createdSettlementId}`)
      .send({ amount: '60.00' })
      .expect(200);

    expect(response.body.data.amount).toBe('60.00');
  });

  it('/settlements/:id (PATCH) - Update Settlement (Not Found)', async () => {
    await request(app.getHttpServer())
      .patch('/settlements/999999')
      .send({ amount: '100.00' })
      .expect(404);
  });

  it('/settlements/:id (DELETE) - Delete Settlement', async () => {
    await request(app.getHttpServer())
      .delete(`/settlements/${createdSettlementId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/settlements/${createdSettlementId}`)
      .expect(404);
  });

  it('/settlements/:id (DELETE) - Delete Settlement (Not Found)', async () => {
    await request(app.getHttpServer())
      .delete('/settlements/999999')
      .expect(404);
  });
});
