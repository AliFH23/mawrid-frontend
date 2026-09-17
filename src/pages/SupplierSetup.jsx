import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import api from '../api/axios.js';
import AnimatedPage from '../components/AnimatedPage.jsx';

function SupplierSetup() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName) {
      setError('الرجاء إدخال اسم الشركة');
      return;
    }

    setLoading(true);
    try {
      await api.post('/suppliers', { companyName });
      navigate('/supplier');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات الشركة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper component={AnimatedPage} sx={{ width: 460, p: 5, borderRadius: 5 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BusinessIcon sx={{ color: 'primary.dark', fontSize: 28 }} />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            أكمل بيانات شركتك
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            خطوة أخيرة قبل ما تقدر تفتح سلات شراء
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            اسم الشركة
          </Typography>
          <TextField
            fullWidth
            placeholder="مثال: Ahmad Trading Co."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button fullWidth type="submit" variant="contained" color="primary" size="large" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ والمتابعة'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default SupplierSetup;