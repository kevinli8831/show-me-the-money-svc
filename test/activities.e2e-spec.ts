import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateActivityDto } from '../src/activities/dto/create-activity.dto';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

describe('ActivitiesController (e2e)', () => {
  let app: INestApplication;
  let userId: number;
  let createdActivityId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Create a user for the activity
    const createUserDto: CreateUserDto = {
      name: 'Activity Creator',
      email: `activity-creator-${Date.now()}@example.com`,
    };
    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);
    userId = userRes.body.data.id;
  });

  afterAll(async () => {
    // Clean up user
    if (userId) {
      await request(app.getHttpServer()).delete(`/users/${userId}`);
    }
    await app.close();
  });

  it('/activities (POST) - Create Activity', async () => {
    const createActivityDto: CreateActivityDto = {
      name: 'Test Activity',
      description: 'A activity to test e2e',
      creatorUserId: userId,
    };

    const response = await request(app.getHttpServer())
      .post('/activities')
      .send(createActivityDto)
      .expect(201);

    expect(response.body.data).toHaveProperty('activity');
    expect(response.body.data.activity.name).toBe(createActivityDto.name);
    createdActivityId = response.body.data.activity.id;
  });

  it('/activities (POST) - Should create activity_member for creator', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/activities/${createdActivityId}/members/${userId}`)
      .expect(200);

    expect(response.body.message).toBe('成功移除成員');

    // Add them back for other tests
    await request(app.getHttpServer())
      .post(`/activities/${createdActivityId}/members`)
      .send({ userId })
      .expect(201);
  });

  it('/activities (GET) - Get All Activities', async () => {
    const response = await request(app.getHttpServer())
      .get('/activities')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('/activities/:id (GET) - Get One Activity', async () => {
    const response = await request(app.getHttpServer())
      .get(`/activities/${createdActivityId}`)
      .expect(200);

    expect(response.body.data.id).toBe(createdActivityId);
  });

  it('/activities/:id (GET) - Get One Activity (Not Found)', async () => {
    await request(app.getHttpServer())
      .get('/activities/999999')
      .expect(404);
  });

  it('/activities/:id (PATCH) - Update Activity', async () => {
    // Determine token first
    const activityWithMembers = await request(app.getHttpServer())
      .get(`/activities/${createdActivityId}?include=members`);

    // Only proceed if members are returned (they should be)
    const members = activityWithMembers.body.data.members;
    const member = members.find((m: any) => m.userId === userId);
    const memberToken = member.memberToken;

    const response = await request(app.getHttpServer())
      .patch(`/activities/${createdActivityId}`)
      .set('x-member-token', memberToken)
      .send({ name: 'Updated Activity Name' })
      .expect(200);

    expect(response.body.data.name).toBe('Updated Activity Name');
  });

  it('/activities/:id (PATCH) - Update Activity (Not Found)', async () => {
    await request(app.getHttpServer())
      .patch('/activities/999999')
      .set('x-member-token', 'dummy')
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('/activities/:id (DELETE) - Delete Activity', async () => {
    // Get token
    const activityWithMembers = await request(app.getHttpServer())
      .get(`/activities/${createdActivityId}?include=members`);

    // Need to handle if activity already gone? No, previous tests shouldn't delete it.
    const members = activityWithMembers.body.data.members;
    const member = members.find((m: any) => m.userId === userId);
    const memberToken = member.memberToken;

    await request(app.getHttpServer())
      .delete(`/activities/${createdActivityId}`)
      .set('x-member-token', memberToken)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/activities/${createdActivityId}`)
      .expect(404);
  });

  it('/activities/:id (DELETE) - Delete Activity (Not Found)', async () => {
    await request(app.getHttpServer())
      .delete('/activities/999999')
      .set('x-member-token', 'dummy')
      .expect(404);
  });
});
