import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorBanner, EmptyState, Notice } from '../components/Feedback';
import { formatCurrency } from '../components/BookCard';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const { cart, update, remove } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function changeQuantity(item, quantity) {
    if (quantity < 1) return remove(item.book.id);
    setError('');
    try { await update(item.book.id, quantity); } catch (requestError) { setError(requestError.message); }
  }

  if (!cart.items.length) return <section className="page-section narrow-section"><EmptyState title="Your cart is taking a quiet moment">Add a book or two and they will show up here.</EmptyState><Link to="/books" className="primary-button">Browse books</Link></section>;

  return <section className="page-section"><div className="page-intro compact"><p className="eyebrow">Before the next chapter</p><h1>Your cart</h1><p className="intro-copy">{cart.itemCount} {cart.itemCount === 1 ? 'book' : 'books'} ready to travel.</p></div><ErrorBanner message={error} /><div className="cart-layout"><div className="cart-items">{cart.items.map((item) => <article className="cart-item" key={item.book.id}><Link to={`/books/${item.book.id}`} className="cart-thumb">{item.book.coverUrl ? <img src={item.book.coverUrl} alt="" /> : item.book.title.slice(0, 1)}</Link><div className="cart-item-info"><p className="eyebrow">{item.book.category?.name}</p><h2><Link to={`/books/${item.book.id}`}>{item.book.title}</Link></h2><p>{item.book.author}</p><span>{formatCurrency(item.book.price)} each</span></div><div className="cart-item-actions"><label className="quantity-field" htmlFor={`quantity-${item.book.id}`}>Qty<input id={`quantity-${item.book.id}`} type="number" min="1" max={item.stockQuantity || 1} value={item.quantity} onChange={(event) => changeQuantity(item, Number(event.target.value))} /></label><strong>{formatCurrency(item.lineTotal)}</strong><button className="plain-button danger-text" type="button" onClick={() => remove(item.book.id)}>Remove</button></div></article>)}</div><aside className="summary-card"><p className="eyebrow">Order summary</p><h2>Almost yours.</h2><div className="summary-row"><span>Subtotal</span><strong>{formatCurrency(cart.subtotal)}</strong></div><div className="summary-row"><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total before delivery</span><strong>{formatCurrency(cart.subtotal)}</strong></div><button className="primary-button full-button" type="button" onClick={() => user ? navigate('/checkout') : navigate('/login', { state: { from: '/checkout' } })}>{user ? 'Continue to checkout' : 'Sign in to checkout'}</button><p className="summary-note">You can browse and keep a temporary cart before signing in.</p></aside></div><Notice message={!user ? 'Guest cart: this cart is saved in this browser and will merge into your account after sign in.' : ''} /></section>;
}
