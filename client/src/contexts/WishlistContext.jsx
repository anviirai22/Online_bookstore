import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setBooks([]);
      return;
    }
    setLoading(true);
    api.wishlist.get().then((response) => setBooks(response.data.wishlist.books)).finally(() => setLoading(false));
  }, [user]);

  async function toggle(book) {
    const exists = books.some((item) => item.id === book.id);
    const response = exists ? await api.wishlist.remove(book.id) : await api.wishlist.add(book.id);
    setBooks(response.data.wishlist.books);
  }

  return <WishlistContext.Provider value={{ books, loading, toggle }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
