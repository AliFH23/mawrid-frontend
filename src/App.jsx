import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import Login from './pages/Login.jsx';
import AdminLogin from './pages/AdminLogin.jsx';

function Placeholder({ label }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h4" color="secondary">
        {label} — قريبًا
      </Typography>
    </Box>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Placeholder label="لوحة تحكم الأدمن" />} />
      <Route path="/supplier" element={<Placeholder label="لوحة تحكم المورد" />} />
      <Route path="/shop" element={<Placeholder label="لوحة تحكم المحل" />} />
    </Routes>
  );
}

export default App;