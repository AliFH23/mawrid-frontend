import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ShopSetup from './pages/ShopSetup.jsx';
import SupplierSetup from './pages/SupplierSetup.jsx';
import BuyerDashboard from './pages/BuyerDashboard.jsx';
import BuyerHistory from './pages/BuyerHistory.jsx';
import ShopSettings from './pages/ShopSettings.jsx';
import SupplierDashboard from './pages/SupplierDashboard.jsx';
import SupplierOrders from './pages/SupplierOrders.jsx';
import SupplierProfile from './pages/SupplierProfile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminPools from './pages/AdminPools.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminCategories from './pages/AdminCategories.jsx';
import AdminZones from './pages/AdminZones.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminTransactions from './pages/AdminTransactions.jsx';
function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/shop/setup" element={<ProtectedRoute allowedRoles={['buyer']}><ShopSetup /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute allowedRoles={['buyer']}><BuyerDashboard /></ProtectedRoute>} />
      <Route path="/shop/history" element={<ProtectedRoute allowedRoles={['buyer']}><BuyerHistory /></ProtectedRoute>} />
      <Route path="/shop/settings" element={<ProtectedRoute allowedRoles={['buyer']}><ShopSettings /></ProtectedRoute>} />

      <Route path="/supplier/setup" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierSetup /></ProtectedRoute>} />
      <Route path="/supplier" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
      <Route path="/supplier/orders" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierOrders /></ProtectedRoute>} />
      <Route path="/supplier/profile" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierProfile /></ProtectedRoute>} />

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