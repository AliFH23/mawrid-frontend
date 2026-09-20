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
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

function AdminZones() {
  const navigate = useNavigate();
  const [governorates, setGovernorates] = useState([]);
  const [selectedGov, setSelectedGov] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [toast, setToast] = useState('');

  const [govDialogOpen, setGovDialogOpen] = useState(false);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [newGovName, setNewGovName] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGovernorates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/governorates');
      setGovernorates(res.data.governorates);
      if (res.data.governorates.length > 0 && !selectedGov) {
        setSelectedGov(res.data.governorates[0]);
      }
    } catch {
      setToast('تعذّر تحميل المحافظات');
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async (governorateId) => {
    setZonesLoading(true);
    try {
      const res = await api.get('/delivery-zones', { params: { governorateId } });
      setZones(res.data.zones);
    } catch {
      setToast('تعذّر تحميل المناطق');
    } finally {
      setZonesLoading(false);
    }
  };

  useEffect(() => {
    loadGovernorates();
  }, []);

  useEffect(() => {
    if (selectedGov) loadZones(selectedGov._id);
  }, [selectedGov]);

  const handleAddGovernorate = async () => {
    setDialogError('');
    if (!newGovName.trim()) {
      setDialogError('الرجاء إدخال اسم المحافظة');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/governorates', { name: newGovName.trim() });
      setToast('تمت إضافة المحافظة ✓');
      setNewGovName('');
      setGovDialogOpen(false);
      await loadGovernorates();
      setSelectedGov(res.data.governorate);
    } catch (err) {
      setDialogError(err.response?.data?.message || 'تعذّر إضافة المحافظة');
    } finally {
      setSaving(false);
    }
  };

  const handleAddZone = async () => {
    setDialogError('');
    if (!newZoneName.trim()) {
      setDialogError('الرجاء إدخال اسم المنطقة');
      return;
    }
    setSaving(true);
    try {
      await api.post('/delivery-zones', { name: newZoneName.trim(), governorateId: selectedGov._id });
      setToast('تمت إضافة المنطقة ✓');
      setNewZoneName('');
      setZoneDialogOpen(false);
      loadZones(selectedGov._id);
    } catch (err) {
      setDialogError(err.response?.data?.message || 'تعذّر إضافة المنطقة');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('متأكد بدك توقفي هالمنطقة؟')) return;
    try {
      await api.delete(`/delivery-zones/${id}`);
      setToast('تم إيقاف المنطقة');
      loadZones(selectedGov._id);
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر تنفيذ العملية');
    }
  };

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
    { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
    { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
    { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
    { key: 'messages', label: 'رسائل التواصل', onClick: () => navigate('/admin/messages') },
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
    <DashboardLayout navItems={navItems} activeKey="zones" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          المحافظات والمناطق
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          اختاري محافظة من القائمة لإدارة مناطقها
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 2.5 }}>
            <Paper sx={{ p: 2, borderRadius: 3 }} elevation={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 1 }}>
                <Typography fontWeight={800} fontSize={14}>
                  المحافظات
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setGovDialogOpen(true)}>
                  إضافة
                </Button>
              </Box>
              <List dense>
                {governorates.map((gov) => (
                  <ListItemButton
                    key={gov._id}
                    selected={selectedGov?._id === gov._id}
                    onClick={() => setSelectedGov(gov)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark' },
                    }}
                  >
                    <ListItemText primary={gov.name} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography fontWeight={800} fontSize={15}>
                  مناطق {selectedGov?.name || ''}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  disabled={!selectedGov}
                  onClick={() => setZoneDialogOpen(true)}
                >
                  منطقة جديدة
                </Button>
              </Box>

              {zonesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} color="primary" />
                </Box>
              ) : zones.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  ما في مناطق مضافة لهالمحافظة لهلق
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {zones.map((zone) => (
                    <Chip
                      key={zone._id}
                      label={zone.name}
                      onDelete={() => handleDeleteZone(zone._id)}
                      deleteIcon={<DeleteOutlineIcon />}
                      sx={{ bgcolor: '#F1F5F9', color: '#334155', fontWeight: 600, fontSize: 13, py: 2.2, px: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </AnimatedPage>

      <Dialog open={govDialogOpen} onClose={() => setGovDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>محافظة جديدة</DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {dialogError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="اسم المحافظة"
            placeholder="مثال: الزرقاء"
            value={newGovName}
            onChange={(e) => setNewGovName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setGovDialogOpen(false)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={saving} onClick={handleAddGovernorate}>
            {saving ? 'جاري الإضافة...' : 'إضافة'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={zoneDialogOpen} onClose={() => setZoneDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>منطقة جديدة داخل {selectedGov?.name}</DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {dialogError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="اسم المنطقة"
            placeholder="مثال: الحي الشرقي"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setZoneDialogOpen(false)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={saving} onClick={handleAddZone}>
            {saving ? 'جاري الإضافة...' : 'إضافة'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default AdminZones;