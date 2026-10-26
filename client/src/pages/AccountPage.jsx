import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageIntro } from '../components/Feedback';

export default function AccountPage() {
  const { user } = useAuth();
  return <section className="page-section"><PageIntro eyebrow="Your reading life" title="Account">A small home base for your Leaf &amp; Line activity.</PageIntro><div className="account-grid"><div className="account-card"><p className="eyebrow">Signed in as</p><h2>{user.name}</h2><p>{user.email}</p><span className="status-badge status-confirmed">{user.role === 'admin' ? 'Administrator' : 'Customer'}</span></div><Link to="/account/orders" className="account-card account-link"><p className="eyebrow">Your orders</p><h2>Follow the trail →</h2><p>See current status, delivery details, and cancellation options.</p></Link><Link to="/wishlist" className="account-card account-link"><p className="eyebrow">Your wishlist</p><h2>Keep collecting →</h2><p>Save books that deserve a second look.</p></Link></div></section>;
}
