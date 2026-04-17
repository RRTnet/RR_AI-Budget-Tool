import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken, removeToken } from '../services/auth';
import { loginApi, getMeApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (tkn) => {
    const activeToken = tkn || token;
    if (!activeToken) return;
    try {
      const me = await getMeApi(activeToken);
      setUser(me);
    } catch (e) {
      console.error('loadUser error:', e);
      // Token invalid - clear it
      await removeToken();
      setTokenState(null);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    async function init() {
      try {
        const stored = await getToken();
        if (stored) {
          const me = await getMeApi(stored);
          setTokenState(stored);
          setUser(me);
        }
      } catch (e) {
        // Stored token invalid
        await removeToken();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password);
    const tkn = data.access_token;
    await setToken(tkn);
    setTokenState(tkn);
    const me = await getMeApi(tkn);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    loadUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
