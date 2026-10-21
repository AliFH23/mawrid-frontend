import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, Autocomplete, MenuItem, Link } from '@mui/material';
import api from '../../api/axios.js';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import LocationMapButton from '../../components/LocationMapButton.jsx';
import { useLocationPicker } from '../../hooks/useLocationPicker.js';

const VEHICLE_OPTIONS = [
  { value: 'MOTORCYCLE', label: 'دراجة نارية' },
  { value: 'CAR', label: 'سيارة' },
  { value: 'VAN', label: 'فان' },
  { value: 'TRUCK', label: 'شاحنة' },
];

// one-page signup for delivery couriers (shops and suppliers use the main register page)
function CourierRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('MOTORCYCLE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !phone || !email || !password) {
      setError('الرجاء تعبئة كل الحقول');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور لازم تكون 6 أحرف على الأقل');
      return;
    }
    if (!selectedZone) {
      setError('الرجاء اختيار المحافظة والمنطقة اللي بتوصّل فيها');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, phone, password, role: 'courier' });
      const { user, token } = res.data;
      localStorage.setItem('mawrid_token', token);
      localStorage.setItem('mawrid_user', JSON.stringify(user));

      try {
        await api.post('/couriers', { deliveryZone: selectedZone._id, vehicleType });
        navigate('/courier');
      } catch {
        // account exists but the profile failed — finish it on the setup page
        navigate('/courier/setup');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper component={AnimatedPage} sx={{ width: 480, maxWidth: '100%', p: 4.5, borderRadius: 5 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
          <Box component="img" src="/logo/mawrid-mark-ink.png" alt="مَورِد" sx={{ height: 48, width: 'auto' }} />
        </Box>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            سجّل كمندوب توصيل
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            بتستلم طلبات التوصيل من منطقتك وبتوصّلها للمحلات
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ mb: 2 }} />
          <TextField
            fullWidth
            type="email"
            label="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputProps={{ dir: 'ltr' }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputProps={{ dir: 'ltr' }}
            sx={{ mb: 2.5 }}
          />

          <LocationMapButton onPick={(zone) => presetLocation(zone.governorateId, zone)} />

          <Autocomplete
            options={governorates}
            getOptionLabel={(o) => o.name}
            value={selectedGovernorate}
            isOptionEqualToValue={(o, v) => o._id === v._id}
            onChange={(e, v) => setSelectedGovernorate(v)}
            renderInput={(params) => <TextField {...params} label="المحافظة" />}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={zones}
            getOptionLabel={(o) => o.name}
            value={selectedZone}
            isOptionEqualToValue={(o, v) => o._id === v._id}
            onChange={(e, v) => setSelectedZone(v)}
            disabled={!selectedGovernorate}
            loading={zonesLoading}
            renderInput={(params) => <TextField {...params} label="المنطقة" />}
            sx={{ mb: 2 }}
          />
          <TextField select fullWidth label="المركبة" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} sx={{ mb: 3 }}>
            {VEHICLE_OPTIONS.map((v) => (
              <MenuItem key={v.value} value={v.value}>
                {v.label}
              </MenuItem>
            ))}
          </TextField>

          <Button fullWidth type="submit" variant="contained" color="primary" size="large" disabled={loading}>
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          عندك حساب؟{' '}
          <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            سجّل دخول
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default CourierRegister;