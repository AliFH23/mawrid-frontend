import { Card, Box, Typography, Chip, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import UpdateIcon from '@mui/icons-material/Update';

const STATUS_STYLES = {
  OPEN: { label: 'مفتوحة', bg: '#E7F8F0', color: '#047857' },
  PENDING_SUPPLIER_CONFIRMATION: { label: 'بانتظار التأكيد', bg: '#FEF3E2', color: '#B45309' },
  COMPLETED: { label: 'مؤكّدة', bg: '#0B1220', color: '#fff' },
  EXPIRED: { label: 'منتهية', bg: '#F1F5F9', color: '#64748B' },
  CANCELLED: { label: 'ملغاة', bg: '#FDECEC', color: '#DC2626' },
};

function PoolCard({ pool, action }) {
  const status = STATUS_STYLES[pool.status] || STATUS_STYLES.OPEN;
  const percentage = Math.min(100, Math.round((pool.currentQuantity / pool.minQuantity) * 100));

  const categoryLabel = Array.isArray(pool.categoryIds)
    ? pool.categoryIds.map((c) => c.name).join('، ')
    : pool.categoryIds?.name || '';

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card sx={{ p: 2.5, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography fontWeight={800} fontSize={15}>
              {pool.productName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {categoryLabel} {pool.deliveryZone?.name ? `· ${pool.deliveryZone.name}` : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
            <Chip
              label={status.label}
              size="small"
              sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: 11 }}
            />
            {pool.extended && (
              <Chip
                icon={<UpdateIcon sx={{ fontSize: 13 }} />}
                label="تم التمديد"
                size="small"
                sx={{ bgcolor: '#FEF3E2', color: '#B45309', fontWeight: 700, fontSize: 10, height: 20 }}
              />
            )}
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 999,
            mb: 1,
            bgcolor: '#EEF2F6',
            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 999 },
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {pool.currentQuantity} من <b>{pool.minQuantity}</b>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(pool.expiryDate).toLocaleDateString('ar-EG')}
          </Typography>
        </Box>

        {/* footer stacked vertically: price row on top, actions get their own
            full-width row below so they can wrap cleanly no matter how many
            buttons a given pool status needs */}
        <Box sx={{ pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
          <Typography fontWeight={800} color="primary.dark" fontSize={14} sx={{ mb: action ? 1 : 0 }}>
            {pool.unitPrice} د.أ / قطعة
          </Typography>
          {action && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {action}
            </Box>
          )}
        </Box>
      </Card>
    </motion.div>
  );
}

export default PoolCard;