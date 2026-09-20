import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  IconButton,
  Link,
  Chip,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../../api/axios.js';
import AnimatedPage from '../../components/AnimatedPage.jsx';
import { isPasswordStrong, PASSWORD_HINT } from '../../utils/passwordValidation.js';
import { useLocationPicker } from '../../hooks/useLocationPicker.js';

const MAX_CATEGORIES = 3;
const STEPS = ['بيانات الحساب', 'بيانات النشاط'];

function Register() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const [role, setRole] = useState('buyer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [shopName, setShopName] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // governorate/zone cascading logic now comes from the shared hook instead of
  // being duplicated in this file
  const { governorates, zones, zonesLoading, selectedGovernorate, selectedZone, setSelectedGovernorate, setSelectedZone } =
    useLocationPicker();

  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  const handleNext = () => {
    setError('');
    if (!name || !email || !phone || !password) {
      setError('الرجاء تعبئة كل الحقول');
      return;
    }
    if (!isPasswordStrong(password)) {
      setError(PASSWORD_HINT);
      return;
    }
    setActiveStep(1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'buyer' && (!shopName || !selectedZone || selectedCategories.length === 0)) {
      setError('الرجاء تعبئة بيانات المحل كاملة');
      return;
    }
    if (role === 'supplier' && !companyName) {
      setError('الرجاء إدخال اسم الشركة');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, phone, password, role });
      const { user, token } = res.data;
      localStorage.setItem('mawrid_token', token);
      localStorage.setItem('mawrid_user', JSON.stringify(user));

      if (role === 'buyer') {
        try {
          await api.post('/shops', {
            shopName,
            deliveryZone: selectedZone._id,
            categoryIds: selectedCategories.map((c) => c._id),
          });
          navigate('/shop');
        } catch {
          navigate('/shop/setup');
        }
      } else {
        try {
          await api.post('/suppliers', { companyName, companyDescription });
          navigate('/supplier');
        } catch {
          navigate('/supplier/setup');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'secondary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        py: 5,
      }}
    >
      <Paper component={AnimatedPage} sx={{ width: 460, p: 5, borderRadius: 5 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box component="img" src="/logo/mawrid-mark-ink.png" alt="مَورِد" sx={{ height: 44, width: 'auto' }} />
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            إنشاء حساب جديد
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            انضم لمنصة مَورِد خلال دقيقتين
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 3.5 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <AnimatedPage>
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, val) => val && setRole(val)}
              fullWidth
              sx={{
                mb: 3,
                bgcolor: '#F1F5F9',
                borderRadius: 2.5,
                p: 0.5,
                '& .MuiToggleButton-root': {
                  border: 0,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                },
              }}
            >
              <ToggleButton value="buyer">مشروع صغير</ToggleButton>
              <ToggleButton value="supplier">مورد</ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              الاسم الكامل
            </Typography>
            <TextField
              fullWidth
              placeholder="مثال: أحمد محمد"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              البريد الإلكتروني
            </Typography>
            <TextField
              fullWidth
              type="email"
              placeholder="example@mawrid.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              رقم الهاتف
            </Typography>
            <TextField
              fullWidth
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              كلمة المرور
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="8 أحرف، حرف كبير وصغير ورقم"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
              {PASSWORD_HINT}
            </Typography>

            <Button fullWidth variant="contained" color="primary" size="large" onClick={handleNext} endIcon={<ArrowForwardIcon />}>
              التالي
            </Button>
          </AnimatedPage>
        )}

        {activeStep === 1 && (
          <AnimatedPage>
            <Box component="form" onSubmit={handleSubmit}>
              {role === 'buyer' ? (
                <>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    اسم المحل
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="مثال: بقالة أبو محمد"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    sx={{ mb: 2.5 }}
                  />

                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    فئات نشاطك (حتى {MAX_CATEGORIES} فئات)
                  </Typography>
                  <Autocomplete
                    multiple
                    options={categories}
                    getOptionLabel={(option) => option.name}
                    value={selectedCategories}
                    onChange={(e, newValue) => {
                      if (newValue.length <= MAX_CATEGORIES) setSelectedCategories(newValue);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option.name} {...getTagProps({ index })} key={option._id} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} placeholder={selectedCategories.length ? '' : 'اختاري فئة أو أكتر'} />
                    )}
                    sx={{ mb: 2.5 }}
                  />

                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    المحافظة
                  </Typography>
                  <Autocomplete
                    options={governorates}
                    getOptionLabel={(option) => option.name}
                    value={selectedGovernorate}
                    onChange={(e, newValue) => setSelectedGovernorate(newValue)}
                    renderInput={(params) => <TextField {...params} placeholder="اختاري المحافظة" />}
                    sx={{ mb: 2.5 }}
                  />

                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    المنطقة داخل المحافظة
                  </Typography>
                  <Autocomplete
                    options={zones}
                    getOptionLabel={(option) => option.name}
                    value={selectedZone}
                    onChange={(e, newValue) => setSelectedZone(newValue)}
                    disabled={!selectedGovernorate}
                    loading={zonesLoading}
                    renderInput={(params) => (
                      <TextField {...params} placeholder={selectedGovernorate ? 'اختاري منطقتك' : 'اختاري المحافظة أولًا'} />
                    )}
                    sx={{ mb: 3 }}
                  />
                </>
              ) : (
                <>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    اسم الشركة
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="مثال: Ahmad Trading Co."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    sx={{ mb: 2.5 }}
                  />

                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    وصف الشركة (اختياري)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="مثلاً: موزّع مواد غذائية جملة، متخصصين بزيوت ومعلّبات"
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </>
              )}

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" color="secondary" size="large" onClick={handleBack} startIcon={<ArrowBackIcon />}>
                  رجوع
                </Button>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  endIcon={<PersonAddAltIcon />}
                >
                  {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </Button>
              </Box>
            </Box>
          </AnimatedPage>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          عندك حساب أصلًا؟{' '}
          <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            سجّل دخولك
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Register;