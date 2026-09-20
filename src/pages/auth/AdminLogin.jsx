import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../../api/axios.js';

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data;

      if (user.role !== 'admin') {
        setError('هذا الدخول مخصص لحسابات الإدارة فقط');
        setLoading(false);
        return;
      }

      localStorage.setItem('mawrid_token', token);
      localStorage.setItem('mawrid_user', JSON.stringify(user));
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#05070D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper sx={{ width: 420, p: 5, borderRadius: 5, bgcolor: '#111A30' }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            component="img"
            src="/logo/mawrid-mark-white.png"
            alt="مَورِد"
            sx={{ height: 48, width: 'auto' }}
          />
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
            دخول لوحة الإدارة
          </Typography>
          <Typography variant="body2" sx={{ color: '#8B95AB', mt: 1 }}>
            هذا القسم مخصص لمديري المنصة فقط
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="email"
            placeholder="admin@mawrid.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              mb: 2.5,
              bgcolor: '#0B1220',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': { color: '#fff' },
            }}
          />
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              mb: 3,
              bgcolor: '#0B1220',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': { color: '#fff' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" sx={{ color: '#8B95AB' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                    {showPassword ? (
                      <VisibilityOff fontSize="small" sx={{ color: '#8B95AB' }} />
                    ) : (
                      <Visibility fontSize="small" sx={{ color: '#8B95AB' }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ bgcolor: '#10B981', color: '#04231A', '&:hover': { bgcolor: '#047857' } }}
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default AdminLogin;