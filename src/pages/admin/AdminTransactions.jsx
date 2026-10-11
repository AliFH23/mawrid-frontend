import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Alert, Button, MenuItem, TextField } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const TYPE_STYLES = {
  COMMITMENT_FEE_PAID: { label: 'رسم التزام مدفوع', bg: '#EFF6FF', color: '#1D4ED8' },
  COMMITMENT_FEE_REFUNDED: { label: 'رسم التزام مسترد', bg: '#F1F5F9', color: '#64748B' },
  COMMITMENT_FEE_FORFEITED: { label: 'رسم التزام محتجز', bg: '#FDECEC', color: '#DC2626' },
  FINAL_PAYMENT: { label: 'دفع نهائي', bg: '#E7F8F0', color: '#047857' },
  SUPPLIER_COMMISSION: { label: 'عمولة مورد', bg: '#FEF3E2', color: '#B45309' },
  BUYER_COMMISSION: { label: 'عمولة محل', bg: '#FEF3E2', color: '#B45309' },
  LOYALTY_DISCOUNT_APPLIED: { label: 'خصم ولاء', bg: '#F3E8FF', color: '#7C3AED' },
  CASHBACK_EARNED: { label: 'كاش باك', bg: '#ECFDF5', color: '#059669' },
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
    } catch {
      // stays empty, table shows the "no transactions" state
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

  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <DashboardLayout navItems={navItems} activeKey="transactions" headerCard={headerCard}>
      {/* print rules: everything with class "no-print" (sidebar, filter, buttons) is
          hidden when printing — only the title and table survive. Using the browser's
          own print engine means Arabic text renders exactly as the browser shows it on
          screen, with zero risk of the garbled-Arabic bugs common in PDF libraries. */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          table { font-size: 11px !important; }
        }
      `}</style>

      <AnimatedPage>
        <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" fontWeight={800}>
            السجل المالي
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField select size="small" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="">كل الأنواع</MenuItem>
              {Object.entries(TYPE_STYLES).map(([key, s]) => (
                <MenuItem key={key} value={key}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" color="primary" startIcon={<PrintIcon />} onClick={() => window.print()}>
              تصدير PDF
            </Button>
          </Box>
        </Box>

        {/* this heading only shows up when printing, since the normal page title above is hidden */}
        <Typography sx={{ display: 'none', '@media print': { display: 'block' }, fontWeight: 800, fontSize: 18, mb: 2 }}>
          السجل المالي — مَورِد ({new Date().toLocaleDateString('ar-EG')})
        </Typography>

        <Paper className="print-area" sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : transactions.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              ما في حركات مالية مطابقة
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['التاريخ والوقت', 'النوع', 'المبلغ', 'الجهة الدافعة', 'الوصف', 'السلة'].map((h) => (
                      <th key={h} style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const style = TYPE_STYLES[tx.type] || { label: tx.type, bg: '#F1F5F9', color: '#64748B' };
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
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ padding: '14px 12px', fontWeight: 800, fontSize: 13 }}>
                      الإجمالي
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: 800, fontSize: 13 }}>{total.toFixed(2)} د.أ</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </Box>
          )}
        </Paper>
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default AdminTransactions;