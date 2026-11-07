import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.sessionStorage.getItem('creatorhub_token');
    if (!token) {
      setReady(true);
      return;
    }
    api('/api/auth/me')
      .then((result) => setUser(result.user))
      .catch(() => {
        window.sessionStorage.removeItem('creatorhub_token');
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    window.sessionStorage.setItem('creatorhub_token', result.token);
    setUser(result.user);
    return result.user;
  }

  function logout() {
    window.sessionStorage.removeItem('creatorhub_token');
    setUser(null);
  }

  const value = useMemo(() => ({ user, ready, login, logout, setUser }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
