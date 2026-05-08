'use strict';

const request = require('supertest');
const app = require('../app');
const { initDb } = require('../src/db');
const { seed } = require('../src/db/seed');

beforeEach(() => {
  initDb();
  seed();
});

describe('POST /auth/login', () => {
  test('valid credentials return a JWT', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 1001, pin: 1234 });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.split('.')).toHaveLength(3);
  });

  test('all three seed customers can log in', async () => {
    const creds = [
      { customerId: 1001, pin: 1234 },
      { customerId: 1002, pin: 5678 },
      { customerId: 1003, pin: 9999 },
    ];
    for (const c of creds) {
      const res = await request(app).post('/auth/login').send(c);
      expect(res.status).toBe(200);
    }
  });

  test('wrong PIN returns 401 with generic message', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 1001, pin: 9999 });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  test('unknown customerId returns the same 401 as wrong PIN', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 9999, pin: 1234 });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  test('string customerId returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 'admin', pin: 1234 });

    expect(res.status).toBe(400);
  });

  test('float customerId returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 1001.5, pin: 1234 });

    expect(res.status).toBe(400);
  });

  test('string pin returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 1001, pin: '1234' });

    expect(res.status).toBe(400);
  });

  test('float pin returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 1001, pin: 12.34 });

    expect(res.status).toBe(400);
  });

  test('missing customerId returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ pin: 1234 });

    expect(res.status).toBe(400);
  });

  test('missing pin returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 1001 });

    expect(res.status).toBe(400);
  });

  test('empty body returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });

  test('malformed JSON returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('not-json');

    expect(res.status).toBe(400);
  });

  test('response never contains pin_hash', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ customerId: 1001, pin: 1234 });

    expect(JSON.stringify(res.body)).not.toMatch(/pin_hash/);
  });
});
