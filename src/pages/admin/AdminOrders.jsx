import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const STATUS_STYLES = {
  CONFIRMED: { label: 'مؤكّد', bg: '#E7F8F0', color: '#047857' },
  REJECTED: { label: 'مرفوض', bg: '#FDECEC', color: '#DC2626' },
};

function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/purchase-orders')
      .then((res) => setOrders(res.data.purchaseOrders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
    { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
    { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
    { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
    { key: 'users', label: 'المستخدمون', onClick: () => navigate('/admin/users') },
    { key: 'categories', label: 'الفئات', onClick: () => navigate('/admin/categories') },
    { key: 'zones', label: 'المحافظات والمناطق', onClick: () => navigate('/admin/zones') },
  ];

  const headerCard = (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>مدير المنصة</Typography>
      <Typography sx={{ color: '#8B95AB', fontSize: 12 }}>صلاحيات كاملة</Typography>
    </Box>
  );

  const totalCommission = orders.filter((o) => o.status === 'CONFIRMED').reduce((sum, o) => sum + o.supplierCommission + o.buyersCommission, 0);

  return (
    <DashboardLayout navItems={navItems} activeKey="orders" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          طلبات الشراء
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          إجمالي عمولات المنصة من الطلبات المؤكّدة: <b>{totalCommission.toFixed(1)} د.أ</b>
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : orders.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ما في طلبات شراء بالنظام لهلق
          </Alert>
        ) : (
          <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['الكمية', 'المبلغ الإجمالي', 'عمولة المورد', 'عمولة المحلات', 'إجمالي العمولة', 'الحالة', 'التاريخ'].map((h) => (
                      <th key={h} style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const status = STATUS_STYLES[o.status] || STATUS_STYLES.CONFIRMED;
                    return (
                      <tr key={o._id}>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{o.totalQuantity}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{o.totalAmount.toFixed(1)} د.أ</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{o.supplierCommission.toFixed(1)} د.أ</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{o.buyersCommission.toFixed(1)} د.أ</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, fontWeight: 700, color: '#047857' }}>
                          {(o.supplierCommission + o.buyersCommission).toFixed(1)} د.أ
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

export default AdminOrders;