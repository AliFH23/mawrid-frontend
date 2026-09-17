import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, TextField, Button, Alert, MenuItem } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';

function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => String(CURRENT_YEAR + i).slice(-2));

function MockPaymentDialog({ open, onClose, amount, description, onConfirm }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setCardNumber('');
    setCardName('');
    setExpMonth('');
    setExpYear('');
    setCvv('');
    setError('');
    setProcessing(false);
    setSuccess(false);
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  const handlePay = async () => {
    setError('');
    const digitsOnly = cardNumber.replace(/\s/g, '');
    if (digitsOnly.length !== 16 || !cardName || !expMonth || !expYear || cvv.length !== 3) {
      setError('الرجاء تعبئة بيانات البطاقة بشكل صحيح');
      return;
    }

    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setProcessing(false);
    setSuccess(true);

    await new Promise((r) => setTimeout(r, 900));
    await onConfirm();
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CreditCardIcon color="primary" />
        دفع رسم الالتزام
      </DialogTitle>

      <DialogContent>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '32px 0' }}
            >
              <CheckCircleIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1.5 }} />
              <Typography fontWeight={800} fontSize={16}>
                تم الدفع بنجاح
              </Typography>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2, mb: 2.5, mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {description}
                </Typography>
                <Typography fontWeight={800} fontSize={22} color="primary.dark">
                  {amount?.toFixed(2)} د.أ
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                رقم البطاقة
              </Typography>
              <TextField
                fullWidth
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                sx={{ mb: 2 }}
                disabled={processing}
                inputProps={{ dir: 'ltr', style: { textAlign: 'left', letterSpacing: 1 } }}
              />

              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                اسم حامل البطاقة
              </Typography>
              <TextField
                fullWidth
                placeholder="مثال: Ahmad Ali"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                sx={{ mb: 2 }}
                disabled={processing}
                inputProps={{ dir: 'ltr', style: { textAlign: 'left' } }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1.4 }}>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    تاريخ الانتهاء
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      select
                      fullWidth
                      label="الشهر"
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      disabled={processing}
                    >
                      {MONTHS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      fullWidth
                      label="السنة"
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      disabled={processing}
                    >
                      {YEARS.map((y) => (
                        <MenuItem key={y} value={y}>
                          {y}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    CVV
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    disabled={processing}
                    inputProps={{ dir: 'ltr', style: { textAlign: 'left' } }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                <LockIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  بيئة دفع تجريبية — لا يتم خصم أي مبلغ حقيقي
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {!success && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="secondary" disabled={processing}>
            إلغاء
          </Button>
          <Button variant="contained" color="primary" onClick={handlePay} disabled={processing}>
            {processing ? 'جاري معالجة الدفع...' : `ادفع ${amount?.toFixed(2)} د.أ`}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default MockPaymentDialog;