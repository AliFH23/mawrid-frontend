import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const STATUS_STYLES = {
  OPEN: { label: 'سلة مفتوحة', bg: '#E7F8F0', color: '#047857' },
  PENDING_SUPPLIER_CONFIRMATION: { label: 'بانتظار التأكيد', bg: '#FEF3E2', color: '#B45309' },
  COMPLETED: { label: 'مؤكّدة', bg: '#0B1220', color: '#fff' },
  EXPIRED: { label: 'منتهية', bg: '#F1F5F9', color: '#64748B' },
  CANCELLED: { label: 'ملغاة', bg: '#FDECEC', color: '#DC2626' },
};

function StatCard({ label, value, sub }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={800}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="primary.dark" fontWeight={700} sx={{ mt: 0.5, display: 'block' }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [users, setUsers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/pools'), api.get('/admin/users'), api.get('/purchase-orders')])
      .then(([poolsRes, usersRes, poRes]) => {
        setPools(poolsRes.data.pools);
        setUsers(usersRes.data.users);
        setPurchaseOrders(poRes.data.purchaseOrders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activePools = pools.filter((p) => p.status === 'OPEN' || p.status === 'PENDING_SUPPLIER_CONFIRMATION').length;
  const pendingConfirmation = pools.filter((p) => p.status === 'PENDING_SUPPLIER_CONFIRMATION').length;
  const totalCommission = purchaseOrders
    .filter((po) => po.status === 'CONFIRMED')
    .reduce((sum, po) => sum + po.supplierCommission + po.buyersCommission, 0);

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
    { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
    { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
    { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
    { key: 'messages', label: 'رسائل التواصل', onClick: () => navigate('/admin/messages') },
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

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} activeKey="overview" headerCard={headerCard}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} activeKey="overview" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
          نظرة عامة
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="السلات النشطة" value={activePools} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="إجمالي المستخدمين" value={users.length} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="بانتظار تأكيد المورد" value={pendingConfirmation} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="إجمالي العمولات" value={`${totalCommission.toFixed(1)} د.أ`} />
          </Grid>
        </Grid>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            أحدث السلات
          </Typography>

          {pools.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              ما في سلات بالنظام لهلق
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['السلة', 'الفئة', 'المنطقة', 'الكمية', 'الحالة'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'right',
                          fontSize: 12,
                          color: '#94A3B8',
                          padding: '10px 12px',
                          borderBottom: '1px solid #EEF2F6',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pools.slice(0, 10).map((pool) => {
                    const status = STATUS_STYLES[pool.status] || STATUS_STYLES.OPEN;
                    const categoryLabel = (pool.categoryIds || []).map((c) => c.name).join('، ');
                    return (
                      <tr key={pool._id}>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontWeight: 700, fontSize: 14 }}>
                          {pool.productName}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>
                          {categoryLabel}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>
                          {pool.deliveryZone?.name}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>
                          {pool.currentQuantity} / {pool.minQuantity}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: 11 }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          )}
        </Paper>
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default AdminDashboard;