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
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
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

      // no deliveryZone filter anymore — buyers can browse every open pool on the
      // platform, not just their own zone. Out-of-zone pools get a delivery-fee note
      // in the card below instead of being hidden entirely.
      const [poolsRes, participationsRes] = await Promise.all([
        api.get('/pools', { params: { status: 'OPEN' } }),
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
      setQuantityError(`أقصى كمية متاحة حاليًا: ${remaining} — استني المورد يرفع الحد الأقصى، أو قلّلي طلبك`);
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

  const isOutOfZone = (pool) => shop && pool.deliveryZone?._id !== shop.deliveryZone?._id;

  return (
    <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          السلات المتاحة
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          كل السلات المفتوحة بالمنصة — السلات برّا منطقتك ("{shop?.deliveryZone?.name}") معلّمة بملاحظة رسوم توصيل
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : pools.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ما في سلات مفتوحة بالمنصة حاليًا — رجعي لاحقًا
          </Alert>
        ) : (
          <Grid container spacing={2.5}>
            {pools.map((pool) => {
              const alreadyJoined = joinedPoolIds.has(pool._id);
              const outOfZone = isOutOfZone(pool);
              return (
                <Grid item xs={12} sm={6} md={4} key={pool._id}>
                  <Box>
                    {outOfZone && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          bgcolor: '#FEF3E2',
                          color: '#B45309',
                          borderRadius: '10px 10px 0 0',
                          px: 1.5,
                          py: 0.75,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <LocalShippingOutlinedIcon sx={{ fontSize: 15 }} />
                        خارج منطقتك ({pool.deliveryZone?.name}) — رسوم توصيل إضافية تُتّفق مباشرة مع المورد
                      </Box>
                    )}
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
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </AnimatedPage>

      <Dialog open={!!quantityDialogPool} onClose={() => setQuantityDialogPool(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>الانضمام لسلة {quantityDialogPool?.productName}</DialogTitle>
        <DialogContent>
          {quantityDialogPool && isOutOfZone(quantityDialogPool) && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} icon={<LocalShippingOutlinedIcon />}>
              هاي السلة خارج منطقتك ({quantityDialogPool.deliveryZone?.name}) — رح تحتاجي تتفقي مع المورد مباشرة على رسوم توصيل إضافية قبل التأكيد.
            </Alert>
          )}
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
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
              أقصى كمية مسموحة لمحلك بهالسلة: <b>{Math.floor(quantityDialogPool.minQuantity * 0.7)}</b> قطعة (للحفاظ على مبدأ التجميع بين محلات متعددة)
            </Typography>
          )}
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