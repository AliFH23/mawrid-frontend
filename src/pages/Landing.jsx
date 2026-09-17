import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import PoolingDemo from '../components/PoolingDemo.jsx';
import PoolCard from '../components/PoolCard.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SAMPLE_POOL = {
  _id: 'sample',
  productName: 'أرز بسمتي — كيس 5 كغ',
  categoryId: { name: 'بقالة' },
  deliveryZone: { name: 'إربد - الحي الشرقي' },
  status: 'OPEN',
  currentQuantity: 34,
  minQuantity: 50,
  unitPrice: 10,
  expiryDate: '2026-12-31',
};

function Landing() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: '#0B1220' }}>
        <Navbar />

        <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                <Typography
                  component="h1"
                  sx={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800, fontSize: { xs: 34, md: 46 }, color: '#fff', lineHeight: 1.35, mb: 2.5 }}
                >
                  محلك الصغير يشتري بسعر الجملة، من اليوم الأول
                </Typography>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
                <Typography sx={{ color: '#94A3B8', fontSize: 17, lineHeight: 2, mb: 4, maxWidth: 460 }}>
                  مَورِد تجمع طلبك مع محلات تانية بنفس منطقتك ضمن سلة واحدة، لحد ما توصلوا سوا لسعر الجملة —
                  بدون ما تحتاج رأس مال كبير أو مخزون زيادة.
                </Typography>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button variant="contained" color="primary" size="large" onClick={() => navigate('/register')}>
                    سجّل محلك الآن
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
                    onClick={() => navigate('/login')}
                  >
                    عندي حساب أصلًا
                  </Button>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <PoolingDemo />
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} md={5}>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Typography component="h2" sx={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800, fontSize: { xs: 26, md: 32 }, mb: 2 }}>
                المشكلة يلي كل محل صغير بيعرفها
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 16, lineHeight: 2 }}>
                الموردين بيشترطوا كميات كبيرة عشان يعطوا سعر الجملة. محلك ما بيحتاج كل هالكمية،
                فبتضطر تشتري بسعر أعلى من وسيط — وهامش ربحك بيقل.
              </Typography>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={7}>
            <Grid container spacing={2.5}>
              {[
                { title: 'بدون مَورِد', rows: ['شراء منفرد بكميات صغيرة', 'سعر أعلى من التجزئة', 'تنسيق يدوي وعشوائي'], tone: 'bad' },
                { title: 'مع مَورِد', rows: ['سلة مُجدولة مع مورد شريك', 'سعر الجملة الحقيقي', 'عملية رقمية مؤتمتة بالكامل'], tone: 'good' },
              ].map((col, i) => (
                <Grid item xs={12} sm={6} key={col.title}>
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: col.tone === 'good' ? 'primary.main' : '#FCA5A5',
                        bgcolor: col.tone === 'good' ? 'primary.light' : '#FDECEC',
                        borderRadius: 3,
                        p: 3,
                        height: '100%',
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, fontSize: 15, color: col.tone === 'good' ? 'primary.dark' : '#B91C1C', mb: 2 }}>
                        {col.title}
                      </Typography>
                      {col.rows.map((r) => (
                        <Typography key={r} sx={{ fontSize: 14, color: '#334155', mb: 1, lineHeight: 1.8 }}>
                          {r}
                        </Typography>
                      ))}
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ bgcolor: '#F1F5F9', py: { xs: 8, md: 11 } }}>
        <Container maxWidth="lg">
          <Typography component="h2" sx={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800, fontSize: { xs: 26, md: 32 }, mb: 6, textAlign: 'center' }}>
            من التسجيل لاستلام بضاعتك — أربع خطوات
          </Typography>

          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: 22,
                left: { xs: '10%', md: '12.5%' },
                right: { xs: '10%', md: '12.5%' },
                height: 2,
                bgcolor: '#CBD5E1',
                display: { xs: 'none', sm: 'block' },
              }}
            />
            <Grid container spacing={4}>
              {[
                ['سجّل محلك', 'حدد فئة نشاطك ومنطقة التوصيل بدقيقتين'],
                ['انضم لسلة', 'اختر سلة مناسبة وحدد الكمية يلي تحتاجها'],
                ['تابع التقدم', 'راقب نسبة الاكتمال لحظيًا حتى الحد الأدنى'],
                ['استلم بضاعتك', 'بعد تأكيد المورد، استلم طلبك بسعر الجملة'],
              ].map(([title, desc], i) => (
                <Grid item xs={6} md={3} key={title}>
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                    <Box sx={{ textAlign: 'center', position: 'relative' }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          bgcolor: 'secondary.main',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          mx: 'auto',
                          mb: 2,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {i + 1}
                      </Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1 }}>{title}</Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.7 }}>{desc}</Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Typography component="h2" sx={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800, fontSize: { xs: 26, md: 32 }, mb: 2 }}>
                هيك بالضبط بتشوف سلتك
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 16, lineHeight: 2, mb: 3 }}>
                نفس البطاقة يلي بتشوفها بلوحة تحكمك — سعر، نسبة اكتمال، ووقت متبقي، كل شي واضح وقت اللحظة.
              </Typography>
              <Button variant="contained" color="primary" size="large" onClick={() => navigate('/register')}>
                جرّب محلك الآن
              </Button>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6}>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ maxWidth: 340, marginInline: 'auto' }}>
              <PoolCard pool={SAMPLE_POOL} action={<Button size="small" variant="contained" color="primary">انضم للسلة</Button>} />
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'primary.main', py: { xs: 7, md: 9 } }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Typography component="h2" sx={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800, fontSize: { xs: 24, md: 30 }, color: 'primary.contrastText', mb: 1.5 }}>
              جاهز تبدأ توفّر؟
            </Typography>
            <Typography sx={{ color: 'primary.contrastText', opacity: 0.8, mb: 3.5, fontSize: 16 }}>
              انضم اليوم، وابدأ أول سلة معنا خلال دقائق
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'secondary.main', color: '#fff', '&:hover': { bgcolor: '#111A30' } }}
              onClick={() => navigate('/register')}
            >
              سجّل الآن
            </Button>
          </motion.div>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}

export default Landing;