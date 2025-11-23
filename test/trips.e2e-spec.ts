import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateTripDto } from '../src/trips/dto/create-trip.dto';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

describe('TripsController (e2e)', () => {
  let app: INestApplication;
  let userId: number;
  let createdTripId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Create a user for the trip
    const createUserDto: CreateUserDto = {
      name: 'Trip Creator',
      email: `trip-creator-${Date.now()}@example.com`,
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

  it('/trips (POST) - Create Trip', async () => {
    const createTripDto: CreateTripDto = {
      name: 'Test Trip',
      description: 'A trip to test e2e',
      creatorUserId: userId,
    };

    const response = await request(app.getHttpServer())
      .post('/trips')
      .send(createTripDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(createTripDto.name);
    expect(response.body.creatorUserId).toBe(userId);
    createdTripId = response.body.id;
  });

  it('/trips (POST) - Should create trip_member for creator', async () => {
    // Query the database to check if trip_member was created
    // We'll use a direct database query via a GET endpoint we'll create
    // For now, we'll verify by trying to add the same user again (should fail if already exists)
    
    // Try to add the creator again - this should work for now since we don't have duplicate check
    // But we can verify the member exists by checking if we can remove them
    const response = await request(app.getHttpServer())
      .delete(`/trips/${createdTripId}/members/${userId}`)
      .expect(200);

    expect(response.body.message).toBe('Member removed successfully');

    // Add them back for other tests
    await request(app.getHttpServer())
      .post(`/trips/${createdTripId}/members`)
      .send({ userId })
      .expect(201);
  });

  it('/trips (GET) - Get All Trips', async () => {
    const response = await request(app.getHttpServer())
      .get('/trips')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/trips/:id (GET) - Get One Trip', async () => {
    const response = await request(app.getHttpServer())
      .get(`/trips/${createdTripId}`)
      .expect(200);

    expect(response.body.id).toBe(createdTripId);
  });

  it('/trips/:id (GET) - Get One Trip (Not Found)', async () => {
    await request(app.getHttpServer())
      .get('/trips/999999')
      .expect(404);
  });

  it('/trips/:id (PATCH) - Update Trip', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/trips/${createdTripId}`)
      .send({ name: 'Updated Trip Name' })
      .expect(200);

    expect(response.body.name).toBe('Updated Trip Name');
  });

  it('/trips/:id (PATCH) - Update Trip (Not Found)', async () => {
    await request(app.getHttpServer())
      .patch('/trips/999999')
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('/trips/:id (DELETE) - Delete Trip', async () => {
    await request(app.getHttpServer())
      .delete(`/trips/${createdTripId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/trips/${createdTripId}`)
      .expect(404);
  });

  it('/trips/:id (DELETE) - Delete Trip (Not Found)', async () => {
    await request(app.getHttpServer())
      .delete('/trips/999999')
      .expect(404);
  });
});
