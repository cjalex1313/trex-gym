import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import request from 'supertest';
import { Admin } from '../src/admins/schemas/admin.schema';
import { configureApp } from '../src/app.config';
import { AppModule } from '../src/app.module';

describe('Phase 1 API (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let adminModel: Model<Admin>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRY = '24h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    adminModel = moduleFixture.get<Model<Admin>>(getModelToken(Admin.name));

    await adminModel.create({
      email: 'admin@trexgym.local',
      passwordHash: await hash('Admin123!', 10),
      firstName: 'Default',
      lastName: 'Admin',
    });
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  it('GET /api returns health payload', async () => {
    const response = await request(app.getHttpServer()).get('/api').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('authenticates admin and performs client CRUD flow', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({
        email: 'admin@trexgym.local',
        password: 'Admin123!',
      })
      .expect(201);

    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body).toHaveProperty('refreshToken');

    const accessToken = loginResponse.body.accessToken as string;
    const refreshToken = loginResponse.body.refreshToken as string;

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(refreshResponse.body).toHaveProperty('accessToken');
    expect(refreshResponse.body).toHaveProperty('refreshToken');

    const refreshedAccessToken = refreshResponse.body.accessToken as string;

    await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${refreshedAccessToken}`)
      .expect(200);

    const createResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Alex',
        lastName: 'Popescu',
        email: 'alex@trexgym.local',
        phone: '+40740000001',
      })
      .expect(201);

    expect(createResponse.body).toHaveProperty('generatedPin');
    expect(createResponse.body.client).toHaveProperty('_id');

    const clientId = createResponse.body.client._id as string;
    const generatedPin = createResponse.body.generatedPin as string;

    await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'active' })
      .expect(200);

    const createSubscriptionResponse = await request(app.getHttpServer())
      .post(`/api/clients/${clientId}/subscriptions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        planType: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        price: 250,
        currency: 'RON',
      })
      .expect(201);

    expect(createSubscriptionResponse.body).toHaveProperty('_id');
    expect(createSubscriptionResponse.body).toHaveProperty('status', 'active');

    const subscriptionId = createSubscriptionResponse.body._id as string;

    await request(app.getHttpServer())
      .get(`/api/clients/${clientId}/subscriptions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const createPaymentResponse = await request(app.getHttpServer())
      .post(`/api/subscriptions/${subscriptionId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 100,
        paymentDate: '2026-01-10',
        method: 'cash',
      })
      .expect(201);

    expect(createPaymentResponse.body).toHaveProperty('_id');

    const paymentId = createPaymentResponse.body._id as string;

    await request(app.getHttpServer())
      .get(`/api/subscriptions/${subscriptionId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/clients/${clientId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const outstandingResponse = await request(app.getHttpServer())
      .get('/api/payments/outstanding')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(outstandingResponse.body)).toBe(true);

    if (outstandingResponse.body.length > 0) {
      expect(outstandingResponse.body[0]).toEqual(
        expect.objectContaining({
          subscriptionId: expect.any(String),
          clientId: expect.any(String),
          outstandingAmount: expect.any(Number),
        }),
      );
    }

    await request(app.getHttpServer())
      .put(`/api/payments/${paymentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 150 })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/payments/${paymentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const clientLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/client/login')
      .send({ email: 'alex@trexgym.local', pin: generatedPin })
      .expect(201);

    const clientAccessToken = clientLoginResponse.body.accessToken as string;
    const clientRefreshToken = clientLoginResponse.body.refreshToken as string;

    await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${clientRefreshToken}`)
      .expect(401);
  });
});
