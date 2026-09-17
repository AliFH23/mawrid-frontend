import { useState } from 'react';
import { useNavigate , Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Link,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import api from '../api/axios.js';
import { postAuthRedirect } from '../utils/postAuthRedirect.js';
import AnimatedPage from '../components/AnimatedPage.jsx';

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState('buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      localStorage.setItem('mawrid_token', token);
      localStorage.setItem('mawrid_user', JSON.stringify(user));

      await postAuthRedirect(user, navigate);
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
        bgcolor: 'secondary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper component={AnimatedPage} sx={{ width: 460, p: 5, borderRadius: 5 }} elevation={0}>        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/logo/mawrid-mark-ink.png"
            alt="مَورِد"
            sx={{ height: 52, width: 'auto' }}
          />
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            تسجيل الدخول
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ادخل بياناتك للوصول إلى حسابك
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={role}
          exclusive
          onChange={(e, val) => val && setRole(val)}
          fullWidth
          sx={{
            mb: 3,
            bgcolor: '#F1F5F9',
            borderRadius: 2.5,
            p: 0.5,
            '& .MuiToggleButton-root': {
              border: 0,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
              },
            },
          }}
        >
          <ToggleButton value="buyer">مشروع صغير</ToggleButton>
          <ToggleButton value="supplier">مورد</ToggleButton>
          
        </ToggleButtonGroup>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight={700}>
              كلمة المرور
            </Typography>
            <Link component={RouterLink} to="/forgot-password" underline="hover" sx={{ fontSize: 13, fontWeight: 700, color: 'primary.dark' }}>
              نسيت كلمة المرور؟
            </Link>
          </Box>
          <TextField
            fullWidth
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            endIcon={<LoginIcon />}
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          ما عندك حساب؟{' '}
          <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            أنشئ حساب جديد
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Login;