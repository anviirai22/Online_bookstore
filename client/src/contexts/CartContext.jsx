import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'leaf-line-guest-cart';

function guestCartData() {
  const items = readGuestCart();
  return {
    items: items.map((item) => ({ ...item, stockQuantity: item.book.stockQuantity, lineTotal: (item.book.price || 0) * item.quantity, lineTotalCents: (item.book.priceCents || 0) * item.quantity })),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + (item.book.price || 0) * item.quantity, 0),
    subtotalCents: items.reduce((sum, item) => sum + (item.book.priceCents || 0) * item.quantity, 0),
  };
}

function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0, subtotalCents: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      if (!user) {
        if (!cancelled) setCart(guestCartData());
        return;
      }
      setLoading(true);
      try {
        const guestItems = readGuestCart();
        const response = guestItems.length ? await api.cart.merge(guestItems.map((item) => ({ bookId: item.book.id, quantity: item.quantity }))) : await api.cart.get();
        if (guestItems.length) localStorage.removeItem(STORAGE_KEY);
        if (!cancelled) setCart(response.data.cart);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  async function refresh() {
    if (!user) return;
    const response = await api.cart.get();
    setCart(response.data.cart);
  }

  async function add(book, quantity = 1) {
    setError('');
    if (!user) {
      const items = readGuestCart();
      const existing = items.find((item) => item.book.id === book.id);
      const nextQuantity = (existing?.quantity || 0) + quantity;
      if (nextQuantity > book.stockQuantity) throw new Error(`Only ${book.stockQuantity} item(s) are currently available.`);
      if (existing) existing.quantity = nextQuantity;
      else items.push({ book, quantity });
      saveGuestCart(items);
      setCart(guestCartData());
      return;
    }
    const response = await api.cart.add(book.id, quantity);
    setCart(response.data.cart);
  }

  async function update(bookId, quantity) {
    if (!user) {
      const current = readGuestCart().find((item) => item.book.id === bookId);
      if (!current) throw new Error('This book is not in your cart.');
      if (quantity > current.book.stockQuantity) throw new Error(`Only ${current.book.stockQuantity} item(s) are currently available.`);
      const items = readGuestCart().map((item) => item.book.id === bookId ? { ...item, quantity } : item);
      saveGuestCart(items);
      setCart(guestCartData());
      return;
    }
    const response = await api.cart.update(bookId, quantity);
    setCart(response.data.cart);
  }

  async function remove(bookId) {
    if (!user) {
      const items = readGuestCart().filter((item) => item.book.id !== bookId);
      saveGuestCart(items);
      setCart(guestCartData());
      return;
    }
    const response = await api.cart.remove(bookId);
    setCart(response.data.cart);
  }

  return <CartContext.Provider value={{ cart, loading, error, add, update, remove, refresh }}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
