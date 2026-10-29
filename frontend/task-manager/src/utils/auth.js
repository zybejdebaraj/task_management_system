import { jwtDecode } from 'jwt-decode';

export function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const user = jwtDecode(token);
    if (!user || typeof user !== 'object' || Array.isArray(user)
      || typeof user.exp !== 'number' || !Number.isFinite(user.exp)
      || user.exp * 1000 <= Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return user;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
}

export function isAuthenticated() {
  return !!getUser();
}

export function isAdmin() {
  const user = getUser();
  return user?.role === 'admin';
}
