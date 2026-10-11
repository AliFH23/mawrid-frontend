import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import api from '../api/axios.js';

const formatMoney = (n) => Number(n || 0).toFixed(2);

// "you saved X JD" — pool price vs the regular market price the supplier entered.
// The share button opens WhatsApp with a ready message, so every happy shop is an ad.
function MySavingsCard() {
  const [savings, setSavings] = useState(null);

  useEffect(() => {
    api
      .get('/participations/me/savings')
      .then((res) => setSavings(res.data.savings))
      .catch(() => {});
  }, []);

  if (!savings) return null;

  const hasRealized = savings.realized > 0;
  const hasPending = savings.pending > 0;
  // nothing to show until at least one pool with a market price has been joined
  if (!hasRealized && !hasPending) return null;

  const handleShare = () => {
    const text =
      `وفّرت ${formatMoney(savings.realized)} د.أ على مشترياتي بالشراء الجماعي عن طريق مَورِد 🛒\n` +
      `منصة بتجمّع طلبات المحلات الصغيرة عشان نشتري بسعر الجملة.\n` +
      `انضم إلنا: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        mb: 3,
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap',
        bgcolor: '#F0FDF7',
        border: '1px solid #CDEFE0',
      }}
      elevation={0}
    >
      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SavingsOutlinedIcon sx={{ color: '#047857' }} />
      </Box>
      <Box sx={{ flex: '1 1 240px' }}>
        <Typography variant="caption" color="text.secondary">
          إجمالي ما وفّرته مع مَورِد
        </Typography>
        <Typography fontWeight={800} fontSize={24} sx={{ color: '#047857', lineHeight: 1.2 }}>
          {formatMoney(savings.realized)} د.أ
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {hasRealized ? `من ${savings.realizedPools} سلة مؤكّدة` : 'لسا ما تأكّدت أي سلة من سلاتك'}
          {hasPending ? ` · متوقّع ${formatMoney(savings.pending)} د.أ إضافية لما تكتمل سلاتك المفتوحة` : ''}
        </Typography>
      </Box>
      {hasRealized && (
        <Button variant="contained" startIcon={<WhatsAppIcon />} onClick={handleShare} sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1EBE5A' } }}>
          شارك على واتساب
        </Button>
      )}
    </Paper>
  );
}

export default MySavingsCard;