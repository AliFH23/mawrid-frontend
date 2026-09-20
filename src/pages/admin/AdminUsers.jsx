import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Button, Snackbar, TextField, MenuItem } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

const ROLE_LABEL = { admin: 'مدير', supplier: 'مورد', buyer: 'مشروع صغير' };

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: roleFilter ? { role: roleFilter } : {} });
      setUsers(res.data.users);
    } catch {
      setToast('تعذّر تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleToggle = async (userId) => {
    setBusyId(userId);
    try {
      await api.put(`/admin/users/${userId}/toggle-status`);
      loadUsers();
    } catch (err) {
      setToast(err.response?.data?.message || 'تعذّر تنفيذ العملية');
    } finally {
      setBusyId(null);
    }
  };

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', onClick: () => navigate('/admin') },
    { key: 'pools', label: 'السلات', onClick: () => navigate('/admin/pools') },
    { key: 'orders', label: 'طلبات الشراء', onClick: () => navigate('/admin/orders') },
    { key: 'transactions', label: 'السجل المالي', onClick: () => navigate('/admin/transactions') },
    { key: 'messages', label: 'رسائل التواصل', onClick: () => navigate('/admin/messages') },
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
    <DashboardLayout navItems={navItems} activeKey="users" headerCard={headerCard}>
      <AnimatedPage>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            المستخدمون
          </Typography>
          <TextField
            select
            size="small"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">كل الأدوار</MenuItem>
            <MenuItem value="buyer">مشروع صغير</MenuItem>
            <MenuItem value="supplier">مورد</MenuItem>
            <MenuItem value="admin">مدير</MenuItem>
          </TextField>
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['الاسم', 'البريد الإلكتروني', 'الهاتف', 'الدور', 'الحالة', ''].map((h) => (
                      <th
                        key={h}
                        style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontWeight: 700, fontSize: 14 }}>{user.name}</td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{user.email}</td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13, color: '#64748B' }}>{user.phone}</td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA', fontSize: 13 }}>{ROLE_LABEL[user.role]}</td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                        <Chip
                          label={user.isActive ? 'نشط' : 'معطّل'}
                          size="small"
                          sx={{
                            bgcolor: user.isActive ? '#E7F8F0' : '#FDECEC',
                            color: user.isActive ? '#047857' : '#DC2626',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 12px', borderBottom: '1px solid #F5F7FA' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color={user.isActive ? 'error' : 'primary'}
                          disabled={busyId === user._id || user.role === 'admin'}
                          onClick={() => handleToggle(user._id)}
                        >
                          {user.isActive ? 'تعطيل' : 'تفعيل'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Paper>
      </AnimatedPage>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </DashboardLayout>
  );
}

export default AdminUsers;