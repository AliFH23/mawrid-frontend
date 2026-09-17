import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SHOPS = [12, 18, 25, 15, 30];
const TARGET = 100;

function PoolingDemo() {
  const [joined, setJoined] = useState([]);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let i = 0;
    let timeout;

    const step = () => {
      if (i < SHOPS.length) {
        setJoined((prev) => [...prev, SHOPS[i]]);
        i += 1;
        timeout = setTimeout(step, 900);
      } else {
        timeout = setTimeout(() => setConfirmed(true), 700);
        timeout = setTimeout(() => {
          setJoined([]);
          setConfirmed(false);
          i = 0;
          step();
        }, 3200);
      }
    };

    timeout = setTimeout(step, 600);
    return () => clearTimeout(timeout);
  }, [joined.length === 0]);

  const total = joined.reduce((a, b) => a + b, 0);
  const percentage = Math.min(100, (total / TARGET) * 100);

  return (
    <Box
      sx={{
        bgcolor: '#111A30',
        border: '1px solid #22304F',
        borderRadius: 4,
        p: 3.5,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2.5 }}>
        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>زيت زيتون — 5 لتر</Typography>
        <Typography sx={{ color: '#8B95AB', fontSize: 12 }}>الهدف: {TARGET} قطعة</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, minHeight: 34, flexWrap: 'wrap' }}>
        <AnimatePresence>
          {joined.map((qty, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.5, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Box
                sx={{
                  bgcolor: 'rgba(16,185,129,0.15)',
                  color: '#34D399',
                  borderRadius: 999,
                  px: 1.5,
                  py: 0.5,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                محل {idx + 1} · {qty}
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      <Box sx={{ height: 12, borderRadius: 999, bgcolor: '#22304F', overflow: 'hidden', mb: 1.5 }}>
        <motion.div
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            borderRadius: 999,
            background: confirmed ? '#10B981' : 'linear-gradient(90deg,#F59E0B,#10B981)',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ color: '#8B95AB', fontSize: 13 }}>
          {total} من <b style={{ color: '#fff' }}>{TARGET}</b> قطعة
        </Typography>

        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircleIcon sx={{ color: '#34D399', fontSize: 18 }} />
              <Typography sx={{ color: '#34D399', fontSize: 13, fontWeight: 800 }}>تم تأكيد الطلب</Typography>
            </motion.div>
          ) : (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Typography sx={{ color: '#FBBF24', fontSize: 13, fontWeight: 700 }}>قيد التجميع</Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

export default PoolingDemo;