import { Chip } from '@mui/material';

export const RELIABILITY_LEVELS = {
  EXCELLENT: { label: 'ممتاز', bg: '#E7F8F0', color: '#047857' },
  GOOD: { label: 'جيد', bg: '#EFF6FF', color: '#1D4ED8' },
  FAIR: { label: 'متوسط', bg: '#FEF3E2', color: '#B45309' },
  POOR: { label: 'ضعيف', bg: '#FDECEC', color: '#DC2626' },
  NEW: { label: 'جديد', bg: '#F1F5F9', color: '#64748B' },
};

// compact badge: "ممتاز · 95%" or just "جديد" for shops without enough history
function ReliabilityBadge({ reliability }) {
  if (!reliability) return null;
  const style = RELIABILITY_LEVELS[reliability.level] || RELIABILITY_LEVELS.NEW;
  const label = reliability.score === null ? style.label : `${style.label} · ${reliability.score}%`;
  return (
    <Chip
      label={label}
      size="small"
      title={`${reliability.delivered} طلب مُستلَم، ${reliability.withdrawn} انسحاب`}
      sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: 11 }}
    />
  );
}

export default ReliabilityBadge;