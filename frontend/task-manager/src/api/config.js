const env = import.meta.env || {};

export function resolveBackendUrl(configuredUrl, development = false) {
  return (configuredUrl?.trim() || (development ? 'http://localhost:5000' : '')).replace(/\/+$/, '');
}

export const backendUrl = resolveBackendUrl(env.VITE_API_URL, env.DEV);

export function uploadUrl(path, baseUrl = backendUrl) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}
