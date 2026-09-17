import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Alert, LinearProgress } from '@mui/material';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import api from '../api/axios.js';

const ORDER_STATUS = {
  CONFIRMED: { label: 'مؤكّد', bg: '#E7F8F0', color: '#047857' },
  REJECTED: { label: 'مرفوض', bg: '#FDECEC', color: '#DC2626' },
};

function SupplierOrders() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/suppliers/me'), api.get('/purchase-orders/me')])
      .then(([supRes, ordersRes]) => {
        setSupplier(supRes.data.supplier);
        setOrders(ordersRes.data.purchaseOrders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const navItems = [
    { key: 'pools', label: 'سلاتي', onClick: () => navigate('/supplier') },
    { key: 'orders', label: 'طلبات الشراء المؤكّدة', onClick: () => navigate('/supplier/orders') },
    { key: 'profile', label: 'ملف الشركة', onClick: () => navigate('/supplier/profile') },
  ];

  const headerCard = supplier && (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, mb: 1 }}>{supplier.companyName}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ color: '#34D399', fontSize: 12, fontWeight: 800 }}>{supplier.reliabilityScore}</Typography>
        <LinearProgress
          variant="determinate"
          value={supplier.reliabilityScore}
          sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: '#22304F', '& .MuiLinearProgress-bar': { bgcolor: '#34D399', borderRadius: 999 } }}
        />
      </Box>
    </Box>
  );

  const totalEarnings = orders.filter((o) => o.status === 'CONFIRMED').reduce((sum, o) => sum + o.totalAmount - o.supplierCommission, 0);

  return (
    <DashboardLayout navItems={navItems} activeKey="orders" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          طلبات الشراء
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          صافي أرباحك من الطلبات المؤكّدة: <b>{totalEarnings.toFixed(1)} د.أ</b>
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : orders.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ما في طلبات شراء مسجّلة لهلق
          </Alert>
        ) : (
          <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['الكمية الإجمالية', 'المبلغ الإجمالي', 'عمولة المنصة', 'صافي أرباحك', 'الحالة', 'التاريخ'].map((h) => (
                      <th key={h} style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const status = ORDER_STATUS[o.status] || ORDER_STATUS.CONFIRMED;
                    return (
                      <tr key={o._id}>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{o.totalQuantity}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{o.totalAmount.toFixed(1)} د.أ</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#DC2626' }}>-{o.supplierCommission.toFixed(1)} د.أ</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, fontWeight: 700, color: '#047857' }}>
                          {(o.totalAmount - o.supplierCommission).toFixed(1)} د.أ
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                          <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: 11 }} />
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>
                          {o.confirmedAt ? new Date(o.confirmedAt).toLocaleDateString('ar-EG') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Paper>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default SupplierOrders;