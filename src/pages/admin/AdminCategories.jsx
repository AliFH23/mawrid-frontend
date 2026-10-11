import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Snackbar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRequiresExpiry, setNewRequiresExpiry] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch {
      setToast('تعذّر تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async () => {
    setDialogError('');
    if (!newName.trim()) {
      setDialogError('الرجاء إدخال اسم الفئة');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/categories', { name: newName.trim() });
      // creation only takes the name, so the expiry flag goes in a second call
      if (newRequiresExpiry) {
        let newId = res.data.category?._id || res.data._id;
        if (!newId) {
          // response shape unknown — look the new category up by name instead
          const list = await api.get('/categories');
          newId = list.data.categories.find((c) => c.name === newName.trim())?._id;
        }
        if (newId) await api.put(`/categories/${newId}`, { requiresExpiry: true });
      }
      setToast('تمت إضافة الفئة ✓');
      setNewName('');
      setNewRequiresExpiry(false);
      setDialogOpen(false);
      loadCategories();
    } catch (err) {
      setDialogError(err.response?.data?.message || 'تعذّر إضافة الفئة');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleExpiry = async (cat) => {
    try {
      await api.put(`/categories/${cat._id}`, { requiresExpiry: !cat.requiresExpiry });
      setToast(
        cat.requiresExpiry
          ? `تاريخ انتهاء المنتج صار اختياري لفئة "${cat.name}"`
          : `تاريخ انتهاء المنتج صار مطلوب لفئة "${cat.name}"`
      );
      loadCategories();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر تحديث الفئة');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('متأكد بدك توقفي هالفئة؟ المحلات يلي مختاريتها رح تضل زي ما هي.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setToast('تم إيقاف الفئة');
      loadCategories();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر تنفيذ العملية');
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
    <DashboardLayout navItems={navItems} activeKey="categories" headerCard={headerCard}>
      <AnimatedPage>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            الفئات
          </Typography>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            فئة جديدة
          </Button>
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : categories.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              ما في فئات مضافة لهلق
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                اضغطي على الفئة لتفعيل أو إلغاء إلزامية تاريخ انتهاء المنتج (مواد غذائية، ألبان...). الفئات الملوّنة بالبرتقالي تتطلب تاريخ انتهاء عند فتح سلة. ما بيأثر على السلات المفتوحة أصلًا.
              </Alert>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {categories.map((cat) => (
                  <Tooltip
                    key={cat._id}
                    title={cat.requiresExpiry ? 'تتطلب تاريخ انتهاء — اضغطي لإلغاء الإلزام' : 'اضغطي لجعل تاريخ الانتهاء مطلوب'}
                  >
                    <Chip
                      icon={cat.requiresExpiry ? <EventBusyOutlinedIcon sx={{ fontSize: 16, color: '#B45309 !important' }} /> : undefined}
                      label={cat.name}
                      onClick={() => handleToggleExpiry(cat)}
                      onDelete={() => handleDeactivate(cat._id)}
                      deleteIcon={<DeleteOutlineIcon />}
                      sx={{
                        bgcolor: cat.requiresExpiry ? '#FEF3E2' : '#E7F8F0',
                        color: cat.requiresExpiry ? '#B45309' : '#047857',
                        fontWeight: 700,
                        fontSize: 13,
                        py: 2.2,
                        px: 0.5,
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </>
          )}
        </Paper>
      </AnimatedPage>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>فئة جديدة</DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {dialogError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="اسم الفئة"
            placeholder="مثال: قرطاسية"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
          />
          <FormControlLabel
            sx={{ mt: 1.5 }}
            control={<Checkbox checked={newRequiresExpiry} onChange={(e) => setNewRequiresExpiry(e.target.checked)} />}
            label="تتطلب تاريخ انتهاء للمنتج (مواد غذائية، ألبان...)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={creating} onClick={handleCreate}>
            {creating ? 'جاري الإضافة...' : 'إضافة'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default AdminCategories;