import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  direction: 'rtl',

  palette: {
    mode: 'light',
    primary: { main: '#10B981', dark: '#047857', light: '#E7F8F0', contrastText: '#04231A' },
    secondary: { main: '#0B1220', contrastText: '#ffffff' },
    warning: { main: '#F59E0B', light: '#FEF3E2', dark: '#B45309' },
    error: { main: '#DC2626', light: '#FDECEC' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0B1220', secondary: '#64748B' },
  },

  typography: {
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif",
    h1: { fontFamily: "'Cairo', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Cairo', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Cairo', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Cairo', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Cairo', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Cairo', sans-serif", fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },

  shape: { borderRadius: 12 },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 20,
          paddingBlock: 10,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px -6px rgba(16,185,129,0.45)' },
          '&:active': { transform: 'translateY(0)' },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E7ECF3',
          boxShadow: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 24px -10px rgba(11,18,32,0.12)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { transition: 'box-shadow 0.15s ease, border-color 0.15s ease' } },
      },
    },
  },
});

export default theme;