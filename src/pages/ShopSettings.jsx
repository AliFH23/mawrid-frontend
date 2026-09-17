import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, Alert, Chip, Autocomplete, Snackbar, CircularProgress } from '@mui/material';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import api from '../api/axios.js';

const MAX_CATEGORIES = 3;

function ShopSettings() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const [shopName, setShopName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([api.get('/shops/me'), api.get('/categories'), api.get('/governorates')])
      .then(([shopRes, catRes, govRes]) => {
        const s = shopRes.data.shop;
        setShop(s);
        setShopName(s.shopName);
        setSelectedCategories(s.categoryIds || []);
        setCategories(catRes.data.categories);
        setGovernorates(govRes.data.governorates);

        if (s.deliveryZone?.governorateId) {
          setSelectedGovernorate(s.deliveryZone.governorateId);
          setSelectedZone(s.deliveryZone);
        }
      })
      .catch(() => setToast('تعذّر تحميل بيانات المحل'))
      .finally(() => {
        setLoading(false);
        setInitializing(false);
      });
  }, []);

  useEffect(() => {
    if (initializing) return;
    if (!selectedGovernorate) {
      setZones([]);
      setSelectedZone(null);
      return;
    }
    setZonesLoading(true);
    setSelectedZone(null);
    api
      .get('/delivery-zones', { params: { governorateId: selectedGovernorate._id } })
      .then((res) => setZones(res.data.zones))
      .finally(() => setZonesLoading(false));
  }, [selectedGovernorate]);

  useEffect(() => {
    if (!initializing && selectedGovernorate && zones.length === 0) {
      api
        .get('/delivery-zones', { params: { governorateId: selectedGovernorate._id } })
        .then((res) => setZones(res.data.zones));
    }
  }, [initializing]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!shopName || !selectedZone || selectedCategories.length === 0) {
      setError('الرجاء تعبئة كل الحقول');
      return;
    }

    setSaving(true);
    try {
      await api.put('/shops/me', {
        shopName,
        deliveryZone: selectedZone._id,
        categoryIds: selectedCategories.map((c) => c._id),
      });
      setToast('تم حفظ التعديلات ✓');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { key: 'pools', label: 'السلات المتاحة', onClick: () => navigate('/shop') },
    { key: 'history', label: 'سلاتي وطلباتي', onClick: () => navigate('/shop/history') },
    { key: 'settings', label: 'إعدادات المحل', onClick: () => navigate('/shop/settings') },
  ];

  const headerCard = shop && (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{shop.shopName}</Typography>
      <Typography sx={{ color: '#8B95AB', fontSize: 12 }}>{shop.deliveryZone?.name}</Typography>
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
        <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
          إعدادات المحل
        </Typography>

        <Paper sx={{ p: 3.5, borderRadius: 3, maxWidth: 520 }} elevation={0}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSave}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              اسم المحل
            </Typography>
            <TextField fullWidth value={shopName} onChange={(e) => setShopName(e.target.value)} sx={{ mb: 2.5 }} />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              فئات نشاطك (حتى {MAX_CATEGORIES} فئات)
            </Typography>
            <Autocomplete
              multiple
              options={categories}
              getOptionLabel={(o) => o.name}
              value={selectedCategories}
              isOptionEqualToValue={(o, v) => o._id === v._id}
              onChange={(e, v) => {
                if (v.length <= MAX_CATEGORIES) setSelectedCategories(v);
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => <Chip label={option.name} {...getTagProps({ index })} key={option._id} />)
              }
              renderInput={(params) => <TextField {...params} />}
              sx={{ mb: 2.5 }}
            />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              المحافظة
            </Typography>
            <Autocomplete
              options={governorates}
              getOptionLabel={(o) => o.name}
              value={selectedGovernorate}
              isOptionEqualToValue={(o, v) => o._id === v._id}
              onChange={(e, v) => setSelectedGovernorate(v)}
              renderInput={(params) => <TextField {...params} />}
              sx={{ mb: 2.5 }}
            />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              المنطقة
            </Typography>
            <Autocomplete
              options={zones}
              getOptionLabel={(o) => o.name}
              value={selectedZone}
              isOptionEqualToValue={(o, v) => o._id === v._id}
              onChange={(e, v) => setSelectedZone(v)}
              disabled={!selectedGovernorate}
              loading={zonesLoading}
              renderInput={(params) => <TextField {...params} />}
              sx={{ mb: 3.5 }}
            />

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

export default ShopSettings;