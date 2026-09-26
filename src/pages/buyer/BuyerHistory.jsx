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
  Rating,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import StarIcon from '@mui/icons-material/Star';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import PaymentMethodDialog from '../../components/PaymentMethodDialog.jsx';
import api from '../../api/axios.js';

const POOL_STATUS = {
  OPEN: { label: 'مفتوحة', bg: '#E7F8F0', color: '#047857' },
  PENDING_SUPPLIER_CONFIRMATION: { label: 'بانتظار التأكيد', bg: '#FEF3E2', color: '#B45309' },
  COMPLETED: { label: 'مؤكّدة', bg: '#0B1220', color: '#fff' },
  EXPIRED: { label: 'منتهية', bg: '#F1F5F9', color: '#64748B' },
  CANCELLED: { label: 'ملغاة', bg: '#FDECEC', color: '#DC2626' },
};

const FEE_STATUS = {
  PAID: { label: 'مدفوع', bg: '#EFF6FF', color: '#1D4ED8' },
  REFUNDED: { label: 'مسترد', bg: '#F1F5F9', color: '#64748B' },
  FORFEITED: { label: 'محتجز', bg: '#FDECEC', color: '#DC2626' },
};

const DELIVERY_STATUS = {
  PENDING_DELIVERY: { label: 'بانتظار الاستلام', bg: '#FEF3E2', color: '#B45309' },
  DELIVERED: { label: 'تم الاستلام', bg: '#E7F8F0', color: '#047857' },
};

const METHOD_LABEL = {
  CARD: 'بطاقة',
  CASH: 'كاش عند الاستلام',
  ZAIN_CASH: 'Zain Cash',
  ORANGE_MONEY: 'Orange Money',
  CLIQ: 'كليك CliQ',
};

