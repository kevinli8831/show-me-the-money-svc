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
    userId = userRes.body.id;
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

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(createActivityDto.name);
    expect(response.body.creatorUserId).toBe(userId);
    createdActivityId = response.body.id;
  });

  it('/activities (POST) - Should create activity_member for creator', async () => {
    // Query the database to check if activity_member was created
    // We'll use a direct database query via a GET endpoint we'll create
    // For now, we'll verify by trying to add the same user again (should fail if already exists)

    // Try to add the creator again - this should work for now since we don't have duplicate check
    // But we can verify the member exists by checking if we can remove them
    const response = await request(app.getHttpServer())
      .delete(`/activities/${createdActivityId}/members/${userId}`)
      .expect(200);

    expect(response.body.message).toBe('Member removed successfully');

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

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/activities/:id (GET) - Get One Activity', async () => {
    const response = await request(app.getHttpServer())
      .get(`/activities/${createdActivityId}`)
      .expect(200);

    expect(response.body.id).toBe(createdActivityId);
  });

  it('/activities/:id (GET) - Get One Activity (Not Found)', async () => {
    await request(app.getHttpServer())
      .get('/activities/999999')
      .expect(404);
  });

  it('/activities/:id (PATCH) - Update Activity', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/activities/${createdActivityId}`)
      .send({ name: 'Updated Activity Name' })
      .expect(200);

    expect(response.body.name).toBe('Updated Activity Name');
  });

  it('/activities/:id (PATCH) - Update Activity (Not Found)', async () => {
    await request(app.getHttpServer())
      .patch('/activities/999999')
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('/activities/:id (DELETE) - Delete Activity', async () => {
    await request(app.getHttpServer())
      .delete(`/activities/${createdActivityId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/activities/${createdActivityId}`)
      .expect(404);
  });

  it('/activities/:id (DELETE) - Delete Activity (Not Found)', async () => {
    await request(app.getHttpServer())
      .delete('/activities/999999')
      .expect(404);
  });
});
