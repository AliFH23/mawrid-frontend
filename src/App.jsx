import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/shared/Landing.jsx';
import PoolDetail from './pages/shared/PoolDetail.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import AdminLogin from './pages/auth/AdminLogin.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ShopSetup from './pages/buyer/ShopSetup.jsx';
import BuyerDashboard from './pages/buyer/BuyerDashboard.jsx';
import BuyerHistory from './pages/buyer/BuyerHistory.jsx';
import ShopSettings from './pages/buyer/ShopSettings.jsx';
import SupplierSetup from './pages/supplier/SupplierSetup.jsx';
import SupplierDashboard from './pages/supplier/SupplierDashboard.jsx';
import SupplierOrders from './pages/supplier/SupplierOrders.jsx';
import SupplierProfile from './pages/supplier/SupplierProfile.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminPools from './pages/admin/AdminPools.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminZones from './pages/admin/AdminZones.jsx';
import AdminTransactions from './pages/admin/AdminTransactions.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* shared: pool details, reachable by supplier or admin */}
      <Route path="/pools/:id" element={<ProtectedRoute allowedRoles={['supplier', 'admin']}><PoolDetail /></ProtectedRoute>} />

      {/* buyer only */}
      <Route path="/shop/setup" element={<ProtectedRoute allowedRoles={['buyer']}><ShopSetup /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute allowedRoles={['buyer']}><BuyerDashboard /></ProtectedRoute>} />
      <Route path="/shop/history" element={<ProtectedRoute allowedRoles={['buyer']}><BuyerHistory /></ProtectedRoute>} />
      <Route path="/shop/settings" element={<ProtectedRoute allowedRoles={['buyer']}><ShopSettings /></ProtectedRoute>} />

      {/* supplier only */}
      <Route path="/supplier/setup" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierSetup /></ProtectedRoute>} />
      <Route path="/supplier" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
      <Route path="/supplier/orders" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierOrders /></ProtectedRoute>} />
      <Route path="/supplier/profile" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierProfile /></ProtectedRoute>} />

      {/* admin only */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/pools" element={<ProtectedRoute allowedRoles={['admin']}><AdminPools /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategories /></ProtectedRoute>} />
      <Route path="/admin/zones" element={<ProtectedRoute allowedRoles={['admin']}><AdminZones /></ProtectedRoute>} />
      <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['admin']}><AdminTransactions /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;