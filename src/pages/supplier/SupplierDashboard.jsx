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
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import PoolCard from '../../components/PoolCard.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';
import { useLocationPicker } from '../../hooks/useLocationPicker.js';

const EMPTY_FORM = {
  productName: '',
  description: '',
  categories: [],
  unitPrice: '',
  minQuantity: '',
  maxQuantity: '',
  expiryDate: '',
};

const toLocalInputValue = (dateLike) => {
  const d = new Date(dateLike);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
};

function SupplierDashboard() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPoolId, setEditingPoolId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

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

  const [extendingPool, setExtendingPool] = useState(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [extendError, setExtendError] = useState('');
  const [extending, setExtending] = useState(false);

  // increase-max-quantity dialog — for a pool that's hit its cap while buyers still
  // want in
  const [increasingMaxPool, setIncreasingMaxPool] = useState(null);
  const [newMaxQuantity, setNewMaxQuantity] = useState('');
  const [increaseMaxError, setIncreaseMaxError] = useState('');
  const [increasingMax, setIncreasingMax] = useState(false);

  const [rejectingPoolId, setRejectingPoolId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const supRes = await api.get('/suppliers/me');
      setSupplier(supRes.data.supplier);

      const poolsRes = await api.get('/pools');
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
  }, []);

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

  const openRejectDialog = (poolId) => {
    setRejectionReason('');
    setRejectError('');
    setRejectingPoolId(poolId);
  };

  const handleReject = async () => {
    setRejectError('');
    if (!rejectionReason.trim()) {
      setRejectError('الرجاء كتابة سبب الرفض');
      return;
    }
    setActingId(rejectingPoolId);
    try {
      await api.post(`/pools/${rejectingPoolId}/reject`, { reason: rejectionReason.trim() });
      setToast('تم رفض السلة، واسترداد رسوم المحلات');
      setRejectingPoolId(null);
      loadData();
    } catch (err) {
      setRejectError(err.response?.data?.message || 'تعذّر رفض السلة');
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
    setSelectedGovernorate(null);
    setDialogError('');
    setDialogOpen(true);
  };

  const openEditDialog = (pool) => {
    setEditingPoolId(pool._id);
    setDialogError('');
    setForm({
      productName: pool.productName,
      description: pool.description || '',
      categories: pool.categoryIds || [],
      unitPrice: String(pool.unitPrice),
      minQuantity: String(pool.minQuantity),
      maxQuantity: String(pool.maxQuantity),
      expiryDate: pool.expiryDate ? toLocalInputValue(pool.expiryDate) : '',
    });
    presetLocation(pool.deliveryZone?.governorateId || null, pool.deliveryZone || null);
    setDialogOpen(true);
  };

  const handleSavePool = async () => {
    setDialogError('');
    const { productName, description, categories: cats, unitPrice, minQuantity, maxQuantity, expiryDate } = form;

    if (!productName || cats.length === 0 || !selectedZone || !unitPrice || !minQuantity || !maxQuantity || !expiryDate) {
      setDialogError('الرجاء تعبئة كل الحقول واختيار فئة واحدة على الأقل');
      return;
    }

    const payload = {
      productName,
      description,
      categoryIds: cats.map((c) => c._id),
      deliveryZone: selectedZone._id,
      unitPrice: Number(unitPrice),
      minQuantity: Number(minQuantity),
      maxQuantity: Number(maxQuantity),
      expiryDate: new Date(expiryDate).toISOString(),
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

  const openExtendDialog = (pool) => {
    setExtendError('');
    setNewExpiryDate(pool.expiryDate ? toLocalInputValue(pool.expiryDate) : '');
    setExtendingPool(pool);
  };

  const handleExtend = async () => {
    setExtendError('');
    if (!newExpiryDate) {
      setExtendError('الرجاء تحديد تاريخ ووقت انتهاء جديد');
      return;
    }
    setExtending(true);
    try {
      await api.put(`/pools/${extendingPool._id}/extend`, {
        newExpiryDate: new Date(newExpiryDate).toISOString(),
      });
      setToast('تم تمديد السلة بنجاح ✓');
      setExtendingPool(null);
      loadData();
    } catch (err) {
      setExtendError(err.response?.data?.message || 'تعذّر تمديد السلة');
    } finally {
      setExtending(false);
    }
  };

  const openIncreaseMaxDialog = (pool) => {
    setIncreaseMaxError('');
    setNewMaxQuantity(String(pool.maxQuantity));
    setIncreasingMaxPool(pool);
  };

  const handleIncreaseMax = async () => {
    setIncreaseMaxError('');
    const val = Number(newMaxQuantity);
    if (!val || val <= increasingMaxPool.maxQuantity) {
      setIncreaseMaxError(`الرجاء إدخال رقم أكبر من الحد الأقصى الحالي (${increasingMaxPool.maxQuantity})`);
      return;
    }
    setIncreasingMax(true);
    try {
      await api.put(`/pools/${increasingMaxPool._id}/increase-max`, { newMaxQuantity: val });
      setToast('تم رفع الحد الأقصى بنجاح ✓');
      setIncreasingMaxPool(null);
      loadData();
    } catch (err) {
      setIncreaseMaxError(err.response?.data?.message || 'تعذّر رفع الحد الأقصى');
    } finally {
      setIncreasingMax(false);
    }
  };

  const navItems = [
    { key: 'pools', label: 'السلات', onClick: () => navigate('/supplier') },
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
    const isOwnPool = supplier && pool.supplierId?._id === supplier._id;

    // not your pool — no "التفاصيل" link at all: the participants list behind it
    // includes buyer names and phone numbers, which is only appropriate for the
    // pool's own owner (and the backend already 403s this, this just avoids
    // showing a dead-end button in the first place)
    if (!isOwnPool) {
      return (
        pool.supplierId?.companyName && (
          <Chip label={pool.supplierId.companyName} size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: 11 }} />
        )
      );
    }

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
            <Button size="small" variant="outlined" color="error" disabled={busy} onClick={() => openRejectDialog(pool._id)}>
              رفض
            </Button>
          </>
        )}

        {pool.status === 'OPEN' && (
          <>
            <Button size="small" variant="outlined" color="primary" disabled={busy} onClick={() => openEditDialog(pool)}>
              تعديل
            </Button>
            <Button size="small" variant="outlined" color="warning" disabled={busy} onClick={() => openExtendDialog(pool)}>
              تمديد
            </Button>
            <Button size="small" variant="outlined" color="success" disabled={busy} onClick={() => openIncreaseMaxDialog(pool)}>
              زيادة الحد الأقصى
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
              السلات
            </Typography>
            <Typography variant="body2" color="text.secondary">
              كل سلات المنصة — سلاتك عليها كل الصلاحيات، وسلات باقي الموردين للعرض بس
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
            ما في سلات بالمنصة لهلق — اضغطي "اقتراح سلة جديدة" لتبدئي
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
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="وصف المنتج (اختياري)"
            placeholder="مثلاً: زيت زيتون بكر ممتاز، عبوة زجاج 5 لتر، إنتاج محلي"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
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
            type="datetime-local"
            label="تاريخ ووقت الانتهاء"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: toLocalInputValue(new Date()) }}
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

      <Dialog open={!!extendingPool} onClose={() => setExtendingPool(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>تمديد سلة {extendingPool?.productName}</DialogTitle>
        <DialogContent>
          {extendError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {extendError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            الموعد الحالي: {extendingPool ? new Date(extendingPool.expiryDate).toLocaleString('ar-EG') : ''}
          </Typography>
          <TextField
            fullWidth
            type="datetime-local"
            label="تاريخ ووقت الانتهاء الجديد"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: extendingPool ? toLocalInputValue(extendingPool.expiryDate) : undefined }}
            value={newExpiryDate}
            onChange={(e) => setNewExpiryDate(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setExtendingPool(null)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="warning" disabled={extending} onClick={handleExtend}>
            {extending ? 'جاري التمديد...' : 'تمديد السلة'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!increasingMaxPool} onClose={() => setIncreasingMaxPool(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>زيادة الحد الأقصى — {increasingMaxPool?.productName}</DialogTitle>
        <DialogContent>
          {increaseMaxError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {increaseMaxError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            الحد الأقصى الحالي: {increasingMaxPool?.maxQuantity} — الكمية المنضمّة حاليًا: {increasingMaxPool?.currentQuantity}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="الحد الأقصى الجديد"
            value={newMaxQuantity}
            onChange={(e) => setNewMaxQuantity(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setIncreasingMaxPool(null)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="success" disabled={increasingMax} onClick={handleIncreaseMax}>
            {increasingMax ? 'جاري الرفع...' : 'رفع الحد الأقصى'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!rejectingPoolId} onClose={() => setRejectingPoolId(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>سبب رفض السلة</DialogTitle>
        <DialogContent>
          {rejectError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {rejectError}
            </Alert>
          )}
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            الرفض بعد وصول السلة للحد الأدنى بيسجّل غرامة رسمية على حسابك، وبينقص درجة موثوقيتك 10 نقاط.
          </Alert>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="سبب الرفض"
            placeholder="مثلاً: نفدت الكمية من المخزون"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setRejectingPoolId(null)} color="secondary">
            تراجع
          </Button>
          <Button variant="contained" color="error" disabled={actingId === rejectingPoolId} onClick={handleReject}>
            {actingId === rejectingPoolId ? 'جاري الرفض...' : 'تأكيد الرفض'}
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