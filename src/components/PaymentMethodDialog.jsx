import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';

// every option here except CASH is simulated (no real Zain Cash / Orange Money / CliQ
// merchant account exists yet) — going live later just means swapping the fake
// "processing" delay in handlePay for a real API call per method, the UI stays the same
const METHODS = [
  { key: 'CARD', label: 'بطاقة', icon: CreditCardIcon },
  { key: 'CASH', label: 'كاش عند الاستلام', icon: LocalAtmIcon },
  { key: 'ZAIN_CASH', label: 'Zain Cash', icon: PhoneIphoneIcon },
  { key: 'ORANGE_MONEY', label: 'Orange Money', icon: PhoneIphoneIcon },
  { key: 'CLIQ', label: 'كليك CliQ', icon: AccountBalanceIcon },
];

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function PaymentMethodDialog({ open, onClose, amount, description, onConfirm, allowCash = true }) {
  const [method, setMethod] = useState('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableMethods = allowCash ? METHODS : METHODS.filter((m) => m.key !== 'CASH');

  const reset = () => {
    setMethod('CARD');
    setCardNumber('');
    setCardName('');
    setPhone('');
    setOtp('');
    setError('');
    setProcessing(false);
    setSuccess(false);
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  const handleConfirmClick = async () => {
    setError('');

    if (method === 'CARD') {
      const digitsOnly = cardNumber.replace(/\s/g, '');
      if (digitsOnly.length !== 16 || !cardName) {
        setError('الرجاء تعبئة بيانات البطاقة بشكل صحيح');
        return;
      }
    } else if (method === 'ZAIN_CASH' || method === 'ORANGE_MONEY' || method === 'CLIQ') {
      if (phone.replace(/\D/g, '').length < 9 || otp.length !== 4) {
        setError('الرجاء إدخال رقم الهاتف ورمز التأكيد بشكل صحيح');
        return;
      }
    }
    // CASH needs no form validation — just confirming the choice

    if (method === 'CASH') {
      // no simulated "processing" for cash — nothing is actually charged right now
      await onConfirm(method);
      reset();
      return;
    }

    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setProcessing(false);
    setSuccess(true);

    await new Promise((r) => setTimeout(r, 900));
    await onConfirm(method);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>طريقة الدفع</DialogTitle>

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

              {/* method selector */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                {availableMethods.map((m) => {
                  const Icon = m.icon;
                  const selected = method === m.key;
                  return (
                    <Box
                      key={m.key}
                      onClick={() => !processing && setMethod(m.key)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: selected ? 'primary.main' : '#E2E8F0',
                        bgcolor: selected ? 'primary.light' : '#fff',
                        color: selected ? 'primary.dark' : 'text.secondary',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon sx={{ fontSize: 18 }} />
                      {m.label}
                    </Box>
                  );
                })}
              </Box>

              {/* method-specific form */}
              {method === 'CARD' && (
                <>
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
                    disabled={processing}
                    inputProps={{ dir: 'ltr', style: { textAlign: 'left' } }}
                  />
                </>
              )}

              {(method === 'ZAIN_CASH' || method === 'ORANGE_MONEY' || method === 'CLIQ') && (
                <>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    رقم الهاتف المسجّل بالمحفظة
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    sx={{ mb: 2 }}
                    disabled={processing}
                    inputProps={{ dir: 'ltr', style: { textAlign: 'left' } }}
                  />
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    رمز التأكيد (OTP)
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    disabled={processing}
                    inputProps={{ dir: 'ltr', style: { textAlign: 'left' } }}
                  />
                </>
              )}

              {method === 'CASH' && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  رح تدفعي هالمبلغ نقدًا مباشرة لما توصلك البضاعة — تأكيدك للاستلام لاحقًا هو نفسه تأكيد الدفع.
                </Alert>
              )}

              {method !== 'CASH' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                  <LockIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    بيئة دفع تجريبية — لا يتم خصم أي مبلغ حقيقي
                  </Typography>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {!success && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="secondary" disabled={processing}>
            إلغاء
          </Button>
          <Button variant="contained" color="primary" onClick={handleConfirmClick} disabled={processing}>
            {processing ? 'جاري معالجة الدفع...' : method === 'CASH' ? 'تأكيد الاختيار' : `ادفع ${amount?.toFixed(2)} د.أ`}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default PaymentMethodDialog;