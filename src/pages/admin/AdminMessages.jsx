import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, CircularProgress, Alert, Button } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import api from '../../api/axios.js';

function AdminMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contact-messages');
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load contact messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/contact-messages/${id}/mark-read`);
      loadMessages();
    } catch (err) {
      console.error('Failed to mark message as read:', err);
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

  return (
    <DashboardLayout navItems={navItems} activeKey="messages" headerCard={headerCard}>
      <AnimatedPage>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
          رسائل التواصل
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : messages.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ما في رسائل تواصل لهلق
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map((msg) => (
              <Paper key={msg._id} sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                  <Box>
                    <Typography fontWeight={800} fontSize={15}>
                      {msg.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {msg.email} · {new Date(msg.createdAt).toLocaleString('ar-EG')}
                    </Typography>
                  </Box>
                  <Chip
                    label={msg.isRead ? 'تمت القراءة' : 'جديدة'}
                    size="small"
                    sx={{
                      bgcolor: msg.isRead ? '#F1F5F9' : '#EFF6FF',
                      color: msg.isRead ? '#64748B' : '#1D4ED8',
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 14, color: '#334155', mb: msg.isRead ? 0 : 1.5 }}>{msg.message}</Typography>
                {!msg.isRead && (
                  <Button size="small" variant="text" onClick={() => handleMarkRead(msg._id)}>
                    تمييز كمقروءة
                  </Button>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}

export default AdminMessages;