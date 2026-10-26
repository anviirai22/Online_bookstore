const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload?.error?.message || 'The request could not be completed.', response.status, payload);
  }
  return payload;
}

const json = (method, body, headers) => ({ method, headers, body: JSON.stringify(body) });

export const api = {
  auth: {
    me: () => request('/auth/me'),
    login: (body) => request('/auth/login', json('POST', body)),
    register: (body) => request('/auth/register', json('POST', body)),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },
  catalog: {
    books: (params = {}) => request(`/books?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))}`),
    book: (id) => request(`/books/${id}`),
    categories: () => request('/categories'),
  },
  cart: {
    get: () => request('/cart'),
    add: (bookId, quantity) => request('/cart/items', json('POST', { bookId, quantity })),
    merge: (items) => request('/cart/merge', json('POST', { items })),
    update: (bookId, quantity) => request(`/cart/items/${bookId}`, json('PUT', { quantity })),
    remove: (bookId) => request(`/cart/items/${bookId}`, { method: 'DELETE' }),
    clear: () => request('/cart', { method: 'DELETE' }),
  },
  wishlist: {
    get: () => request('/wishlist'),
    add: (bookId) => request(`/wishlist/items/${bookId}`, { method: 'POST' }),
    remove: (bookId) => request(`/wishlist/items/${bookId}`, { method: 'DELETE' }),
  },
  orders: {
    create: (body, key) => request('/orders', json('POST', body, { 'Idempotency-Key': key })),
    list: () => request('/orders'),
    get: (id) => request(`/orders/${id}`),
    pay: (id, body, key) => request(`/orders/${id}/pay`, json('POST', body, { 'Idempotency-Key': key })),
    cancel: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
  },
  reviews: {
    submit: (body) => request('/reviews', json('POST', body)),
  },
  admin: {
    books: (params = {}) => request(`/admin/books?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))}`),
    createBook: (body) => request('/admin/books', json('POST', body)),
    updateBook: (id, body) => request(`/admin/books/${id}`, json('PUT', body)),
    deactivateBook: (id) => request(`/admin/books/${id}`, { method: 'DELETE' }),
    stock: (id, stockQuantity) => request(`/admin/books/${id}/stock`, json('PUT', { stockQuantity })),
    categories: () => request('/admin/categories'),
    createCategory: (body) => request('/admin/categories', json('POST', body)),
    updateCategory: (id, body) => request(`/admin/categories/${id}`, json('PUT', body)),
    deactivateCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
    orders: (params = {}) => request(`/admin/orders?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))}`),
    order: (id) => request(`/admin/orders/${id}`),
    updateOrderStatus: (id, body) => request(`/admin/orders/${id}/status`, json('PUT', body)),
    reviews: (params = {}) => request(`/admin/reviews?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))}`),
    moderateReview: (id, body) => request(`/admin/reviews/${id}`, json('PUT', body)),
    report: () => request('/admin/reports/sales'),
    users: () => request('/admin/users'),
    updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, json('PUT', { status })),
  },
};

export function newIdempotencyKey() {
  return crypto.randomUUID();
}
