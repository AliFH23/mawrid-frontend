import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, Container, IconButton, Drawer, List, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'كيف تعمل المنصة', sectionId: 'how-it-works' },
  { label: 'للموردين', sectionId: 'why-mawrid' },
  { label: 'للمشاريع الصغيرة', sectionId: 'live-preview' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setMobileOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  return (
    <Box
      component={motion.nav}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        bgcolor: scrolled ? 'rgba(11,18,32,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1.2, textDecoration: 'none' }}
          >
            <Box component="img" src="/logo/mawrid-mark-white.png" alt="مَورِد" sx={{ height: 30 }} />
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
            {NAV_LINKS.map(({ label, sectionId }) => (
              <Box
                key={label}
                onClick={() => scrollToSection(sectionId)}
                sx={{ color: '#B8C0D4', fontSize: 14, fontWeight: 600, cursor: 'pointer', '&:hover': { color: '#fff' } }}
              >
                {label}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1.5 }}>
            <Button variant="text" sx={{ color: '#fff' }} onClick={() => navigate('/login')}>
              تسجيل الدخول
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/register')}>
              ابدأ الآن
            </Button>
          </Box>

          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'flex', sm: 'none' }, color: '#fff' }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Container>

      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 260, bgcolor: '#0B1220', height: '100%', p: 2.5 }}>
          <List>
            {NAV_LINKS.map(({ label, sectionId }) => (
              <ListItemButton key={label} onClick={() => scrollToSection(sectionId)}>
                <ListItemText primary={label} primaryTypographyProps={{ color: '#B8C0D4', fontWeight: 600 }} />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 3, px: 2 }}>
            <Button variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }} onClick={() => navigate('/login')}>
              تسجيل الدخول
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/register')}>
              ابدأ الآن
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

export default Navbar;