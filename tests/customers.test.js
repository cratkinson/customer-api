'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { initDb } = require('../src/db');
const { seed } = require('../src/db/seed');

beforeEach(() => {
  initDb();
  seed();
});

async function login(customerId = 1001, pin = 1234) {
  const res = await request(app)
    .post('/auth/login')
    .send({ customerId, pin });
  return res.body.token;
}

function expiredToken() {
  return jwt.sign(
    { sub: 1001, exp: Math.floor(Date.now() / 1000) - 60 },
    process.env.JWT_SECRET,
  );
}

// ---------------------------------------------------------------------------
// GET /customers/me
// ---------------------------------------------------------------------------

describe('GET /customers/me', () => {
  test('returns profile for authenticated customer', async () => {
    const token = await login();
    const res = await request(app)
      .get('/customers/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      customerId: 1001,
      name: 'Alice Nguyen',
      email: 'alice@example.com',
    });
    expect(res.body).toHaveProperty('created_at');
  });

  test('never exposes pin_hash', async () => {
    const token = await login();
    const res = await request(app)
      .get('/customers/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).not.toHaveProperty('pin_hash');
  });

  test('no token returns 401', async () => {
    const res = await request(app).get('/customers/me');
    expect(res.status).toBe(401);
  });

  test('tampered token returns 401', async () => {
    const res = await request(app)
      .get('/customers/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEwMDF9.TAMPERED');

    expect(res.status).toBe(401);
  });

  test('expired token returns 401', async () => {
    const res = await request(app)
      .get('/customers/me')
      .set('Authorization', `Bearer ${expiredToken()}`);

    expect(res.status).toBe(401);
  });

  test('malformed Authorization header returns 401', async () => {
    const res = await request(app)
      .get('/customers/me')
      .set('Authorization', 'NotBearer abc');

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /customers/me
// ---------------------------------------------------------------------------

describe('PUT /customers/me', () => {
  test('updates name only', async () => {
    const token = await login();
    const res = await request(app)
      .put('/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice Tran' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice Tran');
    expect(res.body.email).toBe('alice@example.com');
  });

  test('updates email only', async () => {
    const token = await login();
    const res = await request(app)
      .put('/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'alice.new@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice.new@example.com');
    expect(res.body.name).toBe('Alice Nguyen');
  });

  test('updates both fields', async () => {
    const token = await login();
    const res = await request(app)
      .put('/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice Tran', email: 'alice.tran@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Alice Tran', email: 'alice.tran@example.com' });
  });

  test('trims whitespace from fields', async () => {
    const token = await login();
    const res = await request(app)
      .put('/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Alice Tran  ' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice Tran');
  });

  test('never exposes pin_hash in response', async () => {
    const token = await login();
    const res = await request(app)
      .put('/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice Tran' });

    expect(res.body).not.toHaveProperty('pin_hash');
  });

  test('empty body returns 400', async () => {
    const token = await login();
    const res = await request(app)
      .put('/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('integer name returns 400', async () => {
    const token = await login();
    const res = await request(app)
      .put('/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 42 });

    expect(res.status).toBe(400);
  });

  test('blank name returns 400', async () => {
    const token = await login();
    const res = await request(app)
      .put('/customers/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' });

    expect(res.status).toBe(400);
  });

  test('no token returns 401', async () => {
    const res = await request(app)
      .put('/customers/me')
      .send({ name: 'Hacker' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /customers/me
// ---------------------------------------------------------------------------

describe('DELETE /customers/me', () => {
  test('deletes the authenticated customer and returns 204', async () => {
    const token = await login();
    const res = await request(app)
      .delete('/customers/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  test('GET /customers/me returns 404 after deletion', async () => {
    const token = await login();
    await request(app).delete('/customers/me').set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/customers/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('second DELETE returns 404', async () => {
    const token = await login();
    await request(app).delete('/customers/me').set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .delete('/customers/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('no token returns 401', async () => {
    const res = await request(app).delete('/customers/me');
    expect(res.status).toBe(401);
  });
});
