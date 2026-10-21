import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
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
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import UpdateIcon from '@mui/icons-material/Update';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import PoolCard from '../../components/PoolCard.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';
import LocationMapButton from '../../components/LocationMapButton.jsx';
import { useLocationPicker } from '../../hooks/useLocationPicker.js';

const EMPTY_FORM = {
  productName: '',
  description: '',
  categories: [],
  unitPrice: '',
  marketPrice: '',
  minQuantity: '',
  maxQuantity: '',
  expiryDate: '',
  productExpiryDate: '',
};

// must match MIN_SHELF_LIFE_DAYS in poolController.js
const MIN_SHELF_LIFE_DAYS = 30;

// pool list is split by lifecycle stage; EXPIRED and CANCELLED share one tab
// because from the supplier's side both mean "nothing left to do here"
const STATUS_TABS = [
  { key: 'OPEN', label: 'مفتوحة', statuses: ['OPEN'], empty: 'ما في سلات مفتوحة حاليًا' },
  { key: 'PENDING', label: 'بانتظار التأكيد', statuses: ['PENDING_SUPPLIER_CONFIRMATION'], empty: 'ما في سلات بانتظار تأكيدك' },
  { key: 'COMPLETED', label: 'مؤكّدة', statuses: ['COMPLETED'], empty: 'ما في سلات مؤكّدة بعد' },
  { key: 'CLOSED', label: 'منتهية وملغاة', statuses: ['EXPIRED', 'CANCELLED'], empty: 'ما في سلات منتهية أو ملغاة' },
];

const toLocalInputValue = (dateLike) => {
  const d = new Date(dateLike);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
};

const addDays = (dateLike, days) => {
  const d = new Date(dateLike);
  d.setDate(d.getDate() + days);
  return d;
};

function SupplierDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [supplier, setSupplier] = useState(null);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('OPEN');

  const [dialogOpen, setDialogOpen] = useState(false);
  // set when the dialog was opened from a market request (see SupplierRequests.jsx)
  const [sourceRequest, setSourceRequest] = useState(null);
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

  const [increasingMaxPool, setIncreasingMaxPool] = useState(null);
  const [newMaxQuantity, setNewMaxQuantity] = useState('');
  const [increaseMaxError, setIncreaseMaxError] = useState('');
  const [increasingMax, setIncreasingMax] = useState(false);

  // new: raise the per-shop pooling cap by raising minQuantity itself
  const [increasingMinPool, setIncreasingMinPool] = useState(null);
  const [newMinQuantity, setNewMinQuantity] = useState('');
  const [increaseMinError, setIncreaseMinError] = useState('');
  const [increasingMin, setIncreasingMin] = useState(false);

  const [rejectingPoolId, setRejectingPoolId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // overflow menu — which pool's "⋮" menu is currently open, and its anchor element
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPool, setMenuPool] = useState(null);

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
    const fromRequest = location.state?.fromRequest;
    if (fromRequest) {
      openCreateFromRequest(fromRequest);
      // clear the navigation state so a page refresh doesn't reopen the dialog
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

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

  // pre-fill what the market already told us: product, categories, zone, and the total
  // demand as the minimum quantity. Everything stays editable — price and dates are the
  // supplier's call.
  const openCreateFromRequest = (request) => {
    setEditingPoolId(null);
    setSourceRequest(request);
    setForm({
      ...EMPTY_FORM,
      productName: request.productName,
      description: request.description || '',
      categories: request.categoryIds || [],
      minQuantity: String(request.totalQuantity),
      maxQuantity: String(Math.ceil(request.totalQuantity * 1.5)),
    });
    presetLocation(request.deliveryZone?.governorateId || null, request.deliveryZone || null);
    setDialogError('');
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSourceRequest(null);
    setEditingPoolId(null);
    setForm(EMPTY_FORM);
    setSelectedGovernorate(null);
    setDialogError('');
    setDialogOpen(true);
  };

  const openEditDialog = (pool) => {
    setSourceRequest(null);
    setEditingPoolId(pool._id);
    setDialogError('');
    setForm({
      productName: pool.productName,
      description: pool.description || '',
      categories: pool.categoryIds || [],
      unitPrice: String(pool.unitPrice),
      marketPrice: pool.marketPrice ? String(pool.marketPrice) : '',
      minQuantity: String(pool.minQuantity),
      maxQuantity: String(pool.maxQuantity),
      expiryDate: pool.expiryDate ? toLocalInputValue(pool.expiryDate) : '',
      productExpiryDate: pool.productExpiryDate ? toLocalInputValue(pool.productExpiryDate).slice(0, 10) : '',
    });
    presetLocation(pool.deliveryZone?.governorateId || null, pool.deliveryZone || null);
    setDialogOpen(true);
  };

  const handleSavePool = async () => {
    setDialogError('');
    const { productName, description, categories: cats, unitPrice, minQuantity, maxQuantity, expiryDate, productExpiryDate, marketPrice } = form;

    if (!productName || cats.length === 0 || !selectedZone || !unitPrice || !minQuantity || !maxQuantity || !expiryDate) {
      setDialogError('الرجاء تعبئة كل الحقول واختيار فئة واحدة على الأقل');
      return;
    }

    if (marketPrice && Number(marketPrice) <= Number(unitPrice)) {
      setDialogError('سعر السوق لازم يكون أعلى من سعر الوحدة، وإلا ما في توفير نعرضه');
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

    const payload = {
      productName,
      description,
      categoryIds: cats.map((c) => c._id),
      deliveryZone: selectedZone._id,
      unitPrice: Number(unitPrice),
      marketPrice: marketPrice ? Number(marketPrice) : null,
      minQuantity: Number(minQuantity),
      maxQuantity: Number(maxQuantity),
      expiryDate: new Date(expiryDate).toISOString(),
      // end of that day, so a product valid "until the 15th" counts the whole 15th
      productExpiryDate: productExpiryDate ? new Date(`${productExpiryDate}T23:59:59`).toISOString() : null,
    };

    setSaving(true);
    try {
      if (editingPoolId) {
        await api.put(`/pools/${editingPoolId}`, payload);
        setToast('تم تحديث السلة بنجاح ✓');
      } else {
        const createRes = await api.post('/pools', payload);
        setToast('تم فتح السلة بنجاح ✓');
        if (sourceRequest) {
          // link the new pool to the market request so the shops that backed it see it
          try {
            await api.put(`/market-requests/${sourceRequest._id}/fulfill`, { poolId: createRes.data.pool._id });
            setToast('تم فتح السلة وربطها بطلب السوق ✓');
          } catch {
            setToast('تم فتح السلة، بس تعذّر ربطها بطلب السوق');
          }
          setSourceRequest(null);
        }
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

  const openIncreaseMinDialog = (pool) => {
    setIncreaseMinError('');
    setNewMinQuantity(String(pool.minQuantity));
    setIncreasingMinPool(pool);
  };

  const handleIncreaseMin = async () => {
    setIncreaseMinError('');
    const val = Number(newMinQuantity);
    if (!val || val <= increasingMinPool.minQuantity) {
      setIncreaseMinError(`الرجاء إدخال رقم أكبر من الحد الأدنى الحالي (${increasingMinPool.minQuantity})`);
      return;
    }
    if (val > increasingMinPool.maxQuantity) {
      setIncreaseMinError(`ما يقدر يتجاوز الحد الأقصى (${increasingMinPool.maxQuantity})`);
      return;
    }
    setIncreasingMin(true);
    try {
      await api.put(`/pools/${increasingMinPool._id}/increase-min`, { newMinQuantity: val });
      setToast('تم رفع الحد الأدنى بنجاح ✓');
      setIncreasingMinPool(null);
      loadData();
    } catch (err) {
      setIncreaseMinError(err.response?.data?.message || 'تعذّر رفع الحد الأدنى');
    } finally {
      setIncreasingMin(false);
    }
  };

  const openMenu = (e, pool) => {
    setMenuAnchor(e.currentTarget);
    setMenuPool(pool);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuPool(null);
  };

  const navItems = [
    { key: 'pools', label: 'السلات', onClick: () => navigate('/supplier') },
    { key: 'requests', label: 'طلبات السوق', onClick: () => navigate('/supplier/requests') },
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

  // for OPEN pools: only "التفاصيل" and "إلغاء" stay as direct buttons — everything
  // else (تعديل / تمديد / رفع الحد الأقصى / رفع الحد الأدنى) lives behind one "⋮"
  // menu, so the card never has more than 3 visible controls regardless of status
  const renderAction = (pool) => {
    const busy = actingId === pool._id;
    const isOwnPool = supplier && pool.supplierId?._id === supplier._id;

    if (!isOwnPool) {
      return (
        pool.supplierId?.companyName && (
          <Chip label={pool.supplierId.companyName} size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: 11 }} />
        )
      );
    }

    return (
      <>
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
            <Button size="small" variant="text" color="error" disabled={busy} onClick={() => handleCancel(pool._id)}>
              إلغاء
            </Button>
            <IconButton size="small" disabled={busy} onClick={(e) => openMenu(e, pool)} sx={{ ml: -0.5 }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </>
    );
  };

  const currentTab = STATUS_TABS.find((t) => t.key === activeTab);
  const visiblePools = pools.filter((p) => currentTab.statuses.includes(p.status));

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
          <>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 3, borderBottom: '1px solid #EEF2F6' }}
            >
              {STATUS_TABS.map((tab) => {
                const count = pools.filter((p) => tab.statuses.includes(p.status)).length;
                return <Tab key={tab.key} value={tab.key} label={`${tab.label} (${count})`} sx={{ fontWeight: 700 }} />;
              })}
            </Tabs>

            {visiblePools.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                {STATUS_TABS.find((t) => t.key === activeTab)?.empty}
              </Alert>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2.5 }}>
                {visiblePools.map((pool) => (
                  <PoolCard key={pool._id} pool={pool} action={renderAction(pool)} />
                ))}
              </Box>
            )}
          </>
        )}
      </AnimatedPage>

      {/* the "⋮" overflow menu for an OPEN pool's secondary actions */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            openEditDialog(menuPool);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>تعديل السلة</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            openExtendDialog(menuPool);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <UpdateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>تمديد الموعد</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            openIncreaseMaxDialog(menuPool);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <TrendingUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>زيادة الحد الأقصى (السلة ممتلئة)</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            openIncreaseMinDialog(menuPool);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <UnfoldMoreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>زيادة الحد الأدنى (محل بده حصة أكبر)</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{editingPoolId ? 'تعديل السلة' : 'اقتراح سلة جديدة'}</DialogTitle>
        <DialogContent>
          {sourceRequest && !editingPoolId && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              مبنية على طلب من السوق: <b>{sourceRequest.supportersCount}</b> محل · <b>{sourceRequest.totalQuantity}</b> وحدة. عبّينا الحد الأدنى والأقصى كاقتراح — عدّليهم، وحددي السعر والموعد.
            </Alert>
          )}
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
          <TextField
            fullWidth
            type="number"
            label="سعر الوحدة (د.أ)"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="سعر السوق العادي (اختياري)"
            helperText="لو عبّيته، المحلات بتشوف نسبة التوفير على السلة"
            value={form.marketPrice}
            onChange={(e) => setForm({ ...form, marketPrice: e.target.value })}
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
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label={form.categories.some((c) => c.requiresExpiry) ? 'تاريخ انتهاء المنتج (مطلوب)' : 'تاريخ انتهاء المنتج (اختياري)'}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: form.expiryDate ? toLocalInputValue(addDays(form.expiryDate, MIN_SHELF_LIFE_DAYS)).slice(0, 10) : undefined }}
            helperText={`لازم يكون بعد إغلاق السلة بـ ${MIN_SHELF_LIFE_DAYS} يوم على الأقل، عشان توصل البضاعة وفيها صلاحية كافية`}
            value={form.productExpiryDate}
            onChange={(e) => setForm({ ...form, productExpiryDate: e.target.value })}
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
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            استخدمي هاي لو السلة امتلأت بالكامل وفي محلات كمان بدها تنضم — ما بيأثر على نصيب أي محل الفردي.
          </Alert>
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

      <Dialog open={!!increasingMinPool} onClose={() => setIncreasingMinPool(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>زيادة الحد الأدنى — {increasingMinPool?.productName}</DialogTitle>
        <DialogContent>
          {increaseMinError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {increaseMinError}
            </Alert>
          )}
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            استخدمي هاي لو محل واحد بده كمية أكبر من الحد المسموح له (70% من الحد الأدنى) — رفع الحد الأدنى بيرفع نصيب كل محل تلقائيًا، وبيضل يضمن مشاركة محلين على الأقل.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            الحد الأدنى الحالي: {increasingMinPool?.minQuantity} — الحد الأقصى: {increasingMinPool?.maxQuantity}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="الحد الأدنى الجديد"
            value={newMinQuantity}
            onChange={(e) => setNewMinQuantity(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setIncreasingMinPool(null)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="success" disabled={increasingMin} onClick={handleIncreaseMin}>
            {increasingMin ? 'جاري الرفع...' : 'رفع الحد الأدنى'}
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