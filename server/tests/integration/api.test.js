const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { connectDatabase, disconnectDatabase } = require('../../src/config/db');
const Category = require('../../src/models/Category');
const Book = require('../../src/models/Book');
const User = require('../../src/models/User');
const Cart = require('../../src/models/Cart');

describe('REST API integration', () => {
  let mongo;
  let category;
  let book;
  let adminAgent;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDatabase(mongo.getUri());
    category = await Category.create({ name: 'Test Fiction', slug: 'test-fiction', active: true });
    book = await Book.create({ title: 'Test Book', author: 'Test Author', description: 'A test description.', category: category._id, priceCents: 1000, stockQuantity: 8, active: true });
    const admin = await User.create({ name: 'Admin', email: 'admin@test.example', passwordHash: await bcrypt.hash('adminpass1', 10), role: 'admin' });
    adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/login').send({ email: admin.email, password: 'adminpass1' });
  });

  beforeEach(async () => {
    await User.deleteMany({ role: 'customer' });
    await Cart.deleteMany({});
    await Book.findByIdAndUpdate(book._id, { stockQuantity: 8 });
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongo) await mongo.stop();
  });

  it('registers, logs in, and exposes the public catalogue', async () => {
    const agent = request.agent(app);
    const registration = await agent.post('/api/auth/register').send({ name: 'Test Customer', email: 'customer@test.example', password: 'customer1' });
    expect(registration.status).toBe(201);
    expect(registration.body.data.user.email).toBe('customer@test.example');
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    const catalogue = await request(app).get('/api/books?q=test');
    expect(catalogue.status).toBe(200);
    expect(catalogue.body.data.books[0].title).toBe('Test Book');
  });

  it('rejects a customer from admin operations', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Test Customer', email: 'customer@test.example', password: 'customer1' });
    const response = await agent.get('/api/admin/books');
    expect(response.status).toBe(403);
  });

  it('creates a confirmed order only after successful sandbox payment', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Test Customer', email: 'customer@test.example', password: 'customer1' });
    await agent.post('/api/cart/items').send({ bookId: book._id.toString(), quantity: 2 });
    const response = await agent.post('/api/orders').set('Idempotency-Key', 'integration-success').send({ address: { fullName: 'Test Customer', line1: '1 Main Street', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India', phone: '+91 9000000000' }, paymentMode: 'success' });
    expect(response.status).toBe(201);
    expect(response.body.data.order.status).toBe('CONFIRMED');
    expect(response.body.data.order.total).toBe(24.99);
  });

  it('preserves a failed payment as a pending order without consuming stock', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Test Customer', email: 'failure@test.example', password: 'customer1' });
    await agent.post('/api/cart/items').send({ bookId: book._id.toString(), quantity: 1 });
    const response = await agent.post('/api/orders').set('Idempotency-Key', 'integration-failure').send({ address: { fullName: 'Test Customer', line1: '1 Main Street', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India', phone: '+91 9000000000' }, paymentMode: 'failure' });
    expect(response.status).toBe(402);
    expect(response.body.data.order.status).toBe('PENDING_PAYMENT');
    expect((await Book.findById(book._id)).stockQuantity).toBe(8);
  });
});
