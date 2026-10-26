const bcrypt = require('bcryptjs');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const { config } = require('../src/config/env');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');
const Cart = require('../src/models/Cart');
const Wishlist = require('../src/models/Wishlist');
const Order = require('../src/models/Order');
const PaymentAttempt = require('../src/models/PaymentAttempt');
const Review = require('../src/models/Review');
const AuditEvent = require('../src/models/AuditEvent');
const slugify = require('../src/utils/slug');

async function seed() {
  await connectDatabase();
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Book.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Order.deleteMany({}),
    PaymentAttempt.deleteMany({}),
    Review.deleteMany({}),
    AuditEvent.deleteMany({}),
  ]);

  const categories = await Category.insertMany([
    { name: 'Fiction', slug: slugify('Fiction'), description: 'Stories that take you somewhere new.' },
    { name: 'Technology', slug: slugify('Technology'), description: 'Practical guides for modern builders.' },
    { name: 'Business', slug: slugify('Business'), description: 'Ideas for thoughtful work and leadership.' },
    { name: 'Design', slug: slugify('Design'), description: 'Books about visual thinking and craft.' },
    { name: 'Wellness', slug: slugify('Wellness'), description: 'Evidence-informed habits for a richer life.' },
  ]);
  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  const books = await Book.insertMany([
    {
      title: 'The Cartographer\'s Secret', author: 'Mira Sen', description: 'A lyrical mystery about maps, memory, and the quiet courage to redraw a life.', keywords: ['mystery', 'literary', 'maps'], category: categoryByName.Fiction._id, priceCents: 1599, stockQuantity: 18, coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'The Last Library Train', author: 'Jon Bell', description: 'A warm, fast-moving adventure for readers who believe stories are meant to travel.', keywords: ['adventure', 'travel', 'fiction'], category: categoryByName.Fiction._id, priceCents: 1299, stockQuantity: 12, coverUrl: 'https://images.unsplash.com/photo-1511108690759-009324a90311?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'Reliable JavaScript Systems', author: 'Priya Kulkarni', description: 'Patterns for building resilient Node.js applications that are easy to reason about and operate.', keywords: ['javascript', 'node', 'engineering'], category: categoryByName.Technology._id, priceCents: 2499, stockQuantity: 24, coverUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'MongoDB in Practice', author: 'A. R. Iyer', description: 'A hands-on path from document modeling to production-ready data access.', keywords: ['mongodb', 'database', 'backend'], category: categoryByName.Technology._id, priceCents: 2199, stockQuantity: 15, coverUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'Good Work, Slowly', author: 'Nia Okafor', description: 'A practical and humane guide to building a sustainable creative practice.', keywords: ['focus', 'work', 'habits'], category: categoryByName.Business._id, priceCents: 1799, stockQuantity: 20, coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'The Small Brand Handbook', author: 'Theo Martin', description: 'Clear positioning, memorable language, and a grounded approach to growing a small brand.', keywords: ['brand', 'marketing', 'business'], category: categoryByName.Business._id, priceCents: 1899, stockQuantity: 10, coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'Designing for Clarity', author: 'Lena Park', description: 'A field guide to interfaces that respect attention and make complex things feel possible.', keywords: ['ux', 'product', 'design'], category: categoryByName.Design._id, priceCents: 2299, stockQuantity: 14, coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'A Field Guide to Rest', author: 'Samira Das', description: 'Small, durable rituals for recovering attention, energy, and a sense of spaciousness.', keywords: ['rest', 'wellness', 'health'], category: categoryByName.Wellness._id, priceCents: 1499, stockQuantity: 16, coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=700&q=80',
    },
  ]);

  const [, customer] = await User.create([
    { name: 'Bookstore Administrator', email: config.adminEmail.toLowerCase(), passwordHash: await bcrypt.hash(config.adminPassword, 12), role: 'admin' },
    { name: 'Demo Customer', email: config.demoCustomerEmail.toLowerCase(), passwordHash: await bcrypt.hash(config.demoCustomerPassword, 12), role: 'customer' },
  ]);
  await Cart.create({ owner: customer._id, items: [] });
  await Wishlist.create({ owner: customer._id, books: [books[2]._id] });

  const sampleItems = [{ book: books[0]._id, title: books[0].title, author: books[0].author, coverUrl: books[0].coverUrl, unitPriceCents: books[0].priceCents, quantity: 1, lineTotalCents: books[0].priceCents }];
  const sampleOrder = await Order.create({
    orderNumber: 'OBS-DEMO-0001', customer: customer._id, items: sampleItems,
    address: { fullName: customer.name, line1: 'Demo address', line2: '', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India', phone: '+91 9000000000' },
    subtotalCents: books[0].priceCents, shippingCents: config.shippingCents, totalCents: books[0].priceCents + config.shippingCents,
    status: 'DELIVERED', inventoryReserved: false, inventoryRestored: false,
  });
  await PaymentAttempt.create({ order: sampleOrder._id, customer: customer._id, amountCents: sampleOrder.totalCents, idempotencyKey: 'seed-demo-payment', gatewayReference: 'seed_demo', status: 'SUCCEEDED' });
  await Review.create({ book: books[0]._id, customer: customer._id, rating: 5, text: 'A beautifully made demo review with a real delivered purchase behind it.', moderationStatus: 'PUBLISHED' });
  await Book.findByIdAndUpdate(books[0]._id, { averageRating: 5, reviewCount: 1, $inc: { stockQuantity: -1 } });

  console.info('Seed complete.');
  console.info(`Admin: ${config.adminEmail}`);
  console.info(`Customer: ${config.demoCustomerEmail}`);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
}).finally(async () => {
  await disconnectDatabase();
});
