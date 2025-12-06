import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST) - Create User', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      phone: `12345678${Date.now() % 10000}`, // Ensure unique phone
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(createUserDto.name);
    expect(response.body.data.email).toBe(createUserDto.email);
    createdUserId = response.body.data.id;
  });

  it('/users (GET) - Get All Users', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('/users/:id (GET) - Get One User', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .expect(200);

    expect(response.body.data.id).toBe(createdUserId);
  });

  it('/users/:id (GET) - Get One User (Not Found)', async () => {
    await request(app.getHttpServer())
      .get('/users/999999')
      .expect(404);
  });

  it('/users/:id (PATCH) - Update User', async () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Test User',
    };

    const response = await request(app.getHttpServer())
      .patch(`/users/${createdUserId}`)
      .send(updateUserDto)
      .expect(200);

    expect(response.body.data.name).toBe(updateUserDto.name);
  });

  it('/users/:id (PATCH) - Update User (Not Found)', async () => {
    await request(app.getHttpServer())
      .patch('/users/999999')
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('/users/:id (DELETE) - Delete User', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${createdUserId}`)
      .expect(200);

    // Verify deletion
    await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .expect(404);
  });

  it('/users/:id (DELETE) - Delete User (Not Found)', async () => {
    await request(app.getHttpServer())
      .delete('/users/999999')
      .expect(404);
  });
});
