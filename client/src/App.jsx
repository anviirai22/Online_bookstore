import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { AdminRoute, ProtectedRoute } from './components/Guards';
import HomePage from './pages/HomePage';
import BookDetailsPage from './pages/BookDetailsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { OrderDetailPage, OrdersPage } from './pages/OrderPages';
import WishlistPage from './pages/WishlistPage';
import AccountPage from './pages/AccountPage';
import { AdminBooksPage, AdminCategoriesPage, AdminDashboardPage, AdminOrdersPage, AdminReviewsPage, AdminUsersPage } from './pages/AdminPages';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

function NotFound() {
  return <section className="page-section narrow-section"><p className="eyebrow">404</p><h1>That page wandered off.</h1><p className="intro-copy">The link may have changed, but there are plenty of good places to start again.</p><a className="primary-button" href="/">Return home</a></section>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><CartProvider><WishlistProvider><Routes><Route element={<Layout />}><Route path="/" element={<HomePage />} /><Route path="/books" element={<HomePage />} /><Route path="/books/:id" element={<BookDetailsPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/cart" element={<CartPage />} /><Route element={<ProtectedRoute />}><Route path="/checkout" element={<CheckoutPage />} /><Route path="/wishlist" element={<WishlistPage />} /><Route path="/account" element={<AccountPage />} /><Route path="/account/orders" element={<OrdersPage />} /><Route path="/account/orders/:id" element={<OrderDetailPage />} /><Route path="/orders/:id/confirmation" element={<OrderDetailPage confirmation />} /></Route><Route element={<AdminRoute />}><Route path="/admin" element={<AdminLayout />}><Route index element={<AdminDashboardPage />} /><Route path="books" element={<AdminBooksPage />} /><Route path="categories" element={<AdminCategoriesPage />} /><Route path="orders" element={<AdminOrdersPage />} /><Route path="reviews" element={<AdminReviewsPage />} /><Route path="users" element={<AdminUsersPage />} /></Route></Route><Route path="*" element={<NotFound />} /></Route></Routes></WishlistProvider></CartProvider></AuthProvider></BrowserRouter>;
}
