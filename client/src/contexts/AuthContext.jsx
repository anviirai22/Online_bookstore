import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me()
      .then((response) => setUser(response.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const response = await api.auth.login(credentials);
    setUser(response.data.user);
    return response.data.user;
  }

  async function register(details) {
    const response = await api.auth.register(details);
    setUser(response.data.user);
    return response.data.user;
  }

  async function logout() {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
