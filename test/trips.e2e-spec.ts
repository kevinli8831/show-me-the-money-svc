import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

  it('/trips/:id (PATCH) - Update Trip', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/trips/${createdTripId}`)
      .send({ name: 'Updated Trip Name' })
      .expect(200);

    expect(response.body.name).toBe('Updated Trip Name');
  });

  it('/trips/:id (DELETE) - Delete Trip', async () => {
    await request(app.getHttpServer())
      .delete(`/trips/${createdTripId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/trips/${createdTripId}`)
      .then((res) => {
        expect(res.body).toEqual({});
      });
  });
});
