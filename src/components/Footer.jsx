import { Box, Typography, Container } from '@mui/material';

const CONTACT_EMAIL = 'contact@mawrid.com';

function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#0B1220', pt: 7, pb: 4 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 3,
            borderBottom: '1px solid #1E2942',
            pb: 4,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box component="img" src="/logo/mawrid-mark-white.png" alt="مَورِد" sx={{ height: 26 }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 4 }}>
            <Typography sx={{ color: '#8B95AB', fontSize: 14, cursor: 'pointer', '&:hover': { color: '#fff' } }}>
              من نحن
            </Typography>
            <Typography
              component="a"
              href={`mailto:${CONTACT_EMAIL}`}
              sx={{ color: '#8B95AB', fontSize: 14, cursor: 'pointer', textDecoration: 'none', '&:hover': { color: '#fff' } }}
            >
              تواصل معنا
            </Typography>
            <Typography sx={{ color: '#8B95AB', fontSize: 14, cursor: 'pointer', '&:hover': { color: '#fff' } }}>
              سياسة الخصوصية
            </Typography>
          </Box>
        </Box>

        <Typography sx={{ textAlign: 'center', color: '#5B6478', fontSize: 13 }}>
          © 2026 مَورِد. جميع الحقوق محفوظة.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;