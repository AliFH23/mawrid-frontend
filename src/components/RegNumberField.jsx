import { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from '../api/axios.js';

const DEBOUNCE_MS = 600;
const MIN_CHARS_TO_CHECK = 3;

// Commercial-registration input that checks the number while the person types:
// available / yours / used by another account / banned. `onStatus` lets the page know
// (its submit still checks again on the server — this is feedback, not the lock).
function RegNumberField({ value, onChange, onStatus, placeholder = 'مثال: 123456', sx }) {
  const [status, setStatus] = useState(null); // { status, message }
  const [checking, setChecking] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = (value || '').trim();
    if (trimmed.length < MIN_CHARS_TO_CHECK) {
      setStatus(null);
      onStatus?.(null);
      return undefined;
    }

    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setChecking(true);
      try {
        const res = await api.get('/business/check', { params: { number: trimmed } });
        if (requestId !== requestIdRef.current) return; // a newer check superseded this one
        setStatus(res.data);
        onStatus?.(res.data.status);
      } catch {
        if (requestId === requestIdRef.current) {
          setStatus(null);
          onStatus?.(null); // can't tell — the server still enforces the rule on submit
        }
      } finally {
        if (requestId === requestIdRef.current) setChecking(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // onStatus is a state setter from the page; re-running on it would loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const ok = status?.status === 'AVAILABLE' || status?.status === 'MINE';
  const bad = status && !ok;

  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!!bad}
      color={ok ? 'success' : undefined}
      helperText={status?.message}
      inputProps={{ dir: 'ltr', style: { textAlign: 'left' } }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {checking ? (
              <CircularProgress size={18} />
            ) : ok ? (
              <CheckCircleOutlineIcon color="success" fontSize="small" />
            ) : bad ? (
              <ErrorOutlineIcon color="error" fontSize="small" />
            ) : null}
          </InputAdornment>
        ),
      }}
      sx={sx}
    />
  );
}

export default RegNumberField;