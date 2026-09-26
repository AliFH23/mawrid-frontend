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
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Snackbar,
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

function AdminPools() {
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
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
      const res = await api.get('/pools', { params: statusFilter ? { status: statusFilter } : {} });
      setPools(res.data.pools);
    } catch {
      // stays empty, table shows the "no pools" state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, [statusFilter]);

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
      expiryDate: pool.expiryDate ? pool.expiryDate.slice(0, 10) : '',
    });
    presetLocation(pool.deliveryZone?.governorateId || null, pool.deliveryZone || null);
  };

  const handleSaveEdit = async () => {
    setDialogError('');
    const { productName, description, categories: cats, unitPrice, minQuantity, maxQuantity, expiryDate } = form;

    if (!productName || cats.length === 0 || !selectedZone || !unitPrice || !minQuantity || !maxQuantity || !expiryDate) {
      setDialogError('الرجاء تعبئة كل الحقول واختيار فئة واحدة على الأقل');
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
        expiryDate,
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

  return (
    <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
      <AnimatedPage>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            السلات
          </Typography>
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">كل الحالات</MenuItem>
            <MenuItem value="OPEN">مفتوحة</MenuItem>
            <MenuItem value="PENDING_SUPPLIER_CONFIRMATION">بانتظار التأكيد</MenuItem>
            <MenuItem value="COMPLETED">مؤكّدة</MenuItem>
            <MenuItem value="EXPIRED">منتهية</MenuItem>
            <MenuItem value="CANCELLED">ملغاة</MenuItem>
          </TextField>
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : pools.length === 0 ? (
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
                  {pools.map((pool) => {
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
                type="date"
                label="تاريخ الانتهاء"
                InputLabelProps={{ shrink: true }}
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
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