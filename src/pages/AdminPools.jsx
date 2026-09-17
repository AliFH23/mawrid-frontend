import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Alert, TextField, MenuItem, Button } from '@mui/material';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import api from '../api/axios.js';

const STATUS_STYLES = {
  OPEN: { label: 'سلة مفتوحة', bg: '#E7F8F0', color: '#047857' },
  PENDING_SUPPLIER_CONFIRMATION: { label: 'بانتظار التأكيد', bg: '#FEF3E2', color: '#B45309' },
  COMPLETED: { label: 'مؤكّدة', bg: '#0B1220', color: '#fff' },
  EXPIRED: { label: 'منتهية', bg: '#F1F5F9', color: '#64748B' },
  CANCELLED: { label: 'ملغاة', bg: '#FDECEC', color: '#DC2626' },
};

function AdminPools() {
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadPools = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pools', { params: statusFilter ? { status: statusFilter } : {} });
      setPools(res.data.pools);
    } catch {
      // stays empty, table shows the "no pools" state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, [statusFilter]);

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

  return (
    <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
      <AnimatedPage>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            السلات
          </Typography>
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">كل الحالات</MenuItem>
            <MenuItem value="OPEN">مفتوحة</MenuItem>
            <MenuItem value="PENDING_SUPPLIER_CONFIRMATION">بانتظار التأكيد</MenuItem>
            <MenuItem value="COMPLETED">مؤكّدة</MenuItem>
            <MenuItem value="EXPIRED">منتهية</MenuItem>
            <MenuItem value="CANCELLED">ملغاة</MenuItem>
          </TextField>
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : pools.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              ما في سلات مطابقة
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['السلة', 'المورد', 'الفئة', 'المنطقة', 'الكمية', 'السعر', 'الحالة', ''].map((h) => (
                      <th key={h} style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => {
                    const status = STATUS_STYLES[pool.status] || STATUS_STYLES.OPEN;
                    const categoryLabel = (pool.categoryIds || []).map((c) => c.name).join('، ');
                    return (
                      <tr key={pool._id}>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontWeight: 700, fontSize: 14 }}>{pool.productName}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{pool.supplierId?.companyName}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{categoryLabel}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{pool.deliveryZone?.name}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{pool.currentQuantity} / {pool.minQuantity}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{pool.unitPrice} د.أ</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                          <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: 11 }} />
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                          <Button size="small" variant="text" onClick={() => navigate(`/pools/${pool._id}`)}>
                            التفاصيل
                          </Button>
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

export default AdminPools;