import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreatePaymentDto } from '../src/payments/dto/create-payment.dto';

describe('PaymentsController (e2e)', () => {
  let app: INestApplication;
  let user1Id: number;
  let user2Id: number;
  let tripId: number;
  let createdPaymentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create Users
    const u1 = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'User 1', email: `u1-${Date.now()}@example.com` });
    user1Id = u1.body.id;

    const u2 = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'User 2', email: `u2-${Date.now()}@example.com` });
    user2Id = u2.body.id;

    // Create Trip
    const trip = await request(app.getHttpServer())
      .post('/trips')
      .send({ name: 'Payment Trip', creatorUserId: user1Id });
    tripId = trip.body.id;
  });

  afterAll(async () => {
    if (tripId) await request(app.getHttpServer()).delete(`/trips/${tripId}`);
    if (user1Id) await request(app.getHttpServer()).delete(`/users/${user1Id}`);
    if (user2Id) await request(app.getHttpServer()).delete(`/users/${user2Id}`);
    await app.close();
  });

  it('/payments (POST) - Create Payment', async () => {
    const createPaymentDto: CreatePaymentDto = {
      tripId: tripId,
      fromUserId: user1Id,
      toUserId: user2Id,
      amount: '50.00',
      currency: 'HKD',
    };

    const response = await request(app.getHttpServer())
      .post('/payments')
      .send(createPaymentDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.amount).toBe(createPaymentDto.amount);
    createdPaymentId = response.body.id;
  });

  it('/payments (GET) - Get All Payments', async () => {
    const response = await request(app.getHttpServer())
      .get('/payments')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/payments/:id (GET) - Get One Payment', async () => {
    const response = await request(app.getHttpServer())
      .get(`/payments/${createdPaymentId}`)
      .expect(200);

    expect(response.body.id).toBe(createdPaymentId);
  });

  it('/payments/:id (GET) - Get One Payment (Not Found)', async () => {
    await request(app.getHttpServer())
      .get('/payments/999999')
      .expect(404);
  });

  it('/payments/:id (PATCH) - Update Payment', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/payments/${createdPaymentId}`)
      .send({ amount: '60.00' })
      .expect(200);

    expect(response.body.amount).toBe('60.00');
  });

  it('/payments/:id (PATCH) - Update Payment (Not Found)', async () => {
    await request(app.getHttpServer())
      .patch('/payments/999999')
      .send({ amount: '100.00' })
      .expect(404);
  });

  it('/payments/:id (DELETE) - Delete Payment', async () => {
    await request(app.getHttpServer())
      .delete(`/payments/${createdPaymentId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/payments/${createdPaymentId}`)
      .expect(404);
  });

  it('/payments/:id (DELETE) - Delete Payment (Not Found)', async () => {
    await request(app.getHttpServer())
      .delete('/payments/999999')
      .expect(404);
  });
});
