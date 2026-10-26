const { fromCents } = require('../utils/money');
const { config } = require('../config/env');

function idOf(value) {
  return value?._id?.toString?.() || value?.toString?.() || value;
}

function serializeCategory(category) {
  if (!category) return null;
  return {
    id: idOf(category),
    name: category.name,
    slug: category.slug,
    description: category.description,
    active: category.active,
  };
}

function serializeBook(book) {
  if (!book) return null;
  return {
    id: idOf(book),
    title: book.title,
    author: book.author,
    description: book.description,
    keywords: book.keywords || [],
    category: serializeCategory(book.category),
    categoryId: idOf(book.category),
    price: fromCents(book.priceCents),
    priceCents: book.priceCents,
    coverUrl: book.coverUrl,
    stockQuantity: book.stockQuantity,
    available: Boolean(book.active && book.stockQuantity > 0),
    active: book.active,
    averageRating: Number((book.averageRating || 0).toFixed(1)),
    reviewCount: book.reviewCount || 0,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

function serializeCart(cart) {
  const items = (cart?.items || []).map((item) => {
    const book = item.book;
    const priceCents = book?.priceCents || 0;
    return {
      book: serializeBook(book),
      quantity: item.quantity,
      lineTotal: fromCents(priceCents * item.quantity),
      lineTotalCents: priceCents * item.quantity,
      stockQuantity: book?.stockQuantity || 0,
    };
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const shippingCents = config.shippingCents;
  return {
    id: idOf(cart),
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: fromCents(subtotalCents),
    subtotalCents,
    shipping: fromCents(shippingCents),
    shippingCents,
    total: fromCents(subtotalCents + shippingCents),
    totalCents: subtotalCents + shippingCents,
    updatedAt: cart?.updatedAt,
  };
}

function serializeOrder(order) {
  if (!order) return null;
  return {
    id: idOf(order),
    orderNumber: order.orderNumber,
    customer: order.customer?.name ? {
      id: idOf(order.customer),
      name: order.customer.name,
      email: order.customer.email,
    } : idOf(order.customer),
    items: order.items.map((item) => ({
      bookId: idOf(item.book),
      title: item.title,
      author: item.author,
      coverUrl: item.coverUrl,
      quantity: item.quantity,
      unitPrice: fromCents(item.unitPriceCents),
      unitPriceCents: item.unitPriceCents,
      lineTotal: fromCents(item.lineTotalCents),
      lineTotalCents: item.lineTotalCents,
    })),
    address: order.address,
    subtotal: fromCents(order.subtotalCents),
    subtotalCents: order.subtotalCents,
    shipping: fromCents(order.shippingCents),
    shippingCents: order.shippingCents,
    total: fromCents(order.totalCents),
    totalCents: order.totalCents,
    status: order.status,
    inventoryReserved: order.inventoryReserved,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
  };
}

function serializeReview(review) {
  if (!review) return null;
  return {
    id: idOf(review),
    bookId: idOf(review.book),
    book: review.book?.title ? { id: idOf(review.book), title: review.book.title, author: review.book.author } : undefined,
    customer: review.customer?.name ? {
      id: idOf(review.customer),
      name: review.customer.name,
    } : idOf(review.customer),
    rating: review.rating,
    text: review.text,
    moderationStatus: review.moderationStatus,
    moderationNote: review.moderationNote,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

module.exports = {
  serializeCategory,
  serializeBook,
  serializeCart,
  serializeOrder,
  serializeReview,
};
