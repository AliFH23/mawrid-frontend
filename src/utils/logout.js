export function logout(navigate) {
  localStorage.removeItem('mawrid_token');
  localStorage.removeItem('mawrid_user');
  navigate('/login');
}