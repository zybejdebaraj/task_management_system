import { jwtDecode } from 'jwt-decode';

export function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  return jwtDecode(token); // { id, role }
}

export function isAuthenticated() {
  return !!getUser();
}

export function isAdmin() {
  const user = getUser();
  return user?.role === 'admin';
}