import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Alert, TextField, MenuItem } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const TYPE_STYLES = {
  COMMITMENT_FEE_PAID: { label: 'دفع رسم التزام', bg: '#EFF6FF', color: '#1D4ED8' },
  COMMITMENT_FEE_REFUNDED: { label: 'استرداد رسم التزام', bg: '#F1F5F9', color: '#64748B' },
  COMMITMENT_FEE_FORFEITED: { label: 'مصادرة رسم التزام', bg: '#FDECEC', color: '#DC2626' },
  FINAL_PAYMENT: { label: 'دفع مبلغ متبقي', bg: '#EFF6FF', color: '#1D4ED8' },
  SUPPLIER_COMMISSION: { label: 'عمولة من المورد', bg: '#E7F8F0', color: '#047857' },
  BUYER_COMMISSION: { label: 'عمولة من المحلات', bg: '#E7F8F0', color: '#047857' },
};

function AdminTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', { params: typeFilter ? { type: typeFilter } : {} });
      setTransactions(res.data.transactions);
    } catch (err) {
      // logged instead of silently swallowed — makes future debugging much faster
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [typeFilter]);

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
    { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
    { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
    { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
    { key: 'users', label: 'المستخدمون', onClick: () => navigate('/admin/users') },
    { key: 'categories', label: 'الفئات', onClick: () => navigate('/admin/categories') },
    { key: 'zones', label: 'المحافظات والمناطق', onClick: () => navigate('/admin/zones') },
    { key: 'fines', label: 'الغرامات', onClick: () => navigate('/admin/fines') },
    { key: 'settings', label: 'الإعدادات المالية', onClick: () => navigate('/admin/settings') },
  ];

  const headerCard = (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>مدير المنصة</Typography>
      <Typography sx={{ color: '#8B95AB', fontSize: 12 }}>صلاحيات كاملة</Typography>
    </Box>
  );

  return (
    <DashboardLayout navItems={navItems} activeKey="transactions" headerCard={headerCard}>
      <AnimatedPage>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              السجل المالي
            </Typography>
            <Typography variant="body2" color="text.secondary">
              كل حركة مالية بالنظام، بترتيب زمني — سجل ثابت لا يُعدَّل
            </Typography>
          </Box>
          <TextField select size="small" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="">كل الأنواع</MenuItem>
            <MenuItem value="COMMITMENT_FEE_PAID">دفع رسم التزام</MenuItem>
            <MenuItem value="COMMITMENT_FEE_REFUNDED">استرداد رسم التزام</MenuItem>
            <MenuItem value="COMMITMENT_FEE_FORFEITED">مصادرة رسم التزام</MenuItem>
            <MenuItem value="FINAL_PAYMENT">دفع مبلغ متبقي</MenuItem>
            <MenuItem value="SUPPLIER_COMMISSION">عمولة من المورد</MenuItem>
            <MenuItem value="BUYER_COMMISSION">عمولة من المحلات</MenuItem>
          </TextField>
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : transactions.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              ما في حركات مالية مسجّلة لهلق
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['التاريخ والوقت', 'النوع', 'المبلغ', 'الجهة الدافعة', 'الوصف', 'السلة'].map((h) => (                      <th key={h} style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const style = TYPE_STYLES[tx.type] || TYPE_STYLES.COMMITMENT_FEE_PAID;
                    return (
                      <tr key={tx._id}>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>
                          {new Date(tx.createdAt).toLocaleString('ar-EG')}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                          <Chip label={style.label} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: 11 }} />
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontWeight: 700, fontSize: 13 }}>
                          {tx.amount.toFixed(2)} د.أ
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>
                          {tx.shopId?.shopName || tx.supplierId?.companyName || '—'}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#334155' }}>{tx.description}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{tx.poolId?.productName || '—'}</td>
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

export default AdminTransactions;