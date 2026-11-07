const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = options.authToken || window.sessionStorage.getItem('creatorhub_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const { authToken, ...fetchOptions } = options;
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
  } catch {
    throw new ApiError('Could not reach the API. Check that the backend is running and connected.');
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(payload?.error || 'The request could not be completed.', response.status, payload?.details);
  return payload;
}

export function assetUrl(value) {
  if (typeof value !== 'string' || !value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/')) return `${API_BASE}${value}`;
  return '';
}

export async function resolveMediaUrl(value, authToken) {
  if (typeof value !== 'string' || !value) return '';
  if (!value.startsWith('/uploads/')) return assetUrl(value);
  if (!authToken) return assetUrl(value);
  const filename = value.slice('/uploads/'.length);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|gif|mp4|webm)$/i.test(filename)) return '';
  try {
    const response = await fetch(`${API_BASE}/api/uploads/${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) return '';
    return URL.createObjectURL(await response.blob());
  } catch {
    return '';
  }
}

export function getViewerKey() {
  const existing = window.localStorage.getItem('creatorhub_viewer_key');
  if (existing) return existing;
  const key = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem('creatorhub_viewer_key', key);
  return key;
}

export function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en', options).format(date);
}
