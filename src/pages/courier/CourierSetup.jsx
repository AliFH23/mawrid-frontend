import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, TextField, MenuItem, Button, Alert, Autocomplete, CircularProgress } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import LocationMapButton from '../../components/LocationMapButton.jsx';
import api from '../../api/axios.js';
import { useLocationPicker } from '../../hooks/useLocationPicker.js';

export const VEHICLE_OPTIONS = [
  { value: 'MOTORCYCLE', label: 'دراجة نارية' },
  { value: 'CAR', label: 'سيارة' },
  { value: 'VAN', label: 'فان' },
  { value: 'TRUCK', label: 'شاحنة' },
];

// first-time setup AND later edits of the courier profile (zone + vehicle)
function CourierSetup() {
  const navigate = useNavigate();
  const [existing, setExisting] = useState(null);
  const [vehicleType, setVehicleType] = useState('MOTORCYCLE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    governorates,
    zones,
    zonesLoading,
    selectedGovernorate,
    selectedZone,
    setSelectedGovernorate,
    setSelectedZone,
    presetLocation,
  } = useLocationPicker();

  useEffect(() => {
    api
      .get('/couriers/me')
      .then((res) => {
        const c = res.data.courier;
        setExisting(c);
        setVehicleType(c.vehicleType);
        presetLocation(c.deliveryZone.governorateId, c.deliveryZone);
      })
      .catch(() => {}) // 404 = first-time setup
      .finally(() => setLoading(false));
    // presetLocation is stable enough for a one-time load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedZone) {
      setError('الرجاء اختيار المحافظة والمنطقة اللي بتوصّل فيها');
      return;
    }
    setSaving(true);
    try {
      const body = { deliveryZone: selectedZone._id, vehicleType };
      if (existing) await api.put('/couriers/me', body);
      else await api.post('/couriers', body);
      navigate('/courier');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { key: 'deliveries', label: 'التوصيلات', onClick: () => navigate('/courier') },
    { key: 'profile', label: 'ملفي ومنطقتي', onClick: () => navigate('/courier/setup') },
  ];

  const headerCard = (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>مندوب توصيل</Typography>
      <Typography sx={{ color: '#8B95AB', fontSize: 12 }}>
        {existing ? `${existing.deliveryZone.governorateId?.name} — ${existing.deliveryZone.name}` : 'إعداد الحساب'}
      </Typography>
    </Box>
  );

  return (
    <DashboardLayout navItems={navItems} activeKey="profile" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          {existing ? 'ملفي ومنطقتي' : 'إعداد حساب المندوب'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          بتشوف وبتستلم الطلبات اللي محلاتها بنفس محافظتك ومنطقتك بس
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Paper sx={{ p: 3.5, borderRadius: 3, maxWidth: 520 }} elevation={0}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
              <LocationMapButton onPick={(zone) => presetLocation(zone.governorateId, zone)} />

              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                المحافظة
              </Typography>
              <Autocomplete
                options={governorates}
                getOptionLabel={(o) => o.name}
                value={selectedGovernorate}
                isOptionEqualToValue={(o, v) => o._id === v._id}
                onChange={(e, v) => setSelectedGovernorate(v)}
                renderInput={(params) => <TextField {...params} placeholder="اختر المحافظة" />}
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
                renderInput={(params) => (
                  <TextField {...params} placeholder={selectedGovernorate ? 'اختر المنطقة' : 'اختر المحافظة أولًا'} />
                )}
                sx={{ mb: 2.5 }}
              />

              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                المركبة
              </Typography>
              <TextField select fullWidth value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} sx={{ mb: 3 }}>
                {VEHICLE_OPTIONS.map((v) => (
                  <MenuItem key={v.value} value={v.value}>
                    {v.label}
                  </MenuItem>
                ))}
              </TextField>

              <Button fullWidth type="submit" variant="contained" color="primary" size="large" disabled={saving}>
                {saving ? 'جاري الحفظ...' : existing ? 'حفظ التعديلات' : 'حفظ والمتابعة'}
              </Button>
            </Box>
          </Paper>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default CourierSetup;