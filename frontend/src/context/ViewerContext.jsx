import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const ViewerContext = createContext(null);
const TOKEN_KEY = 'creatorhub_viewer_token';

export function ViewerProvider({ children }) {
  const [viewer, setViewer] = useState(null);
  const [ready, setReady] = useState(false);
  const [notificationUnread, setNotificationUnread] = useState(0);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setReady(true);
      return;
    }
    api('/api/viewers/me', { authToken: token })
      .then((result) => setViewer(result.viewer))
      .catch(() => window.localStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!viewer) {
      setNotificationUnread(0);
      return undefined;
    }
    let active = true;
    const refresh = () => api('/api/viewers/notifications/unread-count', {
      authToken: window.localStorage.getItem(TOKEN_KEY),
    }).then((result) => {
      if (active) setNotificationUnread(result.unread || 0);
    }).catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [viewer]);

  async function register(name, email, password) {
    const result = await api('/api/viewers/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    window.localStorage.setItem(TOKEN_KEY, result.token);
    setViewer(result.viewer);
    return result.viewer;
  }

  async function login(email, password) {
    const result = await api('/api/viewers/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    window.localStorage.setItem(TOKEN_KEY, result.token);
    setViewer(result.viewer);
    return result.viewer;
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setViewer(null);
    setNotificationUnread(0);
  }

  async function updateProfile(name, bio) {
    const result = await api('/api/viewers/me', {
      method: 'PATCH',
      authToken: window.localStorage.getItem(TOKEN_KEY),
      body: JSON.stringify({ name, bio }),
    });
    setViewer(result.viewer);
    return result.viewer;
  }

  async function getBookmarks() {
    return (await api('/api/bookmarks', { authToken: window.localStorage.getItem(TOKEN_KEY) })).bookmarks || [];
  }

  async function saveBookmark(contentId) {
    return api(`/api/bookmarks/${contentId}`, { method: 'POST', authToken: window.localStorage.getItem(TOKEN_KEY) });
  }

  async function removeBookmark(contentId) {
    return api(`/api/bookmarks/${contentId}`, { method: 'DELETE', authToken: window.localStorage.getItem(TOKEN_KEY) });
  }

  const getMyPosts = useCallback(async () => {
    return (await api('/api/viewers/my-posts', { authToken: window.localStorage.getItem(TOKEN_KEY) })).posts || [];
  }, []);

  const getNotifications = useCallback(async () => {
    return api('/api/viewers/notifications', { authToken: window.localStorage.getItem(TOKEN_KEY) });
  }, []);

  async function refreshNotificationUnread() {
    const result = await api('/api/viewers/notifications/unread-count', { authToken: window.localStorage.getItem(TOKEN_KEY) });
    setNotificationUnread(result.unread || 0);
    return result.unread || 0;
  }

  async function markNotificationRead(notificationId) {
    await api(`/api/viewers/notifications/${notificationId}/read`, {
      method: 'PATCH',
      authToken: window.localStorage.getItem(TOKEN_KEY),
    });
    setNotificationUnread((count) => Math.max(0, count - 1));
  }

  async function markAllNotificationsRead() {
    await api('/api/viewers/notifications/read-all', {
      method: 'PATCH',
      authToken: window.localStorage.getItem(TOKEN_KEY),
    });
    setNotificationUnread(0);
  }

  const value = useMemo(() => ({
    viewer,
    ready,
    notificationUnread,
    register,
    login,
    logout,
    updateProfile,
    getBookmarks,
    saveBookmark,
    removeBookmark,
    getMyPosts,
    getNotifications,
    refreshNotificationUnread,
    markNotificationRead,
    markAllNotificationsRead,
  }), [viewer, ready, notificationUnread]);

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export function useViewer() {
  const value = useContext(ViewerContext);
  if (!value) throw new Error('useViewer must be used inside ViewerProvider.');
  return value;
}
