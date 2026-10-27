import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const ROLE_LABEL = { supplier: 'مورد', buyer: 'مشروع صغير' };

const TX_STYLES = {
  COMMITMENT_FEE_PAID: { label: 'رسم التزام مدفوع', bg: '#EFF6FF', color: '#1D4ED8' },
  COMMITMENT_FEE_REFUNDED: { label: 'رسم التزام مسترد', bg: '#F1F5F9', color: '#64748B' },
  COMMITMENT_FEE_FORFEITED: { label: 'رسم التزام محتجز', bg: '#FDECEC', color: '#DC2626' },
  FINAL_PAYMENT: { label: 'دفع نهائي', bg: '#E7F8F0', color: '#047857' },
  SUPPLIER_COMMISSION: { label: 'عمولة مورد', bg: '#FEF3E2', color: '#B45309' },
  BUYER_COMMISSION: { label: 'عمولة محل', bg: '#FEF3E2', color: '#B45309' },
  LOYALTY_DISCOUNT_APPLIED: { label: 'خصم ولاء', bg: '#F3E8FF', color: '#7C3AED' },
  CASHBACK_EARNED: { label: 'كاش باك', bg: '#ECFDF5', color: '#059669' },
};

const POOL_STATUS = {
  OPEN: { label: 'مفتوحة', bg: '#E7F8F0', color: '#047857' },
  PENDING_SUPPLIER_CONFIRMATION: { label: 'بانتظار التأكيد', bg: '#FEF3E2', color: '#B45309' },
  COMPLETED: { label: 'مؤكّدة', bg: '#0B1220', color: '#fff' },
  EXPIRED: { label: 'منتهية', bg: '#F1F5F9', color: '#64748B' },
  CANCELLED: { label: 'ملغاة', bg: '#FDECEC', color: '#DC2626' },
};

const DELIVERY_LABEL = { PENDING_DELIVERY: 'بانتظار الشحن', OUT_FOR_DELIVERY: 'في الطريق', DELIVERED: 'تم الاستلام' };
const FEE_LABEL = { PAID: 'مدفوع', REFUNDED: 'مسترد', FORFEITED: 'محتجز' };
const METHOD_LABEL = { CARD: 'بطاقة', CASH: 'كاش', ZAIN_CASH: 'Zain Cash', ORANGE_MONEY: 'Orange Money', CLIQ: 'كليك' };

const TH = { textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' };
const TD = { padding: '12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 };

const money = (n) => `${Number(n || 0).toFixed(2)} د.أ`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG') : '—');
const formatDateTime = (d) => (d ? new Date(d).toLocaleString('ar-EG') : '—');

function StatTile({ label, value, tone }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3, flex: '1 1 160px' }} elevation={0}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={800} fontSize={18} sx={{ color: tone || 'text.primary', mt: 0.25 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function InfoRow({ label, children }) {
  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={700} fontSize={14}>
        {children || '—'}
      </Typography>
    </Box>
  );
}

function SimpleTable({ headers, rows, emptyText }) {
  if (rows.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        {emptyText}
      </Alert>
    );
  }
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </Box>
  );
}

