import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

function navClass({ isActive }) {
  return isActive ? 'nav-link active' : 'nav-link';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <div className="announcement">Free delivery on orders over Rs. 2,000 <span>•</span> Small press, big ideas.</div>
      <header className="site-header">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)} aria-label="Leaf and Line home">
          <span className="brand-mark">L</span>
          <span><strong>Leaf &amp; Line</strong><small>BOOKS FOR A LIFE IN MOTION</small></span>
        </Link>
        <button className="menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation">{menuOpen ? 'Close' : 'Menu'}</button>
        <nav className={menuOpen ? 'site-nav open' : 'site-nav'} aria-label="Main navigation">
          <NavLink to="/books" className={navClass} onClick={() => setMenuOpen(false)}>Browse</NavLink>
          {user && <NavLink to="/wishlist" className={navClass} onClick={() => setMenuOpen(false)}>Wishlist</NavLink>}
          {user && <NavLink to="/account/orders" className={navClass} onClick={() => setMenuOpen(false)}>Orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={navClass} onClick={() => setMenuOpen(false)}>Admin desk</NavLink>}
          <NavLink to="/cart" className="cart-link" onClick={() => setMenuOpen(false)} aria-label={`Cart with ${cart.itemCount || 0} items`}>
            Cart <span className="cart-count">{cart.itemCount || 0}</span>
          </NavLink>
          {user ? <button className="nav-button" type="button" onClick={handleLogout}>Sign out</button> : <NavLink to="/login" className="nav-button" onClick={() => setMenuOpen(false)}>Sign in</NavLink>}
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div><Link to="/" className="footer-brand">Leaf &amp; Line</Link><p>A considered corner for curious readers.</p></div>
        <div className="footer-links"><Link to="/books">Catalogue</Link><Link to={user ? '/account' : '/login'}>Your account</Link><Link to={user?.role === 'admin' ? '/admin' : '/login'}>Admin desk</Link></div>
        <p className="footer-note">Local sandbox checkout<br />Built for thoughtful reading.</p>
      </footer>
    </div>
  );
}
