import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api, newIdempotencyKey } from '../api';
import { ErrorBanner, Notice } from '../components/Feedback';
import { Field, SubmitButton } from '../components/Forms';
import { formatCurrency } from '../components/BookCard';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutPage() {
  const { cart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ fullName: user?.name || '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', phone: '' });
  const [paymentMode, setPaymentMode] = useState('success');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  async function createOrder(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await api.orders.create({ address, paymentMode }, newIdempotencyKey());
      const order = response.data.order;
      if (order.status === 'PENDING_PAYMENT') {
        setPendingOrder(order);
        setNotice('The sandbox payment is pending. Retry it below when ready.');
      } else navigate(`/orders/${order.id}/confirmation`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.payload?.data?.order) setPendingOrder(requestError.payload.data.order);
      setError(requestError.message);
    } finally { setBusy(false); }
  }

  async function retryPayment() {
    if (!pendingOrder) return;
    setBusy(true); setError('');
    try {
      const response = await api.orders.pay(pendingOrder.id, { paymentMode: 'success' }, newIdempotencyKey());
      if (response.data.order.status === 'CONFIRMED') navigate(`/orders/${pendingOrder.id}/confirmation`);
      else setNotice('Payment is still pending. You can retry again.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  if (!cart.items.length) return <section className="page-section narrow-section"><ErrorBanner message="Your cart is empty. Add a book before checking out." /><Link to="/books" className="primary-button">Return to catalogue</Link></section>;

  return <section className="page-section"><div className="page-intro compact"><p className="eyebrow">A good book, on its way</p><h1>Delivery &amp; payment</h1><p className="intro-copy">Review the details before the sandbox confirms your order.</p></div><ErrorBanner message={error} /><Notice message={notice} /><div className="checkout-layout"><form className="checkout-form" onSubmit={createOrder}><div className="form-card"><div className="form-card-heading"><span>01</span><div><h2>Where should we send it?</h2><p>We use this only for your order record.</p></div></div><div className="form-grid"><Field label="Full name" name="fullName" value={address.fullName} onChange={(event) => setAddress({ ...address, fullName: event.target.value })} required /><Field label="Address line 1" name="line1" value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} required /><Field label="Address line 2" name="line2" value={address.line2} onChange={(event) => setAddress({ ...address, line2: event.target.value })} /><Field label="City" name="city" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} required /><Field label="State" name="state" value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} required /><Field label="Postal code" name="postalCode" value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value })} required /><Field label="Country" name="country" value={address.country} onChange={(event) => setAddress({ ...address, country: event.target.value })} required /><Field label="Phone" name="phone" type="tel" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} required /></div></div><div className="form-card"><div className="form-card-heading"><span>02</span><div><h2>Choose a sandbox outcome</h2><p>This is a deterministic local test adapter, not a live charge.</p></div></div><label className="payment-choice"><input type="radio" name="paymentMode" value="success" checked={paymentMode === 'success'} onChange={(event) => setPaymentMode(event.target.value)} /><span><strong>Simulate success</strong><small>Confirm the order and reserve the books.</small></span></label><label className="payment-choice"><input type="radio" name="paymentMode" value="failure" checked={paymentMode === 'failure'} onChange={(event) => setPaymentMode(event.target.value)} /><span><strong>Simulate failure</strong><small>Keep an auditable pending order and show a retry path.</small></span></label><label className="payment-choice"><input type="radio" name="paymentMode" value="pending" checked={paymentMode === 'pending'} onChange={(event) => setPaymentMode(event.target.value)} /><span><strong>Simulate pending</strong><small>Leave payment pending without confirming the order.</small></span></label></div><SubmitButton busy={busy}>Confirm sandbox payment</SubmitButton>{pendingOrder && <button className="outline-button" type="button" onClick={retryPayment} disabled={busy}>Retry payment successfully</button>}</form><aside className="summary-card checkout-summary"><p className="eyebrow">Your order</p>{cart.items.map((item) => <div className="summary-item" key={item.book.id}><span>{item.quantity} × {item.book.title}</span><strong>{formatCurrency(item.lineTotal)}</strong></div>)}<div className="summary-row"><span>Subtotal</span><strong>{formatCurrency(cart.subtotal)}</strong></div><div className="summary-row"><span>Delivery</span><strong>{formatCurrency(cart.shipping)}</strong></div><div className="summary-total"><span>Final total</span><strong>{formatCurrency(cart.total)}</strong></div><p className="summary-note">Prices and stock are rechecked by the server when you confirm.</p></aside></div></section>;
}
