import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import PoolCard from '../../components/PoolCard.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import PaymentMethodDialog from '../../components/PaymentMethodDialog.jsx';
import api from '../../api/axios.js';

const COMMITMENT_FEE_RATE = 0.05;

function BuyerDashboard() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [pools, setPools] = useState([]);
  const [joinedPoolIds, setJoinedPoolIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [quantityDialogPool, setQuantityDialogPool] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const shopRes = await api.get('/shops/me');
      setShop(shopRes.data.shop);

      const [poolsRes, participationsRes] = await Promise.all([
        api.get('/pools', { params: { deliveryZone: shopRes.data.shop.deliveryZone._id, status: 'OPEN' } }),
        api.get('/participations/me'),
      ]);

      setPools(poolsRes.data.pools);

      const activeJoinedIds = new Set(
        participationsRes.data.participations
          .filter((p) => p.status === 'ACTIVE' && p.poolId)
          .map((p) => p.poolId._id)
      );
      setJoinedPoolIds(activeJoinedIds);
    } catch (err) {
      setToast('تعذّر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openQuantityDialog = (pool) => {
    setQuantity('');
    setQuantityError('');
    setQuantityDialogPool(pool);
  };

  const proceedToPayment = () => {
    const qty = Number(quantity);
    const remaining = quantityDialogPool.maxQuantity - quantityDialogPool.currentQuantity;
    if (!quantity || qty < 1) {
      setQuantityError('أدخلي كمية صحيحة');
      return;
    }
    if (qty > remaining) {
      setQuantityError(`أقصى كمية متاحة حاليًا: ${remaining}`);
      return;
    }
    setQuantityError('');
    setPaymentOpen(true);
  };

  const handleJoinAfterPayment = async (paymentMethod) => {
    try {
      await api.post(`/pools/${quantityDialogPool._id}/join`, { quantity: Number(quantity), paymentMethod });
      setPaymentOpen(false);
      setQuantityDialogPool(null);
      setToast('تم الانضمام للسلة بنجاح ✓');
      loadData();
    } catch (err) {
      setPaymentOpen(false);
      setToast(err.response?.data?.message || 'تعذّر الانضمام للسلة');
    }
  };

  const navItems = [
    { key: 'pools', label: 'السلات المتاحة', onClick: () => navigate('/shop') },
    { key: 'history', label: 'سلاتي وطلباتي', onClick: () => navigate('/shop/history') },
    { key: 'settings', label: 'إعدادات المحل', onClick: () => navigate('/shop/settings') },
  ];

  const headerCard = shop && (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{shop.shopName}</Typography>
      <Typography sx={{ color: '#8B95AB', fontSize: 12 }}>{shop.deliveryZone?.name}</Typography>
    </Box>
  );

  const commitmentFee = quantityDialogPool
    ? Math.round(Number(quantity || 0) * quantityDialogPool.unitPrice * COMMITMENT_FEE_RATE * 100) / 100
    : 0;

  return (
    <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          السلات المتاحة
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          سلات ضمن منطقة "{shop?.deliveryZone?.name}" — مطابقة لمحلك تلقائيًا
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : pools.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ما في سلات مفتوحة بمنطقتك حاليًا — رجعي لاحقًا
          </Alert>
        ) : (
          <Grid container spacing={2.5}>
            {pools.map((pool) => {
              const alreadyJoined = joinedPoolIds.has(pool._id);
              return (
                <Grid item xs={12} sm={6} md={4} key={pool._id}>
                  <PoolCard
                    pool={pool}
                    action={
                      alreadyJoined ? (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                          label="منضمة بالفعل"
                          size="small"
                          sx={{ bgcolor: '#E7F8F0', color: '#047857', fontWeight: 700 }}
                        />
                      ) : (
                        <Button size="small" variant="contained" color="primary" onClick={() => openQuantityDialog(pool)}>
                          انضم للسلة
                        </Button>
                      )
                    }
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </AnimatedPage>

      <Dialog open={!!quantityDialogPool} onClose={() => setQuantityDialogPool(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>الانضمام لسلة {quantityDialogPool?.productName}</DialogTitle>
        <DialogContent>
          {quantityDialogPool?.description && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              {quantityDialogPool.description}
            </Alert>
          )}
          {quantityError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {quantityError}
            </Alert>
          )}
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            كم قطعة بدك تنضمي فيها؟
          </Typography>
          <TextField
            fullWidth
            type="number"
            placeholder="مثال: 20"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            sx={{ mb: 1 }}
          />
          {quantityDialogPool && (
            <Typography variant="caption" color="text.secondary">
              رسم الالتزام (5%): <b>{commitmentFee.toFixed(2)} د.أ</b> — قابل للاسترداد لو المورد رفض السلة
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setQuantityDialogPool(null)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" onClick={proceedToPayment}>
            المتابعة للدفع
          </Button>
        </DialogActions>
      </Dialog>

      <PaymentMethodDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={commitmentFee}
        description={`رسم الالتزام — ${quantityDialogPool?.productName}`}
        onConfirm={handleJoinAfterPayment}
        allowCash={true}
      />

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

export default BuyerDashboard;