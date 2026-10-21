import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Alert, Button, Snackbar, Tabs, Tab } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const DELIVERY_STATUS = {
  PENDING_DELIVERY: { label: 'بانتظار الاستلام من المورد', bg: '#FEF3E2', color: '#B45309' },
  OUT_FOR_DELIVERY: { label: 'في الطريق للمحل', bg: '#EFF6FF', color: '#1D4ED8' },
  DELIVERED: { label: 'تم التسليم', bg: '#E7F8F0', color: '#047857' },
};

const REFRESH_MS = 30000;

const TH = { textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' };
const TD = { padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, verticalAlign: 'top' };

function CourierDashboard() {
  const navigate = useNavigate();
  const [courier, setCourier] = useState(null);
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const [availableRes, mineRes] = await Promise.all([api.get('/couriers/available'), api.get('/couriers/deliveries')]);
      setAvailable(availableRes.data.deliveries);
      setMine(mineRes.data.deliveries);
    } catch {
      // keeps the last data on screen; the next refresh tries again
    }
  }, []);

  useEffect(() => {
    api
      .get('/couriers/me')
      .then(async (res) => {
        setCourier(res.data.courier);
        await load();
      })
      .catch(() => navigate('/courier/setup', { replace: true })) // no profile yet
      .finally(() => setLoading(false));
  }, [load, navigate]);

  // new orders appear as suppliers offer them — refresh while the page is open
  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (id, action, successMessage) => {
    setBusyId(id);
    try {
      await api.put(`/couriers/deliveries/${id}/${action}`);
      setToast(successMessage);
      if (action === 'claim') setTab('mine');
      await load();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر تنفيذ العملية');
      await load(); // e.g. someone else claimed it first — refresh the board
    } finally {
      setBusyId(null);
    }
  };

  const navItems = [
    { key: 'deliveries', label: 'التوصيلات', onClick: () => navigate('/courier') },
    { key: 'profile', label: 'ملفي ومنطقتي', onClick: () => navigate('/courier/setup') },
  ];

  const headerCard = courier && (
    <Box sx={{ bgcolor: '#111A30', borderRadius: 2, p: 1.75, mb: 2.5 }}>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{courier.deliveryZone?.name}</Typography>
      <Typography sx={{ color: '#8B95AB', fontSize: 12 }}>{courier.deliveryZone?.governorateId?.name}</Typography>
    </Box>
  );

  const activeMine = mine.filter((d) => d.deliveryStatus !== 'DELIVERED');

  return (
    <DashboardLayout navItems={navItems} activeKey="deliveries" headerCard={headerCard}>
      <AnimatedPage>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h5" fontWeight={800}>
            التوصيلات
          </Typography>
          <Button size="small" startIcon={<RefreshIcon />} onClick={load}>
            تحديث
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          الطلبات الجاهزة للتوصيل بمنطقتك{courier ? ` (${courier.deliveryZone?.name})` : ''}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #EEF2F6' }}>
              <Tab value="available" label={`متاح للاستلام (${available.length})`} sx={{ fontWeight: 700 }} />
              <Tab value="mine" label={`توصيلاتي (${activeMine.length})`} sx={{ fontWeight: 700 }} />
            </Tabs>

            {tab === 'available' &&
              (available.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  ما في طلبات متاحة بمنطقتك هلق. بتظهر هون لما المورد يعرضها للمناديب.
                </Alert>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['المنتج', 'الكمية', 'المحل', 'المورد', ''].map((h) => (
                          <th key={h} style={TH}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {available.map((d) => (
                        <tr key={d._id}>
                          <td style={{ ...TD, fontWeight: 700 }}>{d.productName}</td>
                          <td style={TD}>{d.quantity}</td>
                          <td style={TD}>{d.shopName}</td>
                          <td style={{ ...TD, color: '#64748B' }}>{d.supplierName}</td>
                          <td style={TD}>
                            <Button size="small" variant="contained" disabled={busyId === d._id} onClick={() => act(d._id, 'claim', 'تم استلام الطلب ✓')}>
                              استلم الطلب
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ))}

            {tab === 'mine' &&
              (mine.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  لسا ما استلمت أي طلب
                </Alert>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['المنتج', 'الكمية', 'استلام من (المورد)', 'توصيل إلى (المحل)', 'الحالة', ''].map((h) => (
                          <th key={h} style={TH}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mine.map((d) => {
                        const status = DELIVERY_STATUS[d.deliveryStatus] || DELIVERY_STATUS.PENDING_DELIVERY;
                        return (
                          <tr key={d._id}>
                            <td style={{ ...TD, fontWeight: 700 }}>{d.productName}</td>
                            <td style={TD}>{d.quantity}</td>
                            <td style={TD}>
                              {d.supplier.company}
                              <br />
                              <span style={{ color: '#64748B', direction: 'ltr', display: 'inline-block' }}>{d.supplier.phone}</span>
                            </td>
                            <td style={TD}>
                              {d.shop.name} · {d.shop.zone}
                              <br />
                              <span style={{ color: '#64748B' }}>{d.shop.owner}</span>{' '}
                              <span style={{ color: '#64748B', direction: 'ltr', display: 'inline-block' }}>{d.shop.phone}</span>
                            </td>
                            <td style={TD}>
                              <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: 11 }} />
                            </td>
                            <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                              {d.deliveryStatus === 'PENDING_DELIVERY' && (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    disabled={busyId === d._id}
                                    onClick={() => act(d._id, 'start', 'تم تسجيل خروجك بالطلب ✓')}
                                    sx={{ ml: 1 }}
                                  >
                                    استلمته وبلّشت التوصيل
                                  </Button>
                                  <Button size="small" variant="text" color="secondary" disabled={busyId === d._id} onClick={() => act(d._id, 'release', 'تم إرجاع الطلب للقائمة')}>
                                    إرجاع
                                  </Button>
                                </>
                              )}
                              {d.deliveryStatus === 'OUT_FOR_DELIVERY' && (
                                <Typography variant="caption" color="text.secondary">
                                  بانتظار تأكيد المحل للاستلام
                                </Typography>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Box>
              ))}
          </Paper>
        )}
      </AnimatedPage>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default CourierDashboard;