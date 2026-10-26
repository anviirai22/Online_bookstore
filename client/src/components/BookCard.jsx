import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export function Rating({ value = 0, count = 0 }) {
  const rounded = Math.round(value);
  return <span className="rating" aria-label={`${value.toFixed?.(1) || value} out of 5 stars`}><span aria-hidden="true">{'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}</span>{count > 0 && <small> {value.toFixed(1)} ({count})</small>}</span>;
}

export default function BookCard({ book, onNotice }) {
  const { user } = useAuth();
  const { add } = useCart();
  const { books, toggle } = useWishlist();
  const [busy, setBusy] = useState(false);
  const wishlisted = books.some((item) => item.id === book.id);

  async function addToCart() {
    setBusy(true);
    try {
      await add(book, 1);
      onNotice?.(`${book.title} was added to your cart.`);
    } catch (error) {
      onNotice?.(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleWishlist() {
    if (!user) {
      onNotice?.('Sign in to keep a personal wishlist.');
      return;
    }
    try {
      await toggle(book);
      onNotice?.(wishlisted ? 'Removed from wishlist.' : 'Saved to wishlist.');
    } catch (error) {
      onNotice?.(error.message);
    }
  }

  return (
    <article className="book-card">
      <div className="book-cover-wrap">
        <Link to={`/books/${book.id}`} className="book-cover-link" aria-label={`View ${book.title}`}>
          {book.coverUrl ? <img className="book-cover" src={book.coverUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="cover-placeholder">{book.title.slice(0, 1)}</span>}
        </Link>
        <button className={wishlisted ? 'wish-button selected' : 'wish-button'} type="button" onClick={toggleWishlist} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>{wishlisted ? '♥' : '♡'}</button>
      </div>
      <div className="book-card-body">
        <p className="eyebrow">{book.category?.name || 'Book'}</p>
        <h3><Link to={`/books/${book.id}`}>{book.title}</Link></h3>
        <p className="book-author">{book.author}</p>
        <Rating value={book.averageRating || 0} count={book.reviewCount || 0} />
        <div className="book-card-bottom"><strong>{formatCurrency(book.price)}</strong><span className={book.available ? 'stock in-stock' : 'stock'}>{book.available ? 'In stock' : 'Out of stock'}</span></div>
        <button className="text-action" type="button" onClick={addToCart} disabled={busy || !book.available}>{busy ? 'Adding...' : book.available ? 'Add to cart' : 'Unavailable'}</button>
      </div>
    </article>
  );
}
