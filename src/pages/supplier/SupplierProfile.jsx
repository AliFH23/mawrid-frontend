import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar, CircularProgress, LinearProgress, Rating } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

function SupplierProfile() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    api
      .get('/suppliers/me')
      .then((res) => {
        setSupplier(res.data.supplier);
        setCompanyName(res.data.supplier.companyName);
        setCompanyDescription(res.data.supplier.companyDescription || '');
        setRegNumber(res.data.supplier.commercialRegistrationNumber || '');
      })
      .catch(() => setToast('تعذّر تحميل بيانات الشركة'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!companyName) {
      setError('الرجاء إدخال اسم الشركة');
      return;
    }
    if (!regNumber) {
      setError('الرجاء إدخال الرقم التجاري / السجل التجاري');
      return;
    }
    setSaving(true);
    try {
      await api.put('/suppliers/me', { companyName, companyDescription, commercialRegistrationNumber: regNumber });
      setToast('تم حفظ التعديلات ✓');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} activeKey="profile" headerCard={headerCard}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} activeKey="profile" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
          ملف الشركة
        </Typography>

        <Paper sx={{ p: 3.5, borderRadius: 3, maxWidth: 480 }} elevation={0}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSave}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              اسم الشركة
            </Typography>
            <TextField fullWidth value={companyName} onChange={(e) => setCompanyName(e.target.value)} sx={{ mb: 2.5 }} />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              الرقم التجاري / السجل التجاري
            </Typography>
            <TextField fullWidth value={regNumber} onChange={(e) => setRegNumber(e.target.value)} sx={{ mb: 2.5 }} />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              وصف الشركة
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="مثلاً: موزّع مواد غذائية جملة، متخصصين بزيوت ومعلّبات، خبرة أكتر من 10 سنين بالسوق"
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">درجة الموثوقية</Typography>
                <Typography fontWeight={800}>{supplier.reliabilityScore} / 100</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">عدد الرفض</Typography>
                <Typography fontWeight={800}>{supplier.rejectionCount}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">تقييم المحلات</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={supplier.averageRating || 0} precision={0.1} readOnly size="small" />
                  <Typography fontWeight={800} fontSize={13}>
                    ({supplier.ratingCount || 0})
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Button fullWidth type="submit" variant="contained" color="primary" size="large" disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </Box>
        </Paper>
      </AnimatedPage>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default SupplierProfile;