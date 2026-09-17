import { Navigate } from 'react-router-dom';

// wraps any route that requires login. Optionally pass allowedRoles to also
// restrict by role — a buyer typing /admin in the URL bar gets redirected to
// their own dashboard instead of ever seeing the admin shell render.
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('mawrid_token');
  const userStr = localStorage.getItem('mawrid_user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'supplier') return <Navigate to="/supplier" replace />;
    return <Navigate to="/shop" replace />;
  }

  return children;
}

export default ProtectedRoute;