import jwtDecode from 'jwt-decode';

export function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  return jwtDecode(token);
}

export function isAdmin() {
  const user = getUser();
  return user?.role === 'admin';
}