import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Alert, Button, LinearProgress } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const STATUS_STYLES = {
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

// used by both the supplier (their own pools) and the admin (any pool)
function PoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pool, setPool] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = JSON.parse(localStorage.getItem('mawrid_user') || '{}').role === 'admin';

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [poolRes, participantsRes] = await Promise.all([
        api.get(`/pools/${id}`),
        api.get(`/pools/${id}/participants`),
      ]);
      setPool(poolRes.data.pool);
      setParticipants(participantsRes.data.participants);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر تحميل تفاصيل السلة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const backPath = isAdmin ? '/admin/pools' : '/supplier';
  const navItems = isAdmin
    ? [
        { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
        { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
        { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
        { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
        { key: 'users', label: 'المستخدمون', onClick: () => navigate('/admin/users') },
        { key: 'categories', label: 'الفئات', onClick: () => navigate('/admin/categories') },
        { key: 'zones', label: 'المحافظات والمناطق', onClick: () => navigate('/admin/zones') },
      ]
    : [
        { key: 'pools', label: 'سلاتي', onClick: () => navigate('/supplier') },
        { key: 'orders', label: 'طلبات الشراء المؤكّدة', onClick: () => navigate('/supplier/orders') },
        { key: 'profile', label: 'ملف الشركة', onClick: () => navigate('/supplier/profile') },
      ];

  const headerCard = (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{isAdmin ? 'مدير المنصة' : 'تفاصيل السلة'}</Typography>
    </Box>
  );

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      </DashboardLayout>
    );
  }

  if (error || !pool) {
    return (
      <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || 'السلة غير موجودة'}
        </Alert>
      </DashboardLayout>
    );
  }

  const status = STATUS_STYLES[pool.status] || STATUS_STYLES.OPEN;
  const percentage = Math.min(100, Math.round((pool.currentQuantity / pool.minQuantity) * 100));
  const categoryLabel = (pool.categoryIds || []).map((c) => c.name).join('، ');

  return (
    <DashboardLayout navItems={navItems} activeKey="pools" headerCard={headerCard}>
      <AnimatedPage>
        <Button startIcon={<ArrowForwardIcon />} onClick={() => navigate(backPath)} sx={{ mb: 2 }}>
          رجوع
        </Button>

        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }} elevation={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {pool.productName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {categoryLabel} · {pool.deliveryZone?.name}
                {isAdmin && pool.supplierId?.companyName ? ` · ${pool.supplierId.companyName}` : ''}
              </Typography>
              {pool.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 480 }}>
                  {pool.description}
                </Typography>
              )}
            </Box>
            <Chip label={status.label} sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700 }} />
          </Box>

          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{ height: 10, borderRadius: 999, mb: 1, bgcolor: '#EEF2F6', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 999 } }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {pool.currentQuantity} من <b>{pool.minQuantity}</b> (الحد الأقصى: {pool.maxQuantity})
          </Typography>

          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">سعر الوحدة</Typography>
              <Typography fontWeight={800}>{pool.unitPrice} د.أ</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">تاريخ الانتهاء</Typography>
              <Typography fontWeight={800}>{new Date(pool.expiryDate).toLocaleDateString('ar-EG')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">عدد المحلات المنضمة</Typography>
              <Typography fontWeight={800}>{participants.length}</Typography>
            </Box>
          </Box>
        </Paper>

        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          المحلات المشاركة
        </Typography>

        {participants.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ما في محلات انضمت لهالسلة لهلق
          </Alert>
        ) : (
          <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['المحل', 'صاحب المحل', 'الكمية', 'قيمة الطلب', 'رسم الالتزام', 'طريقة الدفع'].map((h) => (
                      <th key={h} style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => {
                    const feeStatus = FEE_STATUS[p.commitmentFeeStatus] || FEE_STATUS.PAID;
                    return (
                      <tr key={p._id}>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontWeight: 700, fontSize: 14 }}>
                          {p.shopId?.shopName || '—'}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>
                          {p.shopId?.userId?.name || '—'} · {p.shopId?.userId?.phone || ''}
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{p.quantity}</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{(p.quantity * pool.unitPrice).toFixed(1)} د.أ</td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                          <Chip label={feeStatus.label} size="small" sx={{ bgcolor: feeStatus.bg, color: feeStatus.color, fontWeight: 700, fontSize: 11 }} />
                        </td>
                        <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{p.paymentMethod || 'CARD'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Paper>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default PoolDetail;