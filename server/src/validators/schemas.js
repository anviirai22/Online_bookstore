const { z } = require('zod');

const id = z.string().regex(/^[a-f\d]{24}$/i, 'A valid resource id is required.');
const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(160);
const password = z.string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be 128 characters or fewer.')
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), 'Password must contain a letter and a number.');
const text = (label, max = 120) => z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

const registerSchema = z.object({
  name: text('Name', 80).min(2, 'Name must be at least 2 characters.'),
  email,
  password,
});

const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required.') });

const bookSchema = z.object({
  title: text('Title', 180),
  author: text('Author', 120),
  description: text('Description', 4000),
  categoryId: id,
  price: z.coerce.number().positive('Price must be greater than zero.').max(1000000),
  coverUrl: z.string().trim().url('Cover URL must be a valid URL.').max(1000).or(z.literal('')).optional().default(''),
  stockQuantity: z.coerce.number().int().min(0).max(100000),
  keywords: z.array(z.string().trim().min(1).max(50)).max(20).optional().default([]),
  active: z.boolean().optional().default(true),
});

const categorySchema = z.object({
  name: text('Category name', 80).min(2),
  description: z.string().trim().max(300).optional().default(''),
  active: z.boolean().optional().default(true),
});

const cartItemSchema = z.object({ bookId: id, quantity: z.coerce.number().int().min(1).max(99) });
const cartUpdateSchema = z.object({ quantity: z.coerce.number().int().min(1).max(99) });
const cartMergeSchema = z.object({
  items: z.array(cartItemSchema).max(50),
});

const addressSchema = z.object({
  fullName: text('Full name', 100),
  line1: text('Address line 1', 150),
  line2: z.string().trim().max(150).optional().default(''),
  city: text('City', 80),
  state: text('State', 80),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,20}$/, 'Enter a valid postal code.'),
  country: text('Country', 80),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,25}$/, 'Enter a valid phone number.'),
});

const orderSchema = z.object({
  address: addressSchema,
  paymentMode: z.enum(['success', 'failure', 'pending']).optional(),
});

const reviewSchema = z.object({
  bookId: id,
  rating: z.coerce.number().int().min(1).max(5),
  text: text('Review', 1200).min(5, 'Review must be at least 5 characters.'),
});

const orderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  reason: z.string().trim().max(300).optional().default(''),
});

const moderationSchema = z.object({
  moderationStatus: z.enum(['PUBLISHED', 'REJECTED']),
  moderationNote: z.string().trim().max(300).optional().default(''),
});

const userStatusSchema = z.object({ status: z.enum(['active', 'inactive']) });

module.exports = {
  id,
  registerSchema,
  loginSchema,
  bookSchema,
  categorySchema,
  cartItemSchema,
  cartUpdateSchema,
  cartMergeSchema,
  addressSchema,
  orderSchema,
  reviewSchema,
  orderStatusSchema,
  moderationSchema,
  userStatusSchema,
};
