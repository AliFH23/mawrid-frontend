import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Drawer, Typography, List, ListItemButton, ListItemText, IconButton, AppBar, Toolbar } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { logout } from '../utils/logout.js';

const drawerWidth = 260;

function DashboardLayout({ navItems, activeKey, headerCard, children }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerContent = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 3 }}>
        <Box component="img" src="/logo/mawrid-mark-white.png" alt="مَورِد" sx={{ height: 30 }} />
        <Typography sx={{ color: '#fff', fontFamily: "'Cairo', sans-serif", fontWeight: 800 }}>
          مَورِد
        </Typography>
      </Box>

      {headerCard}

      <List sx={{ mt: 1, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={item.key === activeKey}
            onClick={() => {
              item.onClick();
              setMobileOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: '#B8C0D4',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
              },
              '&:hover': { bgcolor: '#111A30' },
            }}
          >
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
          </ListItemButton>
        ))}
      </List>

      <ListItemButton
        onClick={() => logout(navigate)}
        sx={{
          borderRadius: 2,
          color: '#F87171',
          borderTop: '1px solid #1E2942',
          pt: 1.5,
          mt: 40,
          '&:hover': { bgcolor: 'rgba(206, 67, 67, 0.08)' },
        }}
      >
        <LogoutIcon fontSize="small" sx={{ ml: 1.5 }} />
        <ListItemText primary="تسجيل خروج" primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
      </ListItemButton>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'flex', md: 'none' },
          bgcolor: 'secondary.main',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box component="img" src="/logo/mawrid-mark-white.png" alt="مَورِد" sx={{ height: 26 }} />
          <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#fff' }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            bgcolor: 'secondary.main',
            border: 'none',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            bgcolor: 'secondary.main',
            border: 'none',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, mt: { xs: 7, md: 0 } }}>
        {children}
      </Box>
    </Box>
  );
}

export default DashboardLayout;