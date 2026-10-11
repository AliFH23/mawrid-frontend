import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';
import { useLocationPicker } from '../../hooks/useLocationPicker.js';

const STATUS_STYLES = {
  OPEN: { label: 'سلة مفتوحة', bg: '#E7F8F0', color: '#047857' },
  PENDING_SUPPLIER_CONFIRMATION: { label: 'بانتظار التأكيد', bg: '#FEF3E2', color: '#B45309' },
  COMPLETED: { label: 'مؤكّدة', bg: '#0B1220', color: '#fff' },
  EXPIRED: { label: 'منتهية', bg: '#F1F5F9', color: '#64748B' },
  CANCELLED: { label: 'ملغاة', bg: '#FDECEC', color: '#DC2626' },
};

const MIN_SHELF_LIFE_DAYS = 30; // must match poolController.js

const toLocalInputValue = (dateLike) => {
  const d = new Date(dateLike);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const addDays = (dateLike, days) => {
  const d = new Date(dateLike);
  d.setDate(d.getDate() + days);
  return d;
};

// 'ALL' first, then one tab per lifecycle stage (expired + cancelled share a tab)
const STATUS_TABS = [
  { key: 'ALL', label: 'الكل', statuses: null },
  { key: 'OPEN', label: 'مفتوحة', statuses: ['OPEN'] },
  { key: 'PENDING', label: 'بانتظار التأكيد', statuses: ['PENDING_SUPPLIER_CONFIRMATION'] },
  { key: 'COMPLETED', label: 'مؤكّدة', statuses: ['COMPLETED'] },
  { key: 'CLOSED', label: 'منتهية وملغاة', statuses: ['EXPIRED', 'CANCELLED'] },
];

function AdminPools() {
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState('');

  const [editingPool, setEditingPool] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const { governorates, zones, zonesLoading, selectedGovernorate, selectedZone, setSelectedGovernorate, setSelectedZone, presetLocation } =
    useLocationPicker();

  const loadPools = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pools');
      setPools(res.data.pools);
    } catch {
      // stays empty, table shows the "no pools" state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  const openEditDialog = (pool) => {
    setDialogError('');
    setEditingPool(pool);
    setForm({
      productName: pool.productName,
      description: pool.description || '',
      categories: pool.categoryIds || [],
      unitPrice: String(pool.unitPrice),
      minQuantity: String(pool.minQuantity),
      maxQuantity: String(pool.maxQuantity),
      expiryDate: pool.expiryDate ? toLocalInputValue(pool.expiryDate) : '',
      productExpiryDate: pool.productExpiryDate ? toLocalInputValue(pool.productExpiryDate).slice(0, 10) : '',
    });
    presetLocation(pool.deliveryZone?.governorateId || null, pool.deliveryZone || null);
  };

  const handleSaveEdit = async () => {
    setDialogError('');
    const { productName, description, categories: cats, unitPrice, minQuantity, maxQuantity, expiryDate, productExpiryDate } = form;

    if (!productName || cats.length === 0 || !selectedZone || !unitPrice || !minQuantity || !maxQuantity || !expiryDate) {
      setDialogError('الرجاء تعبئة كل الحقول واختيار فئة واحدة على الأقل');
      return;
    }

    if (cats.some((c) => c.requiresExpiry) && !productExpiryDate) {
      setDialogError('الفئة المختارة لازم يكون عليها تاريخ انتهاء المنتج');
      return;
    }
    if (productExpiryDate && new Date(`${productExpiryDate}T23:59:59`) < addDays(expiryDate, MIN_SHELF_LIFE_DAYS)) {
      setDialogError(`تاريخ انتهاء المنتج لازم يكون بعد إغلاق السلة بـ ${MIN_SHELF_LIFE_DAYS} يوم على الأقل`);
      return;
    }

    setSaving(true);
    try {
      await api.put(`/pools/${editingPool._id}`, {
        productName,
        description,
        categoryIds: cats.map((c) => c._id),
        deliveryZone: selectedZone._id,
        unitPrice: Number(unitPrice),
        minQuantity: Number(minQuantity),
        maxQuantity: Number(maxQuantity),
        expiryDate: new Date(expiryDate).toISOString(),
        productExpiryDate: productExpiryDate ? new Date(`${productExpiryDate}T23:59:59`).toISOString() : null,
      });
      setToast('تم تحديث السلة بنجاح ✓');
      setEditingPool(null);
      loadPools();
    } catch (err) {
      setDialogError(err.response?.data?.message || 'تعذّر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPool = async (poolId) => {
    if (!window.confirm('متأكدة بدك تلغي هالسلة؟ رسوم الالتزام رح ترجع كاملة للمحلات.')) return;
    setActingId(poolId);
    try {
      await api.post(`/pools/${poolId}/cancel`);
      setToast('تم إلغاء السلة، واسترداد رسوم المحلات');
      loadPools();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر إلغاء السلة');
    } finally {
      setActingId(null);
    }
  };

  const matchesTab = (pool, tab) => !tab.statuses || tab.statuses.includes(pool.status);
  const visiblePools = pools.filter((p) => matchesTab(p, STATUS_TABS.find((t) => t.key === activeTab)));

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
    { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
    { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
    { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
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

  return (
    <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          السلات
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2.5, borderBottom: '1px solid #EEF2F6' }}
        >
          {STATUS_TABS.map((tab) => {
            const count = pools.filter((p) => matchesTab(p, tab)).length;
            return <Tab key={tab.key} value={tab.key} label={`${tab.label} (${count})`} sx={{ fontWeight: 700 }} />;
          })}
        </Tabs>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : visiblePools.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              ما في سلات مطابقة
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['السلة', 'المورد', 'الفئة', 'المنطقة', 'الكمية', 'السعر', 'الحالة', ''].map((h) => (
                      <th key={h} style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePools.map((pool) => {
                    const status = STATUS_STYLES[pool.status] || STATUS_STYLES.OPEN;
                    const categoryLabel = (pool.categoryIds || []).map((c) => c.name).join('، ');
                    const busy = actingId === pool._id;
                    return (
                      <tr key={pool._id}>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontWeight: 700, fontSize: 14 }}>{pool.productName}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{pool.supplierId?.companyName}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{categoryLabel}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{pool.deliveryZone?.name}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{pool.currentQuantity} / {pool.minQuantity}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{pool.unitPrice} د.أ</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                          <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: 11 }} />
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', whiteSpace: 'nowrap' }}>
                          <Button size="small" variant="text" onClick={() => navigate(`/pools/${pool._id}`)}>
                            التفاصيل
                          </Button>
                          {pool.status === 'OPEN' && (
                            <>
                              <Button size="small" variant="text" color="primary" disabled={busy} onClick={() => openEditDialog(pool)}>
                                تعديل
                              </Button>
                              <Button size="small" variant="text" color="error" disabled={busy} onClick={() => handleCancelPool(pool._id)}>
                                إلغاء
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          )}
        </Paper>
      </AnimatedPage>

      <Dialog open={!!editingPool} onClose={() => setEditingPool(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>تعديل السلة</DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {dialogError}
            </Alert>
          )}
          {form && (
            <>
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
                label="وصف المنتج"
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
                renderInput={(params) => <TextField {...params} label="الفئات" />}
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
                label="تاريخ ووقت انتهاء السلة"
                InputLabelProps={{ shrink: true }}
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="date"
                label={form.categories.some((c) => c.requiresExpiry) ? 'تاريخ انتهاء المنتج (مطلوب)' : 'تاريخ انتهاء المنتج (اختياري)'}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: form.expiryDate ? toLocalInputValue(addDays(form.expiryDate, MIN_SHELF_LIFE_DAYS)).slice(0, 10) : undefined }}
                value={form.productExpiryDate}
                onChange={(e) => setForm({ ...form, productExpiryDate: e.target.value })}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setEditingPool(null)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={saving} onClick={handleSaveEdit}>
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default AdminPools;