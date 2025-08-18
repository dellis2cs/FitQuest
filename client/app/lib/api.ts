export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');
// 'https://fitquest-bgf1.onrender.com'
export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path: string, options?: RequestInit) {
  const url = buildApiUrl(path);
  return fetch(url, options);
}