function AdminUserLookup() {
  const navigate = useNavigate();
  const { publicId } = useParams();
  const [query, setQuery] = useState(publicId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('finance');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQuery(publicId || '');
    setData(null);
    setError('');
    setTab('finance');
    if (!publicId) return;

    setLoading(true);
    api
      .get(`/admin/lookup/${encodeURIComponent(publicId)}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'تعذّر جلب بيانات المستخدم'))
      .finally(() => setLoading(false));
  }, [publicId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const id = query.trim().toUpperCase();
    if (id) navigate(`/admin/lookup/${id}`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.user.publicId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — nothing to do
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

  const isShop = data?.user.role === 'buyer';
  const profile = data?.profile;
  const summary = data?.financialSummary;

  const renderSummary = () => {
    if (!summary) return null;
    if (isShop) {
      return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <StatTile label="صافي ما دفعه" value={money(summary.netPaid)} tone="#1D4ED8" />
          <StatTile label="رسوم التزام مدفوعة" value={money(summary.commitmentFeesPaid)} />
          <StatTile label="دفعات نهائية" value={money(summary.finalPayments)} />
          <StatTile label="مسترد" value={money(summary.refunded)} />
          <StatTile label="محتجز (انسحاب)" value={money(summary.forfeited)} tone="#DC2626" />
          <StatTile label="رصيد الكاش باك" value={money(summary.cashbackBalance)} tone="#059669" />
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <StatTile label="طلبات شراء مؤكّدة" value={summary.confirmedOrders} />
        <StatTile label="إجمالي المبيعات المؤكّدة" value={money(summary.confirmedOrdersTotal)} />
        <StatTile label="عمولة المنصة" value={money(summary.commissionPaid)} tone="#B45309" />
        <StatTile label="صافي الأرباح" value={money(summary.netEarnings)} tone="#047857" />
        <StatTile label="غرامات" value={summary.finesCount} tone={summary.finesCount > 0 ? '#DC2626' : undefined} />
      </Box>
    );
  };

  const transactionRows = (data?.transactions || []).map((t) => {
    const style = TX_STYLES[t.type] || { label: t.type, bg: '#F1F5F9', color: '#64748B' };
    return (
      <tr key={t._id}>
        <td style={{ ...TD, color: '#64748B' }}>{formatDateTime(t.createdAt)}</td>
        <td style={TD}>
          <Chip label={style.label} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: 11 }} />
        </td>
        <td style={{ ...TD, fontWeight: 700 }}>{money(t.amount)}</td>
        <td style={{ ...TD, color: '#64748B' }}>{t.description}</td>
        <td style={TD}>{t.poolId?.productName || '—'}</td>
      </tr>
    );
  });

  const participationRows = (data?.participations || []).map((p) => (
    <tr key={p._id}>
      <td style={{ ...TD, fontWeight: 700 }}>{p.poolId?.productName || '—'}</td>
      <td style={TD}>{p.quantity}</td>
      <td style={TD}>{p.poolId ? money(p.quantity * p.poolId.unitPrice) : '—'}</td>
      <td style={TD}>{METHOD_LABEL[p.paymentMethod] || p.paymentMethod}</td>
      <td style={TD}>
        {money(p.commitmentFeeAmount)} · {FEE_LABEL[p.commitmentFeeStatus] || p.commitmentFeeStatus}
      </td>
      <td style={TD}>{p.finalPaymentStatus === 'PAID' ? 'مدفوع' : 'غير مدفوع'}</td>
      <td style={TD}>{p.status === 'CANCELLED' ? 'منسحب' : DELIVERY_LABEL[p.deliveryStatus] || p.deliveryStatus}</td>
      <td style={{ ...TD, color: '#64748B' }}>{formatDate(p.createdAt)}</td>
    </tr>
  ));

  const poolRows = (data?.pools || []).map((p) => {
    const status = POOL_STATUS[p.status] || POOL_STATUS.OPEN;
    return (
      <tr key={p._id}>
        <td style={{ ...TD, fontWeight: 700 }}>{p.productName}</td>
        <td style={TD}>{money(p.unitPrice)}</td>
        <td style={TD}>
          {p.currentQuantity} / {p.minQuantity}
        </td>
        <td style={TD}>
          <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: 11 }} />
        </td>
        <td style={{ ...TD, color: '#64748B' }}>{formatDate(p.createdAt)}</td>
        <td style={TD}>
          <Button size="small" variant="text" onClick={() => navigate(`/pools/${p._id}`)}>
            التفاصيل
          </Button>
        </td>
      </tr>
    );
  });

  const orderRows = (data?.purchaseOrders || []).map((o) => (
    <tr key={o._id}>
      <td style={{ ...TD, fontWeight: 700 }}>{o.poolId?.productName || '—'}</td>
      <td style={TD}>{o.totalQuantity}</td>
      <td style={TD}>{money(o.totalAmount)}</td>
      <td style={{ ...TD, color: '#B45309' }}>{money(o.supplierCommission)}</td>
      <td style={TD}>
        <Chip
          label={o.status === 'CONFIRMED' ? 'مؤكّد' : 'مرفوض'}
          size="small"
          sx={{ bgcolor: o.status === 'CONFIRMED' ? '#E7F8F0' : '#FDECEC', color: o.status === 'CONFIRMED' ? '#047857' : '#DC2626', fontWeight: 700, fontSize: 11 }}
        />
      </td>
      <td style={{ ...TD, color: '#64748B' }}>{o.rejectionReason || '—'}</td>
      <td style={{ ...TD, color: '#64748B' }}>{formatDate(o.confirmedAt || o.createdAt)}</td>
    </tr>
  ));

  const fineRows = (data?.fines || []).map((f) => (
    <tr key={f._id}>
      <td style={{ ...TD, color: '#64748B' }}>{formatDate(f.createdAt)}</td>
      <td style={{ ...TD, fontWeight: 700 }}>{f.poolId?.productName || '—'}</td>
      <td style={TD}>{f.reason}</td>
      <td style={{ ...TD, color: '#DC2626' }}>-{f.reliabilityScorePenalty} نقطة</td>
      <td style={TD}>{f.reportedToChamberOfCommerce ? 'محال لغرفة التجارة' : '—'}</td>
    </tr>
  ));

  const tabs = isShop
    ? [
        { key: 'finance', label: `السجل المالي (${transactionRows.length})` },
        { key: 'participations', label: `المشاركات (${participationRows.length})` },
      ]
    : [
        { key: 'finance', label: `السجل المالي (${transactionRows.length})` },
        { key: 'pools', label: `السلات (${poolRows.length})` },
        { key: 'orders', label: `طلبات الشراء (${orderRows.length})` },
        { key: 'fines', label: `الغرامات (${fineRows.length})` },
      ];

  return (
    <DashboardLayout navItems={navItems} activeKey="users" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          بحث برقم المستخدم
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          اكتب رقم المحل (SHP-1001) أو المورد (SUP-1001) لعرض ملفه وسجله المالي
        </Typography>

        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1.5, mb: 3, maxWidth: 480 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="SHP-1001"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ dir: 'ltr', style: { textAlign: 'left', letterSpacing: 1 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" color="primary">
            بحث
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        )}

        {error && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {data && (
          <>
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }} elevation={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {isShop ? profile?.shopName || data.user.name : profile?.companyName || data.user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {data.user.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip label={ROLE_LABEL[data.user.role]} size="small" sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }} />
                  <Chip
                    label={data.user.isActive ? 'نشط' : 'معطّل'}
                    size="small"
                    sx={{ bgcolor: data.user.isActive ? '#E7F8F0' : '#FDECEC', color: data.user.isActive ? '#047857' : '#DC2626', fontWeight: 700 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                    onClick={handleCopy}
                    sx={{ direction: 'ltr', letterSpacing: 1 }}
                  >
                    {copied ? 'تم النسخ' : data.user.publicId}
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <InfoRow label="البريد الإلكتروني">{data.user.email}</InfoRow>
                <InfoRow label="الهاتف">{data.user.phone}</InfoRow>
                <InfoRow label="تاريخ التسجيل">{formatDate(data.user.createdAt)}</InfoRow>
                <InfoRow label="السجل التجاري">{profile?.commercialRegistrationNumber}</InfoRow>
                {isShop ? (
                  <>
                    <InfoRow label="المنطقة">{profile?.deliveryZone?.name}</InfoRow>
                    <InfoRow label="الفئات">{(profile?.categoryIds || []).map((c) => c.name).join('، ')}</InfoRow>
                  </>
                ) : (
                  <>
                    <InfoRow label="درجة الموثوقية">{profile ? `${profile.reliabilityScore} / 100` : null}</InfoRow>
                    <InfoRow label="التقييم">
                      {profile?.ratingCount ? `${Number(profile.averageRating).toFixed(1)} (${profile.ratingCount} تقييم)` : 'لا يوجد تقييمات'}
                    </InfoRow>
                  </>
                )}
              </Box>

              {!profile && (
                <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                  هالحساب لسا ما أكمل إعداد ملفه ({isShop ? 'المحل' : 'الشركة'})
                </Alert>
              )}
            </Paper>

            {renderSummary()}

            <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: '1px solid #EEF2F6' }}>
                {tabs.map((t) => (
                  <Tab key={t.key} value={t.key} label={t.label} sx={{ fontWeight: 700 }} />
                ))}
              </Tabs>

              {tab === 'finance' && (
                <SimpleTable
                  headers={['التاريخ', 'النوع', 'المبلغ', 'الوصف', 'السلة']}
                  rows={transactionRows}
                  emptyText="ما في معاملات مالية مسجّلة لهالحساب"
                />
              )}
              {tab === 'participations' && (
                <SimpleTable
                  headers={['السلة', 'الكمية', 'قيمة الطلب', 'طريقة الدفع', 'رسم الالتزام', 'المتبقي', 'التوصيل', 'التاريخ']}
                  rows={participationRows}
                  emptyText="لسا ما انضم لأي سلة"
                />
              )}
              {tab === 'pools' && (
                <SimpleTable
                  headers={['السلة', 'السعر', 'الكمية', 'الحالة', 'تاريخ الإنشاء', '']}
                  rows={poolRows}
                  emptyText="لسا ما فتح أي سلة"
                />
              )}
              {tab === 'orders' && (
                <SimpleTable
                  headers={['السلة', 'الكمية', 'الإجمالي', 'عمولة المنصة', 'الحالة', 'سبب الرفض', 'التاريخ']}
                  rows={orderRows}
                  emptyText="ما في طلبات شراء بعد"
                />
              )}
              {tab === 'fines' && (
                <SimpleTable
                  headers={['التاريخ', 'السلة', 'السبب', 'خصم الموثوقية', 'الإحالة']}
                  rows={fineRows}
                  emptyText="ما في غرامات على هالمورد"
                />
              )}

              {(data.transactions?.length >= 100 || data.participations?.length >= 100) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                  بنعرض آخر 100 سجل لكل قائمة. الإجماليات فوق محسوبة على كل السجلات.
                </Typography>
              )}
            </Paper>
          </>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default AdminUserLookup;