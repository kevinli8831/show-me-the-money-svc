import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Virtual Members (e2e)', () => {
  let app: INestApplication;
  let createdActivityId: number;
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

    it('should create a activity', async () => {
      const response = await request(app.getHttpServer())
        .post('/activities')
        .send({
          name: '日本旅行',
          description: '東京大阪之旅',
          startDate: '2025-12-01',
          endDate: '2025-12-07',
          creatorUserId: createdRealUserId,
        })
        .expect(201);

      createdActivityId = response.body.id;
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

    it('should add virtual member to activity', async () => {
      const response = await request(app.getHttpServer())
        .post(`/activities/${createdActivityId}/members`)
        .send({
          userId: createdVirtualUserId,
        })
        .expect(201);

      expect(response.body.message).toBe('Member added successfully');
    });

    it('should get activity with members using include parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/activities/${createdActivityId}?include=members`)
        .expect(200);

      expect(response.body.id).toBe(createdActivityId);
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

    it('should get activity without members when include is not specified', async () => {
      const response = await request(app.getHttpServer())
        .get(`/activities/${createdActivityId}`)
        .expect(200);

      expect(response.body.id).toBe(createdActivityId);
      expect(response.body.members).toBeUndefined();
    });

    it('should get all activities with members using include parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/activities?include=members')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const activity = response.body.find((t: any) => t.id === createdActivityId);
      expect(activity).toBeDefined();
      expect(activity.members).toBeDefined();
      expect(Array.isArray(activity.members)).toBe(true);
    });

    // Note: Claim endpoint requires JWT authentication
    // This test would need to be updated with proper auth token
    it.skip('should claim virtual member (requires auth)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/activities/${createdActivityId}/members/claim`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          virtualUserId: createdVirtualUserId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    // Cleanup
    it('should delete the activity', async () => {
      await request(app.getHttpServer())
        .delete(`/activities/${createdActivityId}`)
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
