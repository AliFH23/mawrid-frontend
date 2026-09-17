import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Chip,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import PoolCard from '../components/PoolCard.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import api from '../api/axios.js';

const EMPTY_FORM = {
  productName: '',
  categories: [],
  governorate: null,
  zone: null,
  unitPrice: '',
  minQuantity: '',
  maxQuantity: '',
  expiryDate: '',
};

function SupplierDashboard() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPoolId, setEditingPoolId] = useState(null); // null = creating, otherwise editing this pool's id
  const [categories, setCategories] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const supRes = await api.get('/suppliers/me');
      setSupplier(supRes.data.supplier);

      const poolsRes = await api.get('/pools', { params: { supplierId: supRes.data.supplier._id } });
      setPools(poolsRes.data.pools);
    } catch {
      setToast('تعذّر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
    api.get('/governorates').then((res) => setGovernorates(res.data.governorates)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.governorate) {
      setZones([]);
      return;
    }
    setZonesLoading(true);
    api
      .get('/delivery-zones', { params: { governorateId: form.governorate._id } })
      .then((res) => setZones(res.data.zones))
      .finally(() => setZonesLoading(false));
  }, [form.governorate]);

  const handleConfirm = async (poolId) => {
    setActingId(poolId);
    try {
      await api.post(`/pools/${poolId}/confirm`);
      setToast('تم تأكيد السلة بنجاح ✓');
      loadData();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر تأكيد السلة');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (poolId) => {
    if (!window.confirm('متأكد بدك ترفضي هالسلة؟ رسوم الالتزام رح ترجع كاملة للمحلات.')) return;
    setActingId(poolId);
    try {
      await api.post(`/pools/${poolId}/reject`);
      setToast('تم رفض السلة، واسترداد رسوم المحلات');
      loadData();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر رفض السلة');
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (poolId) => {
    if (!window.confirm('متأكد بدك تلغي هالسلة؟')) return;
    setActingId(poolId);
    try {
      await api.post(`/pools/${poolId}/cancel`);
      setToast('تم إلغاء السلة');
      loadData();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر إلغاء السلة');
    } finally {
      setActingId(null);
    }
  };

  const openCreateDialog = () => {
    setEditingPoolId(null);
    setForm(EMPTY_FORM);
    setDialogError('');
    setDialogOpen(true);
  };

  const openEditDialog = (pool) => {
    setEditingPoolId(pool._id);
    setDialogError('');
    setForm({
      productName: pool.productName,
      categories: pool.categoryIds || [],
      governorate: pool.deliveryZone?.governorateId || null,
      zone: pool.deliveryZone || null,
      unitPrice: String(pool.unitPrice),
      minQuantity: String(pool.minQuantity),
      maxQuantity: String(pool.maxQuantity),
      expiryDate: pool.expiryDate ? pool.expiryDate.slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const handleSavePool = async () => {
    setDialogError('');
    const { productName, categories: cats, zone, unitPrice, minQuantity, maxQuantity, expiryDate } = form;

    if (!productName || cats.length === 0 || !zone || !unitPrice || !minQuantity || !maxQuantity || !expiryDate) {
      setDialogError('الرجاء تعبئة كل الحقول واختيار فئة واحدة على الأقل');
      return;
    }

    const payload = {
      productName,
      categoryIds: cats.map((c) => c._id),
      deliveryZone: zone._id,
      unitPrice: Number(unitPrice),
      minQuantity: Number(minQuantity),
      maxQuantity: Number(maxQuantity),
      expiryDate,
    };

    setSaving(true);
    try {
      if (editingPoolId) {
        await api.put(`/pools/${editingPoolId}`, payload);
        setToast('تم تحديث السلة بنجاح ✓');
      } else {
        await api.post('/pools', payload);
        setToast('تم فتح السلة بنجاح ✓');
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingPoolId(null);
      loadData();
    } catch (err) {
      setDialogError(err.response?.data?.message || 'تعذّر حفظ السلة');
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
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            bgcolor: '#22304F',
            '& .MuiLinearProgress-bar': { bgcolor: '#34D399', borderRadius: 999 },
          }}
        />
      </Box>
    </Box>
  );

  const renderAction = (pool) => {
    const busy = actingId === pool._id;
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="text" onClick={() => navigate(`/pools/${pool._id}`)}>
          التفاصيل
        </Button>

        {pool.status === 'PENDING_SUPPLIER_CONFIRMATION' && (
          <>
            <Button size="small" variant="contained" color="primary" disabled={busy} onClick={() => handleConfirm(pool._id)}>
              تأكيد
            </Button>
            <Button size="small" variant="outlined" color="error" disabled={busy} onClick={() => handleReject(pool._id)}>
              رفض
            </Button>
          </>
        )}

        {pool.status === 'OPEN' && (
          <>
            <Button size="small" variant="outlined" color="primary" disabled={busy} onClick={() => openEditDialog(pool)}>
              تعديل
            </Button>
            <Button size="small" variant="text" color="error" disabled={busy} onClick={() => handleCancel(pool._id)}>
              إلغاء السلة
            </Button>
          </>
        )}
      </Box>
    );
  };

  return (
    <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
      <AnimatedPage>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
              سلاتي
            </Typography>
            <Typography variant="body2" color="text.secondary">
              كل السلات يلي فتحتيها، بحالاتها المختلفة
            </Typography>
          </Box>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openCreateDialog}>
            اقتراح سلة جديدة
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : pools.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ما فتحتِ أي سلة لهلق — اضغطي "اقتراح سلة جديدة" لتبدئي
          </Alert>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2.5 }}>
            {pools.map((pool) => (
              <PoolCard key={pool._id} pool={pool} action={renderAction(pool)} />
            ))}
          </Box>
        )}
      </AnimatedPage>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{editingPoolId ? 'تعديل السلة' : 'اقتراح سلة جديدة'}</DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {dialogError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="اسم المنتج"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <Autocomplete
            multiple
            options={categories}
            getOptionLabel={(o) => o.name}
            value={form.categories}
            isOptionEqualToValue={(o, v) => o._id === v._id}
            onChange={(e, v) => setForm({ ...form, categories: v })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => <Chip label={option.name} {...getTagProps({ index })} key={option._id} />)
            }
            renderInput={(params) => (
              <TextField {...params} label="الفئات (يمكن اختيار أكتر من وحدة)" placeholder={form.categories.length ? '' : 'اختاري فئة أو أكتر'} />
            )}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={governorates}
            getOptionLabel={(o) => o.name}
            value={form.governorate}
            isOptionEqualToValue={(o, v) => o._id === v._id}
            onChange={(e, v) => setForm({ ...form, governorate: v, zone: null })}
            renderInput={(params) => <TextField {...params} label="المحافظة" />}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={zones}
            getOptionLabel={(o) => o.name}
            value={form.zone}
            isOptionEqualToValue={(o, v) => o._id === v._id}
            onChange={(e, v) => setForm({ ...form, zone: v })}
            disabled={!form.governorate}
            loading={zonesLoading}
            renderInput={(params) => <TextField {...params} label="المنطقة" />}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="سعر الوحدة (د.أ)"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="الحد الأدنى"
              value={form.minQuantity}
              onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
            />
            <TextField
              fullWidth
              type="number"
              label="الحد الأقصى"
              value={form.maxQuantity}
              onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })}
            />
          </Box>
          <TextField
            fullWidth
            type="date"
            label="تاريخ الانتهاء"
            InputLabelProps={{ shrink: true }}
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={saving} onClick={handleSavePool}>
            {saving ? 'جاري الحفظ...' : editingPoolId ? 'حفظ التعديلات' : 'فتح السلة'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </DashboardLayout>
  );
}

export default SupplierDashboard;