function BuyerHistory() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [toast, setToast] = useState('');

  const [payingParticipation, setPayingParticipation] = useState(null);
  const [balancePreview, setBalancePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // rating dialog
  const [ratingParticipation, setRatingParticipation] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const shopRes = await api.get('/shops/me');
      setShop(shopRes.data.shop);
      const res = await api.get('/participations/me');
      setParticipations(res.data.participations);
    } catch {
      setToast('تعذّر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPayBalance = async (participation) => {
    setPayingParticipation(participation);
    setBalancePreview(null);
    setPreviewLoading(true);
    try {
      const res = await api.get(`/participations/${participation._id}/balance-preview`);
      setBalancePreview(res.data.breakdown);
    } catch {
      setToast('تعذّر جلب تفاصيل المبلغ المتبقي');
    } finally {
      setPreviewLoading(false);
    }
    setPaymentOpen(true);
  };

  const handlePayBalanceConfirmed = async () => {
    try {
      const res = await api.put(`/participations/${payingParticipation._id}/pay-balance`);
      setPaymentOpen(false);
      setPayingParticipation(null);
      const cashback = res.data.breakdown?.cashbackAmount || 0;
      setToast(cashback > 0 ? `تم الدفع بنجاح ✓ — ربحتِ ${cashback.toFixed(2)} د.أ كاش باك!` : 'تم دفع المبلغ المتبقي بنجاح ✓');
      loadData();
    } catch (err) {
      setPaymentOpen(false);
      setToast(err.response?.data?.message || 'تعذّر إتمام الدفع');
    }
  };

  const handleConfirmReceipt = async (participationId) => {
    setConfirmingId(participationId);
    try {
      await api.put(`/participations/${participationId}/confirm-receipt`);
      setToast('تم تأكيد الاستلام ✓');
      loadData();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر تأكيد الاستلام');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleLeave = async (poolId, participationId) => {
    if (!window.confirm('متأكدة بدك تنسحبي من هالسلة؟ رسم الالتزام يلي دفعتيه رح يضيع (مش مسترد) كعقوبة على الانسحاب الطوعي.')) {
      return;
    }
    setLeavingId(participationId);
    try {
      await api.delete(`/pools/${poolId}/leave`);
      setToast('تم الانسحاب من السلة — رسم الالتزام محتجز');
      loadData();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر الانسحاب من السلة');
    } finally {
      setLeavingId(null);
    }
  };

  const openRatingDialog = (participation) => {
    setRatingStars(5);
    setRatingComment('');
    setRatingError('');
    setRatingParticipation(participation);
  };

  const handleSubmitRating = async () => {
    setRatingError('');
    setRatingSaving(true);
    try {
      await api.post('/ratings', {
        poolId: ratingParticipation.poolId._id,
        stars: ratingStars,
        comment: ratingComment.trim(),
      });
      setToast('شكرًا على تقييمك ✓');
      setRatingParticipation(null);
      loadData();
    } catch (err) {
      setRatingError(err.response?.data?.message || 'تعذّر إرسال التقييم');
    } finally {
      setRatingSaving(false);
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
      {shop.cashbackBalance > 0 && (
        <Typography sx={{ color: '#34D399', fontSize: 12, fontWeight: 800, mt: 0.5 }}>
          رصيد الكاش باك: {shop.cashbackBalance.toFixed(2)} د.أ
        </Typography>
      )}
    </Box>
  );

  return (
    <DashboardLayout navItems={navItems} activeKey="history" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          سلاتي وطلباتي
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          كل السلات يلي انضممتِ فيها، وحالة كل واحدة منهم
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : participations.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            لسا ما انضممتِ لأي سلة — روحي لـ "السلات المتاحة" وابدئي
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {participations.map((p) => {
              const pool = p.poolId;
              if (!pool) return null;
              const poolStatus = POOL_STATUS[pool.status] || POOL_STATUS.OPEN;
              const feeStatus = FEE_STATUS[p.commitmentFeeStatus] || FEE_STATUS.PAID;
              const deliveryStatus = DELIVERY_STATUS[p.deliveryStatus] || DELIVERY_STATUS.PENDING_DELIVERY;
              const isCash = p.paymentMethod === 'CASH';

              const needsOnlinePayment = !isCash && pool.status === 'COMPLETED' && p.finalPaymentStatus === 'PENDING';
              const canConfirmReceipt =
                pool.status === 'COMPLETED' &&
                p.deliveryStatus === 'PENDING_DELIVERY' &&
                (isCash || p.finalPaymentStatus === 'PAID');
              const canLeave = p.status === 'ACTIVE' && (pool.status === 'OPEN' || pool.status === 'PENDING_SUPPLIER_CONFIRMATION');
              const canRate = p.deliveryStatus === 'DELIVERED' && !p.rated;

              return (
                <Paper key={p._id} sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography fontWeight={800} fontSize={15} sx={{ mb: 0.5 }}>
                        {pool.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        الكمية: {p.quantity} · السعر الإجمالي: {(p.quantity * pool.unitPrice).toFixed(1)} د.أ · طريقة الدفع: {METHOD_LABEL[p.paymentMethod] || 'بطاقة'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={poolStatus.label} size="small" sx={{ bgcolor: poolStatus.bg, color: poolStatus.color, fontWeight: 700, fontSize: 11 }} />
                      <Chip label={`رسم الالتزام: ${feeStatus.label}`} size="small" sx={{ bgcolor: feeStatus.bg, color: feeStatus.color, fontWeight: 700, fontSize: 11 }} />
                      {pool.status === 'COMPLETED' && !isCash && (
                        <Chip
                          label={p.finalPaymentStatus === 'PAID' ? 'المبلغ المتبقي: مدفوع' : 'المبلغ المتبقي: غير مدفوع'}
                          size="small"
                          sx={{
                            bgcolor: p.finalPaymentStatus === 'PAID' ? '#E7F8F0' : '#FDECEC',
                            color: p.finalPaymentStatus === 'PAID' ? '#047857' : '#DC2626',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                      )}
                      {pool.status === 'COMPLETED' && (
                        <Chip label={deliveryStatus.label} size="small" sx={{ bgcolor: deliveryStatus.bg, color: deliveryStatus.color, fontWeight: 700, fontSize: 11 }} />
                      )}
                      {p.rated && (
                        <Chip icon={<StarIcon sx={{ fontSize: 14 }} />} label="تم التقييم" size="small" sx={{ bgcolor: '#FFF7ED', color: '#C2410C', fontWeight: 700, fontSize: 11 }} />
                      )}
                    </Box>
                  </Box>

                  {(needsOnlinePayment || canConfirmReceipt || canLeave || canRate) && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {needsOnlinePayment && (
                        <Button size="small" variant="contained" color="primary" startIcon={<PaymentIcon />} onClick={() => openPayBalance(p)}>
                          ادفعي المبلغ المتبقي
                        </Button>
                      )}
                      {canConfirmReceipt && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<CheckCircleOutlineIcon />}
                          disabled={confirmingId === p._id}
                          onClick={() => handleConfirmReceipt(p._id)}
                        >
                          {confirmingId === p._id ? 'جاري التأكيد...' : isCash ? 'أكّدي الاستلام والدفع نقدًا' : 'أكّدي إنك استلمتِ البضاعة'}
                        </Button>
                      )}
                      {canRate && (
                        <Button size="small" variant="outlined" color="warning" startIcon={<StarIcon />} onClick={() => openRatingDialog(p)}>
                          قيّمي المورد
                        </Button>
                      )}
                      {canLeave && (
                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          startIcon={<ExitToAppIcon />}
                          disabled={leavingId === p._id}
                          onClick={() => handleLeave(pool._id, p._id)}
                        >
                          {leavingId === p._id ? 'جاري الانسحاب...' : 'الانسحاب من السلة'}
                        </Button>
                      )}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}
      </AnimatedPage>

      <PaymentMethodDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={balancePreview?.totalBalance || 0}
        description={
          previewLoading
            ? 'جاري حساب المبلغ...'
            : `المبلغ المتبقي — ${payingParticipation?.poolId?.productName || ''}${
                balancePreview?.loyaltyDiscountAmount > 0
                  ? ` (شامل خصم ولاء ${Math.round(balancePreview.loyaltyDiscountRate * 100)}%: -${balancePreview.loyaltyDiscountAmount.toFixed(2)} د.أ)`
                  : ''
              }`
        }
        onConfirm={handlePayBalanceConfirmed}
        allowCash={false}
      />

      <Dialog open={!!ratingParticipation} onClose={() => setRatingParticipation(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>قيّمي {ratingParticipation?.poolId?.productName}</DialogTitle>
        <DialogContent>
          {ratingError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {ratingError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 1 }}>
            <Rating value={ratingStars} onChange={(e, v) => setRatingStars(v || 1)} size="large" />
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="تعليق (اختياري)"
            placeholder="شاركينا تجربتك مع هالمورد"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setRatingParticipation(null)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={ratingSaving} onClick={handleSubmitRating}>
            {ratingSaving ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default BuyerHistory;