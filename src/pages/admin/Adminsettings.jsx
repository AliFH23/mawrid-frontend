import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar, CircularProgress, InputAdornment } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // stored as fractions (0.05) in the DB, edited here as whole percentages (5)
  const [commitmentFeePct, setCommitmentFeePct] = useState('');
  const [supplierCommissionPct, setSupplierCommissionPct] = useState('');
  const [buyerCommissionPct, setBuyerCommissionPct] = useState('');
  const [maxSharePct, setMaxSharePct] = useState('');

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        const s = res.data.settings;
        setCommitmentFeePct(String(Math.round(s.commitmentFeeRate * 1000) / 10));
        setSupplierCommissionPct(String(Math.round(s.supplierCommissionRate * 1000) / 10));
        setBuyerCommissionPct(String(Math.round(s.buyerCommissionRate * 1000) / 10));
        setMaxSharePct(String(Math.round(s.maxSharePerShop * 1000) / 10));
      })
      .catch(() => setToast('تعذّر تحميل الإعدادات'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const values = [commitmentFeePct, supplierCommissionPct, buyerCommissionPct, maxSharePct].map(Number);
    if (values.some((v) => isNaN(v) || v < 0 || v > 100)) {
      setError('كل النسب لازم تكون أرقام بين 0 و100');
      return;
    }

    setSaving(true);
    try {
      await api.put('/settings', {
        commitmentFeeRate: Number(commitmentFeePct) / 100,
        supplierCommissionRate: Number(supplierCommissionPct) / 100,
        buyerCommissionRate: Number(buyerCommissionPct) / 100,
        maxSharePerShop: Number(maxSharePct) / 100,
      });
      setToast('تم حفظ الإعدادات — رح تنطبق على كل عملية جديدة فورًا ✓');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
    { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
    { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
    { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
    { key: 'fines', label: 'الغرامات', onClick: () => navigate('/admin/fines') },
    { key: 'settings', label: 'الإعدادات المالية', onClick: () => navigate('/admin/settings') },
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
      <DashboardLayout navItems={navItems} activeKey="settings" headerCard={headerCard}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} activeKey="settings" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          الإعدادات المالية
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          تحكّمي بنسب المنصة مباشرة — أي تعديل هون بينطبق فورًا على كل عملية جديدة (ما بيأثر على السلات المؤكّدة سابقًا)
        </Typography>

        <Paper sx={{ p: 3.5, borderRadius: 3, maxWidth: 480 }} elevation={0}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSave}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              رسم الالتزام (على المحل، وقت الانضمام)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={commitmentFeePct}
              onChange={(e) => setCommitmentFeePct(e.target.value)}
              sx={{ mb: 2.5 }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              عمولة المنصة من المورد (وقت التأكيد)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={supplierCommissionPct}
              onChange={(e) => setSupplierCommissionPct(e.target.value)}
              sx={{ mb: 2.5 }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              عمولة المنصة من المحل (على المبلغ المتبقي)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={buyerCommissionPct}
              onChange={(e) => setBuyerCommissionPct(e.target.value)}
              sx={{ mb: 2.5 }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              أقصى نصيب لمحل واحد من الحد الأدنى (قاعدة التجميع)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={maxSharePct}
              onChange={(e) => setMaxSharePct(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              helperText="مثلاً 70% يعني ولا محل بيقدر ياخد أكتر من 70% من الحد الأدنى لحاله — يضمن مشاركة أكتر من محل دايمًا"
            />

            <Button fullWidth type="submit" variant="contained" color="primary" size="large" disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </Box>
        </Paper>
      </AnimatedPage>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default AdminSettings;