import { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/axios.js';

function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !message) {
      setError('الرجاء تعبئة كل الحقول');
      return;
    }

    setLoading(true);
    try {
      await api.post('/contact-messages', { name, email, message });
      setSuccess('تم إرسال رسالتك بنجاح، رح نتواصل معك قريبًا');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إرسال الرسالة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ bgcolor: '#0B1220' }}>
        <Navbar />
      </Box>

      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Typography component="h1" sx={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800, fontSize: { xs: 28, md: 34 }, mb: 1.5, textAlign: 'center' }}>
            تواصل معنا
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 16, textAlign: 'center', mb: 5 }}>
            عندك سؤال أو اقتراح؟ ابعتيلنا وبنرجعلك بأسرع وقت
          </Typography>

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
              الاسم
            </Typography>
            <TextField fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2.5 }} />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              البريد الإلكتروني
            </Typography>
            <TextField fullWidth type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2.5 }} />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              رسالتك
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button fullWidth type="submit" variant="contained" color="primary" size="large" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </Button>
          </Box>
        </motion.div>
      </Container>

      <Footer />
    </Box>
  );
}

export default ContactUs;