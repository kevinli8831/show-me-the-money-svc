import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Virtual Members (e2e)', () => {
  let app: INestApplication;
  let createdTripId: number;
  let createdVirtualUserId: number;
  let createdRealUserId: number;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Virtual Member Flow', () => {
    it('should create a real user first', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Alice',
          email: 'alice@example.com',
        })
        .expect(201);

      createdRealUserId = response.body.id;
      expect(response.body.name).toBe('Alice');
      expect(response.body.userType).toBe('email');
    });

    it('should create a trip', async () => {
      const response = await request(app.getHttpServer())
        .post('/trips')
        .send({
          name: '日本旅行',
          description: '東京大阪之旅',
          startDate: '2025-12-01',
          endDate: '2025-12-07',
          creatorUserId: createdRealUserId,
        })
        .expect(201);

      createdTripId = response.body.id;
      expect(response.body.name).toBe('日本旅行');
    });

    it('should create a virtual member', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Kevin',
          userType: 'virtual',
          createdBy: createdRealUserId,
        })
        .expect(201);

      createdVirtualUserId = response.body.id;
      expect(response.body.name).toBe('Kevin');
      expect(response.body.userType).toBe('virtual');
      expect(response.body.email).toBeNull();
      expect(response.body.provider).toBeNull();
    });

    it('should add virtual member to trip', async () => {
      const response = await request(app.getHttpServer())
        .post(`/trips/${createdTripId}/members`)
        .send({
          userId: createdVirtualUserId,
        })
        .expect(201);

      expect(response.body.message).toBe('Member added successfully');
    });

    it('should get trip with members using include parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/trips/${createdTripId}?include=members`)
        .expect(200);

      expect(response.body.id).toBe(createdTripId);
      expect(response.body.members).toBeDefined();
      expect(Array.isArray(response.body.members)).toBe(true);
      expect(response.body.members.length).toBeGreaterThan(0);

      // Should have both real user and virtual user
      const virtualMember = response.body.members.find(
        (m: any) => m.userId === createdVirtualUserId,
      );
      expect(virtualMember).toBeDefined();
      expect(virtualMember.userName).toBe('Kevin');
    });

    it('should get trip without members when include is not specified', async () => {
      const response = await request(app.getHttpServer())
        .get(`/trips/${createdTripId}`)
        .expect(200);

      expect(response.body.id).toBe(createdTripId);
      expect(response.body.members).toBeUndefined();
    });

    it('should get all trips with members using include parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/trips?include=members')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const trip = response.body.find((t: any) => t.id === createdTripId);
      expect(trip).toBeDefined();
      expect(trip.members).toBeDefined();
      expect(Array.isArray(trip.members)).toBe(true);
    });

    // Note: Claim endpoint requires JWT authentication
    // This test would need to be updated with proper auth token
    it.skip('should claim virtual member (requires auth)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/trips/${createdTripId}/members/claim`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          virtualUserId: createdVirtualUserId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    // Cleanup
    it('should delete the trip', async () => {
      await request(app.getHttpServer())
        .delete(`/trips/${createdTripId}`)
        .expect(200);
    });

    it('should delete the virtual user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdVirtualUserId}`)
        .expect(200);
    });

    it('should delete the real user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdRealUserId}`)
        .expect(200);
    });
  });
});
