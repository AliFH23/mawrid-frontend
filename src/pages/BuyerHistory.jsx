import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Button, Snackbar, Alert } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import AnimatedPage from '../components/AnimatedPage.jsx';
import PaymentMethodDialog from '../components/Paymentmethoddialog.jsx';
import api from '../api/axios.js';

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
  const [toast, setToast] = useState('');

  const [payingParticipation, setPayingParticipation] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

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

  const openPayBalance = (participation) => {
    setPayingParticipation(participation);
    setPaymentOpen(true);
  };

  const handlePayBalanceConfirmed = async () => {
    try {
      await api.put(`/participations/${payingParticipation._id}/pay-balance`);
      setPaymentOpen(false);
      setPayingParticipation(null);
      setToast('تم دفع المبلغ المتبقي بنجاح ✓');
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

  const remainingBalance = payingParticipation
    ? payingParticipation.quantity * payingParticipation.poolId.unitPrice - payingParticipation.commitmentFeeAmount
    : 0;

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
              const balance = p.quantity * pool.unitPrice - p.commitmentFeeAmount;

              // cash participants skip the online final-payment step entirely
              const needsOnlinePayment = !isCash && pool.status === 'COMPLETED' && p.finalPaymentStatus === 'PENDING';
              const canConfirmReceipt =
                pool.status === 'COMPLETED' &&
                p.deliveryStatus === 'PENDING_DELIVERY' &&
                (isCash || p.finalPaymentStatus === 'PAID');

              return (
                <Paper key={p._id} sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography fontWeight={800} fontSize={15} sx={{ mb: 0.5 }}>
                        {pool.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        الكمية: {p.quantity} · السعر الإجمالي: {(p.quantity * pool.unitPrice).toFixed(1)} د.أ · طريقة الدفع: {METHOD_LABEL[p.paymentMethod] || 'بطاقة'}
                        {pool.status === 'COMPLETED' && !isCash && ` · المتبقي: ${balance.toFixed(1)} د.أ`}
                        {pool.status === 'COMPLETED' && isCash && ` · يُدفع نقدًا عند الاستلام: ${balance.toFixed(1)} د.أ`}
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
                    </Box>
                  </Box>

                  {(needsOnlinePayment || canConfirmReceipt) && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {needsOnlinePayment && (
                        <Button size="small" variant="contained" color="primary" startIcon={<PaymentIcon />} onClick={() => openPayBalance(p)}>
                          ادفعي المبلغ المتبقي ({balance.toFixed(1)} د.أ)
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
                          {confirmingId === p._id
                            ? 'جاري التأكيد...'
                            : isCash
                            ? `أكّدي الاستلام والدفع نقدًا (${balance.toFixed(1)} د.أ)`
                            : 'أكّدي إنك استلمتِ البضاعة'}
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
        amount={remainingBalance}
        description={`المبلغ المتبقي — ${payingParticipation?.poolId?.productName || ''}`}
        onConfirm={handlePayBalanceConfirmed}
        allowCash={false}
      />

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default BuyerHistory;