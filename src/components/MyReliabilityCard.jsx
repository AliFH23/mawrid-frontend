import { useState, useEffect } from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import ReliabilityBadge, { RELIABILITY_LEVELS } from './ReliabilityBadge.jsx';
import api from '../api/axios.js';

// the shop's own reliability, shown on its dashboard. Suppliers see the same score next
// to each participating shop, so this tells the shop why it matters.
function MyReliabilityCard() {
  const [reliability, setReliability] = useState(null);

  useEffect(() => {
    api
      .get('/participations/me/reliability')
      .then((res) => setReliability(res.data.reliability))
      .catch(() => {});
  }, []);

  if (!reliability) return null;

  const style = RELIABILITY_LEVELS[reliability.level] || RELIABILITY_LEVELS.NEW;
  const isNew = reliability.score === null;

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }} elevation={0}>
      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <VerifiedOutlinedIcon sx={{ color: style.color }} />
      </Box>
      <Box sx={{ flex: '1 1 260px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography fontWeight={800}>موثوقيتك عند الموردين</Typography>
          <ReliabilityBadge reliability={reliability} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {isNew
            ? 'بتظهر نسبتك بعد 3 طلبات منتهية (استلام أو انسحاب). الموردين بشوفوها جنب اسم محلك.'
            : `${reliability.delivered} طلب مُستلَم و${reliability.withdrawn} انسحاب. كل انسحاب بيخفّض نسبتك ويضيّع رسم الالتزام.`}
        </Typography>
        {!isNew && (
          <LinearProgress
            variant="determinate"
            value={reliability.score}
            sx={{ mt: 1, height: 6, borderRadius: 999, bgcolor: '#EEF2F6', '& .MuiLinearProgress-bar': { bgcolor: style.color, borderRadius: 999 } }}
          />
        )}
      </Box>
    </Paper>
  );
}

export default MyReliabilityCard;