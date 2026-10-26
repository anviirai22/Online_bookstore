const { registerSchema, cartItemSchema, addressSchema, reviewSchema } = require('../../src/validators/schemas');

describe('request validation', () => {
  it('accepts a valid registration and rejects a weak password', () => {
    expect(registerSchema.safeParse({ name: 'Reader One', email: 'reader@example.com', password: 'readmore1' }).success).toBe(true);
    expect(registerSchema.safeParse({ name: 'Reader One', email: 'reader@example.com', password: 'short' }).success).toBe(false);
  });

  it('rejects zero and negative cart quantities', () => {
    expect(cartItemSchema.safeParse({ bookId: '507f1f77bcf86cd799439011', quantity: 1 }).success).toBe(true);
    expect(cartItemSchema.safeParse({ bookId: '507f1f77bcf86cd799439011', quantity: 0 }).success).toBe(false);
    expect(cartItemSchema.safeParse({ bookId: '507f1f77bcf86cd799439011', quantity: -1 }).success).toBe(false);
  });

  it('requires complete delivery information', () => {
    expect(addressSchema.safeParse({ fullName: 'Reader One', line1: '1 Main Street', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India', phone: '+91 9000000000' }).success).toBe(true);
    expect(addressSchema.safeParse({ fullName: 'Reader One' }).success).toBe(false);
  });

  it('bounds review ratings and text', () => {
    const base = { bookId: '507f1f77bcf86cd799439011', rating: 5, text: 'A thoughtful, memorable read.' };
    expect(reviewSchema.safeParse(base).success).toBe(true);
    expect(reviewSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
  });
});
