import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Autocomplete,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import api from '../api/axios.js';
import AnimatedPage from '../components/AnimatedPage.jsx';

const MAX_CATEGORIES = 3;

function ShopSetup() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [zones, setZones] = useState([]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [zonesLoading, setZonesLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/governorates')])
      .then(([catRes, govRes]) => {
        setCategories(catRes.data.categories);
        setGovernorates(govRes.data.governorates);
      })
      .catch(() => setError('تعذّر تحميل البيانات، حاولي تحديث الصفحة'));
  }, []);

  // whenever the governorate changes, fetch only the zones that belong to it
  useEffect(() => {
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
      .catch(() => setError('تعذّر تحميل مناطق هالمحافظة'))
      .finally(() => setZonesLoading(false));
  }, [selectedGovernorate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!shopName || !selectedZone || selectedCategories.length === 0) {
      setError('الرجاء تعبئة كل الحقول واختيار فئة ومنطقة توصيل');
      return;
    }

    setLoading(true);
    try {
      await api.post('/shops', {
        shopName,
        deliveryZone: selectedZone._id,
        categoryIds: selectedCategories.map((c) => c._id),
      });
      navigate('/shop');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات المحل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper component={AnimatedPage} sx={{ width: 480, p: 5, borderRadius: 5 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StorefrontIcon sx={{ color: 'primary.dark', fontSize: 28 }} />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            أكملي بيانات محلك
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            خطوة أخيرة قبل ما تشوفي السلات المتاحة إلك
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            اسم المحل
          </Typography>
          <TextField
            fullWidth
            placeholder="مثال: بقالة أبو محمد"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            sx={{ mb: 2.5 }}
          />

          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            فئات نشاطك (حتى {MAX_CATEGORIES} فئات)
          </Typography>
          <Autocomplete
            multiple
            options={categories}
            getOptionLabel={(option) => option.name}
            value={selectedCategories}
            onChange={(e, newValue) => {
              if (newValue.length <= MAX_CATEGORIES) setSelectedCategories(newValue);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option.name} {...getTagProps({ index })} key={option._id} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} placeholder={selectedCategories.length ? '' : 'اختاري فئة أو أكتر'} />
            )}
            sx={{ mb: 2.5 }}
          />

          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            المحافظة
          </Typography>
          <Autocomplete
            options={governorates}
            getOptionLabel={(option) => option.name}
            value={selectedGovernorate}
            onChange={(e, newValue) => setSelectedGovernorate(newValue)}
            renderInput={(params) => <TextField {...params} placeholder="اختاري المحافظة" />}
            sx={{ mb: 2.5 }}
          />

          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            المنطقة داخل المحافظة
          </Typography>
          <Autocomplete
            options={zones}
            getOptionLabel={(option) => option.name}
            value={selectedZone}
            onChange={(e, newValue) => setSelectedZone(newValue)}
            disabled={!selectedGovernorate}
            loading={zonesLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={selectedGovernorate ? 'اختاري منطقتك' : 'اختاري المحافظة أولًا'}
              />
            )}
            sx={{ mb: 3 }}
          />

          <Button fullWidth type="submit" variant="contained" color="primary" size="large" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ والمتابعة'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default ShopSetup;