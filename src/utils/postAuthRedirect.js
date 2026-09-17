import api from '../api/axios.js';

// decides where to send the user right after login/register, based on their role
// AND whether they've already completed their Shop/Supplier profile. Centralized
// here so Login.jsx and Register.jsx don't duplicate this logic and drift apart.
export async function postAuthRedirect(user, navigate) {
  if (user.role === 'admin') {
    navigate('/admin');
    return;
  }

  if (user.role === 'buyer') {
    try {
      await api.get('/shops/me');
      navigate('/shop'); // profile already exists
    } catch {
      navigate('/shop/setup'); // 404 — no shop yet, needs to complete it first
    }
    return;
  }

  if (user.role === 'supplier') {
    try {
      await api.get('/suppliers/me');
      navigate('/supplier');
    } catch {
      navigate('/supplier/setup');
    }
  }
}