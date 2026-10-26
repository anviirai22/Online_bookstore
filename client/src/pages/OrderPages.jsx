import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, newIdempotencyKey } from '../api';
import { EmptyState, ErrorBanner, LoadingState, Notice, PageIntro } from '../components/Feedback';
import { formatCurrency } from '../components/BookCard';

const statusLabel = (status) => status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

function StatusBadge({ status }) { return <span className={`status-badge status-${status.toLowerCase()}`}>{statusLabel(status)}</span>; }

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api.orders.list().then((response) => setOrders(response.data.orders)).catch((requestError) => setError(requestError.message)); }, []);
  return <section className="page-section"><PageIntro eyebrow="Your reading trail" title="Orders" >A record of books that have made their way to you.</PageIntro><ErrorBanner message={error} />{!orders.length && !error ? <EmptyState title="No orders yet">Your next favourite book is waiting on the shelves.</EmptyState> : <div className="order-list">{orders.map((order) => <Link className="order-row" key={order.id} to={`/account/orders/${order.id}`}><div><span className="order-number">{order.orderNumber}</span><strong>{order.items.map((item) => item.title).join(', ')}</strong><small>{new Date(order.createdAt).toLocaleDateString()} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</small></div><div><StatusBadge status={order.status} /><strong>{formatCurrency(order.total)}</strong></div></Link>)}</div>}</section>;
}

export function OrderDetailPage({ confirmation = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.orders.get(id).then((response) => setOrder(response.data.order)).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <LoadingState label="Opening order" />;
  if (!order) return <section className="page-section"><ErrorBanner message={error || 'Order not found.'} /></section>;
  async function cancel() { setBusy(true); setError(''); try { const response = await api.orders.cancel(order.id); setOrder(response.data.order); setNotice('Your order was cancelled and stock was restored.'); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  async function retry() { setBusy(true); setError(''); try { const response = await api.orders.pay(order.id, { paymentMode: 'success' }, newIdempotencyKey()); setOrder(response.data.order); setNotice(response.data.order.status === 'CONFIRMED' ? 'Payment confirmed.' : 'Payment remains pending.'); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  return <section className="page-section order-detail-page"><ErrorBanner message={error} /><Notice message={notice} />{confirmation && <div className="confirmation-banner"><span className="confirmation-mark">✓</span><div><p className="eyebrow">It is official</p><h1>Order confirmed.</h1><p>Thank you. We have the pages moving.</p></div></div>}<div className="order-detail-heading"><div><p className="eyebrow">{order.orderNumber}</p><h1>{confirmation ? 'Your order' : 'Order details'}</h1><p className="muted-copy">Placed {new Date(order.createdAt).toLocaleString()}</p></div><StatusBadge status={order.status} /></div><div className="order-detail-layout"><div><div className="detail-card"><h2>Books in this order</h2>{order.items.map((item) => <div className="order-item" key={item.bookId}><div className="cart-thumb">{item.coverUrl ? <img src={item.coverUrl} alt="" /> : item.title.slice(0, 1)}</div><div><strong>{item.title}</strong><span>{item.author}</span><small>{item.quantity} × {formatCurrency(item.unitPrice)}</small></div><b>{formatCurrency(item.lineTotal)}</b></div>)}</div><div className="detail-card"><h2>Delivery address</h2><p className="address-copy">{order.address.fullName}<br />{order.address.line1}{order.address.line2 && <><br />{order.address.line2}</>}<br />{order.address.city}, {order.address.state} {order.address.postalCode}<br />{order.address.country}<br />{order.address.phone}</p></div></div><aside className="summary-card"><p className="eyebrow">Payment record</p><div className="summary-row"><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div><div className="summary-row"><span>Delivery</span><strong>{formatCurrency(order.shipping)}</strong></div><div className="summary-total"><span>Total</span><strong>{formatCurrency(order.total)}</strong></div>{order.status === 'PENDING_PAYMENT' && <><p className="summary-note">This order is saved while payment is unresolved. It is not confirmed yet.</p><button className="primary-button full-button" type="button" onClick={retry} disabled={busy}>Retry sandbox payment</button></>}{['CONFIRMED', 'PROCESSING', 'PACKED'].includes(order.status) && <button className="outline-button full-button" type="button" onClick={cancel} disabled={busy}>Cancel order</button>}<button className="plain-button" type="button" onClick={() => navigate('/account/orders')}>Back to orders</button></aside></div></section>;
}
