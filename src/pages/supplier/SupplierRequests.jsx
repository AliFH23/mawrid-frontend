import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Button, Alert, Autocomplete, TextField, LinearProgress } from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const daysLeft = (expiresAt) => Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / 86400000));

function SupplierRequests() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/suppliers/me').then((res) => setSupplier(res.data.supplier)).catch(() => {});
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/market-requests', { params: categoryFilter ? { categoryId: categoryFilter._id } : {} })
      .then((res) => setRequests(res.data.requests))
      .catch(() => setError('تعذّر تحميل طلبات السوق'))
      .finally(() => setLoading(false));
  }, [categoryFilter]);

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
          sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: '#22304F', '& .MuiLinearProgress-bar': { bgcolor: '#34D399', borderRadius: 999 } }}
        />
      </Box>
    </Box>
  );

  const totalDemand = requests.reduce((sum, r) => sum + r.totalQuantity, 0);

  return (
    <DashboardLayout navItems={navItems} activeKey="requests" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          طلبات السوق
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          اللي المحلات بتدور عليه فعلًا — الأعلى طلبًا أول. افتحي سلة من أي طلب بضغطة وحدة.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Autocomplete
            size="small"
            sx={{ minWidth: 240 }}
            options={categories}
            getOptionLabel={(o) => o.name}
            value={categoryFilter}
            isOptionEqualToValue={(o, v) => o._id === v._id}
            onChange={(e, v) => setCategoryFilter(v)}
            renderInput={(params) => <TextField {...params} label="فلترة حسب الفئة" />}
          />
          {!loading && requests.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {requests.length} طلب مفتوح · إجمالي الطلب <b>{totalDemand}</b> وحدة
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : requests.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ما في طلبات مفتوحة {categoryFilter ? 'بهالفئة' : 'حاليًا'}
          </Alert>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2.5 }}>
            {requests.map((r) => {
              const categoryLabel = (r.categoryIds || []).map((c) => c.name).join('، ');
              return (
                <Paper key={r._id} sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
                  <Typography fontWeight={800} fontSize={15}>
                    {r.productName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {categoryLabel} {r.deliveryZone?.name ? `· ${r.deliveryZone.name}` : ''}
                  </Typography>

                  {r.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {r.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2 }}>
                    <Chip
                      icon={<GroupsOutlinedIcon sx={{ fontSize: 16 }} />}
                      label={`${r.supportersCount} ${r.supportersCount === 1 ? 'محل' : 'محلات'}`}
                      size="small"
                      sx={{ bgcolor: '#E7F8F0', color: '#047857', fontWeight: 700, fontSize: 11 }}
                    />
                    <Chip label={`${r.totalQuantity} وحدة`} size="small" sx={{ bgcolor: '#0B1220', color: '#fff', fontWeight: 700, fontSize: 11 }} />
                    <Chip
                      icon={<AccessTimeIcon sx={{ fontSize: 15 }} />}
                      label={`${daysLeft(r.expiresAt)} يوم`}
                      size="small"
                      sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700, fontSize: 11 }}
                    />
                  </Box>

                  <Button fullWidth variant="contained" color="primary" onClick={() => navigate('/supplier', { state: { fromRequest: r } })}>
                    افتح سلة من هالطلب
                  </Button>
                </Paper>
              );
            })}
          </Box>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default SupplierRequests;