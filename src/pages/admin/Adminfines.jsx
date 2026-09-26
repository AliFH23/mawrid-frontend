import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Alert, Chip } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

function AdminFines() {
  const navigate = useNavigate();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/fines')
      .then((res) => setFines(res.data.fines))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
    { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
    { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
    { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
    { key: 'fines', label: 'الغرامات', onClick: () => navigate('/admin/fines') },
    { key: 'settings', label: 'الإعدادات المالية', onClick: () => navigate('/admin/settings') },
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
    <DashboardLayout navItems={navItems} activeKey="fines" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          الغرامات
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          سجل رسمي بكل مخالفة (رفض سلة بعد وصولها للحد الأدنى) — قابلة للإحالة لغرفة التجارة عند تكرارها
        </Typography>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : fines.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              ما في غرامات مسجّلة لهلق
            </Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['التاريخ', 'المورد', 'السلة', 'السبب', 'الخصم من الموثوقية', 'الحالة'].map((h) => (
                      <th key={h} style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fines.map((f) => (
                    <tr key={f._id}>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(f.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontWeight: 700, fontSize: 14 }}>
                        {f.supplierId?.companyName || '—'}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>
                        {f.poolId?.productName || '—'}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#334155', maxWidth: 320 }}>
                        {f.reason}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#DC2626', fontWeight: 700 }}>
                        -{f.reliabilityScorePenalty}
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                        {f.reportedToChamberOfCommerce && (
                          <Chip label="قابلة للإحالة لغرفة التجارة" size="small" sx={{ bgcolor: '#FDECEC', color: '#DC2626', fontWeight: 700, fontSize: 10 }} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Paper>
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default AdminFines;