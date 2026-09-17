import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../api/axios.js';
import AnimatedPage from '../components/AnimatedPage.jsx';
import { isPasswordStrong, PASSWORD_HINT } from '../utils/passwordValidation.js';

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !phone || !newPassword) {
      setError('الرجاء تعبئة كل الحقول');
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      setError(PASSWORD_HINT);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, phone, newPassword });
      setSuccess('تم تحديث كلمة المرور بنجاح! رح ننقلك لصفحة الدخول...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'secondary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper component={AnimatedPage} sx={{ width: 440, p: 5, borderRadius: 5 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box component="img" src="/logo/mawrid-mark-ink.png" alt="مَورِد" sx={{ height: 48, width: 'auto' }} />
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            استعادة كلمة المرور
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            أدخلي بريدك ورقم هاتفك المسجّلين، وحددي كلمة مرور جديدة
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            البريد الإلكتروني
          </Typography>
          <TextField
            fullWidth
            type="email"
            placeholder="example@mawrid.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            رقم الهاتف المسجّل بالحساب
          </Typography>
          <TextField
            fullWidth
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={{ mb: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            كلمة المرور الجديدة
          </Typography>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            placeholder="8 أحرف، حرف كبير وصغير ورقم"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
            {PASSWORD_HINT}
          </Typography>

          <Button fullWidth type="submit" variant="contained" color="primary" size="large" disabled={loading}>
            {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          تذكّرتِ كلمة المرور؟{' '}
          <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            سجّلي دخولك
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default ForgotPassword;