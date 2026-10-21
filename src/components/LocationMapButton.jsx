import { useState, useRef } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MapPicker from './MapPicker.jsx';
import api from '../api/axios.js';

// "Pick on the map" button + dialog. When the person drops a pin, the nearest zone is
// looked up and — on confirm — handed to onPick(zone), where zone.governorateId is the
// populated governorate. Pages feed that straight into presetLocation().
function LocationMapButton({ onPick, label = 'حدد موقعي على الخريطة' }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(false);
  const requestIdRef = useRef(0);

  const resolve = async (point) => {
    setPin(point);
    setResult(null);
    setError('');
    setResolving(true);
    const requestId = ++requestIdRef.current;
    try {
      const res = await api.get('/delivery-zones/resolve', { params: point });
      if (requestId === requestIdRef.current) setResult(res.data);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err.response?.data?.message || 'تعذّر تحديد المنطقة');
      }
    } finally {
      if (requestId === requestIdRef.current) setResolving(false);
    }
  };

  const handleConfirm = () => {
    onPick(result.zone);
    setOpen(false);
  };

  return (
    <>
      <Button fullWidth variant="outlined" startIcon={<PlaceOutlinedIcon />} onClick={() => setOpen(true)} sx={{ mb: 2.5 }}>
        {label}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>حدد موقعك على الخريطة</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            اضغط على الخريطة وبنحدد المحافظة والمنطقة تلقائي. بتقدر تعدّلهم بعدين من القوائم.
          </Typography>

          <MapPicker value={pin} onChange={resolve} onLocateError={setError} />

          <Box sx={{ mt: 2, minHeight: 56 }}>
            {resolving && <CircularProgress size={22} />}
            {error && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            {result && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {result.zone.governorateId?.name} — {result.zone.name} (أقرب منطقة، حوالي {result.distanceKm} كم). إذا مش صحيحة، حرّك الدبوس أو عدّلها بعدين يدوي.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpen(false)} color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary" disabled={!result} onClick={handleConfirm}>
            تأكيد الموقع
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LocationMapButton;