import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { ErrorBanner, LoadingState, Notice } from '../components/Feedback';
import { Field, SubmitButton } from '../components/Forms';
import { formatCurrency, Rating } from '../components/BookCard';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';

export default function BookDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const { books: wishlist, toggle } = useWishlist();
  const [data, setData] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState({ rating: 5, text: '' });

  useEffect(() => {
    setLoading(true);
    api.catalog.book(id).then((response) => setData(response.data)).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState label="Finding that book" />;
  if (!data) return <section className="page-section"><ErrorBanner message={error || 'Book not found.'} /></section>;
  const { book, reviews } = data;
  const wishlisted = wishlist.some((item) => item.id === book.id);

  async function addToCart() {
    setBusy(true);
    try { await add(book, quantity); setNotice('Added to your cart.'); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function submitReview(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.reviews.submit({ bookId: book.id, rating: Number(review.rating), text: review.text });
      setReview({ rating: 5, text: '' });
      setNotice('Your review was submitted for moderation.');
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  return <section className="page-section detail-section"><Link to="/books" className="back-link">← Back to catalogue</Link><ErrorBanner message={error} /><Notice message={notice} /><div className="detail-layout"><div className="detail-cover">{book.coverUrl ? <img src={book.coverUrl} alt={`Cover of ${book.title}`} /> : <span className="cover-placeholder large">{book.title.slice(0, 1)}</span>}</div><div className="detail-copy"><p className="eyebrow">{book.category?.name}</p><h1>{book.title}</h1><p className="detail-author">By {book.author}</p><Rating value={book.averageRating} count={book.reviewCount} /><p className="detail-description">{book.description}</p><div className="detail-price">{formatCurrency(book.price)} <span className={book.available ? 'stock in-stock' : 'stock'}>{book.available ? `${book.stockQuantity} available` : 'Currently unavailable'}</span></div><div className="purchase-row"><label className="quantity-field" htmlFor="quantity">Qty<input id="quantity" type="number" min="1" max={book.stockQuantity || 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} disabled={!book.available} /></label><button className="primary-button" type="button" onClick={addToCart} disabled={busy || !book.available}>{busy ? 'Adding...' : 'Add to cart'}</button><button className={wishlisted ? 'outline-button selected' : 'outline-button'} type="button" onClick={async () => { if (!user) { setNotice('Sign in to keep a personal wishlist.'); return; } await toggle(book); }}>{wishlisted ? 'Saved' : 'Save'}</button></div><p className="sandbox-note">Local sandbox checkout. No real card details are requested.</p></div></div><div className="reviews-section"><div className="section-top"><div><p className="eyebrow">Reader notes</p><h2>Reviews</h2></div>{book.reviewCount > 0 && <Rating value={book.averageRating} count={book.reviewCount} />}</div><div className="reviews-grid"><div className="review-list">{reviews.length ? reviews.map((item) => <article className="review-card" key={item.id}><Rating value={item.rating} /><p>“{item.text}”</p><small>{item.customer?.name || 'Reader'} · {new Date(item.createdAt).toLocaleDateString()}</small></article>) : <p className="muted-copy">No published reviews yet. Be the first eligible reader to leave a note.</p>}</div>{user ? <form className="review-form" onSubmit={submitReview}><h3>Leave a note</h3><p className="muted-copy">Reviews become available after a delivered purchase.</p><Field label="Rating" name="rating"><select id="rating" value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })}><option value="5">5 - Loved it</option><option value="4">4 - Very good</option><option value="3">3 - Good</option><option value="2">2 - Not for me</option><option value="1">1 - Disappointing</option></select></Field><Field label="Your review" name="review-text"><textarea id="review-text" rows="5" value={review.text} onChange={(event) => setReview({ ...review, text: event.target.value })} placeholder="What stayed with you?" required /></Field><SubmitButton busy={busy}>Submit review</SubmitButton></form> : <div className="review-signin"><h3>Read it, then tell us.</h3><p>Sign in to see whether this book is eligible for a review.</p><Link to="/login" className="outline-button">Sign in</Link></div>}</div></div></section>;
}
