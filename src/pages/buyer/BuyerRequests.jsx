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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const STATUS_STYLES = {
  OPEN: { label: 'مفتوح', bg: '#E7F8F0', color: '#047857' },
  FULFILLED: { label: 'تم فتح سلة', bg: '#0B1220', color: '#fff' },
  EXPIRED: { label: 'منتهي', bg: '#F1F5F9', color: '#64748B' },
  CLOSED: { label: 'مغلق', bg: '#FDECEC', color: '#DC2626' },
};

const EMPTY_FORM = { productName: '', description: '', categories: [], quantity: '' };

const daysLeft = (expiresAt) => Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / 86400000));

function BuyerRequests() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('market');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // backing dialog — one dialog reused for "I want this too" and "change my quantity"
  const [voteTarget, setVoteTarget] = useState(null);
  const [voteQty, setVoteQty] = useState('');
  const [voteError, setVoteError] = useState('');
  const [voting, setVoting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopRes, reqRes] = await Promise.all([
        api.get('/shops/me'),
        api.get('/market-requests', { params: tab === 'mine' ? { mine: true } : {} }),
      ]);
      setShop(shopRes.data.shop);
      setRequests(reqRes.data.requests);
    } catch {
      setToast('تعذّر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setFormError('');
    const { productName, description, categories: cats, quantity } = form;
    if (!productName.trim() || cats.length === 0 || !quantity) {
      setFormError('الرجاء تعبئة اسم المنتج واختيار فئة وتحديد الكمية');
      return;
    }
    setSaving(true);
    try {
      await api.post('/market-requests', {
        productName: productName.trim(),
        description: description.trim(),
        categoryIds: cats.map((c) => c._id),
        quantity: Number(quantity),
      });
      setToast('تم نشر طلبك ✓ — الموردين رح يشوفوه');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setTab('mine');
      if (tab === 'mine') loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'تعذّر نشر الطلب');
    } finally {
      setSaving(false);
    }
  };

  const openVote = (request) => {
    setVoteError('');
    setVoteQty(request.myQuantity ? String(request.myQuantity) : '');
    setVoteTarget(request);
  };

  const handleVote = async () => {
    setVoteError('');
    if (!voteQty || Number(voteQty) < 1) {
      setVoteError('الرجاء إدخال كمية صحيحة');
      return;
    }
    setVoting(true);
    try {
      await api.put(`/market-requests/${voteTarget._id}/vote`, { quantity: Number(voteQty) });
      setToast(voteTarget.myQuantity ? 'تم تعديل كميتك ✓' : 'تم تسجيل طلبك مع باقي المحلات ✓');
      setVoteTarget(null);
      loadData();
    } catch (err) {
      setVoteError(err.response?.data?.message || 'تعذّر تسجيل الكمية');
    } finally {
      setVoting(false);
    }
  };

  const handleWithdraw = async (request) => {
    if (!window.confirm('متأكدة بدك تسحبي طلبك من هالمنتج؟')) return;
    setBusyId(request._id);
    try {
      await api.delete(`/market-requests/${request._id}/vote`);
      setToast('تم سحب طلبك');
      loadData();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر سحب الطلب');
    } finally {
      setBusyId(null);
    }
  };

  const handleClose = async (request) => {
    if (!window.confirm('متأكدة بدك تغلقي هالطلب؟ ما رح يشوفه الموردين بعدها.')) return;
    setBusyId(request._id);
    try {
      await api.put(`/market-requests/${request._id}/close`);
      setToast('تم إغلاق الطلب');
      loadData();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر إغلاق الطلب');
    } finally {
      setBusyId(null);
    }
  };

  const navItems = [
    { key: 'pools', label: 'السلات المتاحة', onClick: () => navigate('/shop') },
    { key: 'requests', label: 'طلبات السوق', onClick: () => navigate('/shop/requests') },
    { key: 'history', label: 'سلاتي وطلباتي', onClick: () => navigate('/shop/history') },
    { key: 'settings', label: 'إعدادات المحل', onClick: () => navigate('/shop/settings') },
  ];

  const headerCard = shop && (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{shop.shopName}</Typography>
      <Typography sx={{ color: '#8B95AB', fontSize: 12 }}>{shop.deliveryZone?.name}</Typography>
    </Box>
  );

  const renderCard = (r) => {
    const status = STATUS_STYLES[r.status] || STATUS_STYLES.OPEN;
    const categoryLabel = (r.categoryIds || []).map((c) => c.name).join('، ');
    const busy = busyId === r._id;

    return (
      <Paper key={r._id} sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Box>
            <Typography fontWeight={800} fontSize={15}>
              {r.productName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {categoryLabel} {r.deliveryZone?.name ? `· ${r.deliveryZone.name}` : ''}
            </Typography>
          </Box>
          <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: 11 }} />
        </Box>

        {r.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {r.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <GroupsOutlinedIcon sx={{ fontSize: 18, color: '#64748B' }} />
            <Typography variant="body2">
              <b>{r.supportersCount}</b> {r.supportersCount === 1 ? 'محل' : 'محلات'} · <b>{r.totalQuantity}</b> وحدة
            </Typography>
          </Box>
          {r.status === 'OPEN' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AccessTimeIcon sx={{ fontSize: 17, color: '#64748B' }} />
              <Typography variant="body2" color="text.secondary">
                ينتهي بعد {daysLeft(r.expiresAt)} يوم
              </Typography>
            </Box>
          )}
        </Box>

        {r.status === 'FULFILLED' && r.pool && (
          <Alert severity="success" sx={{ borderRadius: 2, mb: 1.5 }}>
            فتح مورد سلة لهالمنتج بسعر <b>{r.pool.unitPrice} د.أ</b> للقطعة
            {r.pool.status === 'OPEN' ? ' — انضمي إلها من "السلات المتاحة" قبل ما تمتلئ' : ''}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {r.status === 'OPEN' && r.myQuantity === null && (
            <Button size="small" variant="contained" color="primary" onClick={() => openVote(r)}>
              أنا كمان بدي
            </Button>
          )}
          {r.myQuantity !== null && (
            <Chip label={`كميتك: ${r.myQuantity}`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: 11 }} />
          )}
          {r.status === 'OPEN' && r.myQuantity !== null && (
            <>
              <Button size="small" variant="outlined" onClick={() => openVote(r)}>
                عدّلي كميتك
              </Button>
              <Button size="small" variant="text" color="error" disabled={busy} onClick={() => handleWithdraw(r)}>
                سحب طلبي
              </Button>
            </>
          )}
          {r.status === 'OPEN' && r.isCreator && (
            <Button size="small" variant="text" color="secondary" disabled={busy} onClick={() => handleClose(r)}>
              إغلاق الطلب
            </Button>
          )}
          {r.status === 'FULFILLED' && (
            <Button size="small" variant="contained" color="primary" onClick={() => navigate('/shop')}>
              السلات المتاحة
            </Button>
          )}
        </Box>
      </Paper>
    );
  };

  return (
    <DashboardLayout navItems={navItems} activeKey="requests" headerCard={headerCard}>
      <AnimatedPage>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
              طلبات السوق
            </Typography>
            <Typography variant="body2" color="text.secondary">
              اطلبي منتج مش موجود، ولما محلات كتير تطلبه الموردين بيفتحوا عليه سلة
            </Typography>
          </Box>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            طلب منتج جديد
          </Button>
        </Box>

        <Alert severity="info" sx={{ borderRadius: 2, my: 2.5 }}>
          الانضمام لطلب مجاني ومش ملزم. رسم الالتزام بينحجز بس لما تنضمي فعليًا للسلة بعد ما المورد يفتحها.
        </Alert>

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #EEF2F6' }}>
          <Tab value="market" label="كل الطلبات المفتوحة" sx={{ fontWeight: 700 }} />
          <Tab value="mine" label="طلباتي" sx={{ fontWeight: 700 }} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : requests.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {tab === 'mine' ? 'لسا ما طلبتي ولا انضميتي لأي طلب' : 'ما في طلبات مفتوحة حاليًا — كوني أول وحدة تطلب!'}
          </Alert>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2.5 }}>
            {requests.map(renderCard)}
          </Box>
        )}
      </AnimatedPage>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>طلب منتج جديد</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="اسم المنتج"
            placeholder="مثلاً: زيت زيتون 5 لتر"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="وصف (اختياري)"
            placeholder="الماركة أو المواصفات اللي بتفضليها"
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
            getOptionDisabled={(o) => form.categories.length >= 3 && !form.categories.some((c) => c._id === o._id)}
            onChange={(e, v) => setForm({ ...form, categories: v })}
            renderInput={(params) => <TextField {...params} label="الفئات (لحد 3)" />}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="الكمية اللي بدك إياها"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            inputProps={{ min: 1 }}
            helperText="الطلب بيظهر لمحلات المنصة والموردين، وبينتهي تلقائيًا بعد 14 يوم لو ما انفتحت عليه سلة"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setCreateOpen(false)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={saving} onClick={handleCreate}>
            {saving ? 'جاري النشر...' : 'نشر الطلب'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!voteTarget} onClose={() => setVoteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{voteTarget?.myQuantity ? 'تعديل كميتك' : 'انضمي للطلب'} — {voteTarget?.productName}</DialogTitle>
        <DialogContent>
          {voteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {voteError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            الطلب الحالي: {voteTarget?.supportersCount} {voteTarget?.supportersCount === 1 ? 'محل' : 'محلات'} · {voteTarget?.totalQuantity} وحدة
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="كم وحدة بدك؟"
            value={voteQty}
            onChange={(e) => setVoteQty(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setVoteTarget(null)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={voting} onClick={handleVote}>
            {voting ? 'جاري الحفظ...' : 'تأكيد'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default BuyerRequests;