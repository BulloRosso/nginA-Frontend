// src/pages/Checkout.tsx
import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Security as SecurityIcon,
  CloudUpload as CloudUploadIcon,
  Style as StyleIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Checkout = () => {
  const { t } = useTranslation(['buy', 'common']);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  localStorage.removeItem('profileId')
  localStorage.removeItem('profiles')
  
  const features = [
    {
      icon: <MemoryIcon />,
      title: t('buy.feature_memory_title'),
      description: t('buy.feature_memory_desc')
    },
    {
      icon: <SecurityIcon />,
      title: t('buy.feature_security_title'),
      description: t('buy.feature_security_desc')
    },
    {
      icon: <StyleIcon />,
      title: t('buy.feature_books_title'),
      description: t('buy.feature_books_desc')
    },
    {
      icon: <CloudUploadIcon />,
      title: t('buy.feature_digital_title'),
      description: t('buy.feature_digital_desc')
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/api/v1/invitations/waitinglist', {
        email: email
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Error joining waitlist:', err);
      setError(t('buy.waitlist_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          textAlign: 'center',
          mb: 6,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 200,
            opacity: 0.6,
            backgroundImage: 'url(/noblivion-opener.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '50%',
            zIndex: -1
          }
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            textShadow: '1px 1px 0 #167c7f, -1px -1px 0 #167c7f, 1px -1px 0 #167c7f, -1px 1px 0 #167c7f, 1px 1px 0 #167c7f',
            color: 'gold'
          }}
        >
          {t('buy.waitlist_title')}
        </Typography>
        <Typography variant="h5" color="black" sx={{ mb: 4 }}>
          {t('buy.waitlist_subtitle')}
        </Typography>
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={4}>
        {/* Left side - Features */}
        <Grid item xs={12} md={7}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4,
              height: '100%',
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
            }}
          >
            <Typography variant="h4" gutterBottom color="primary">
              {t('buy.why_join_title')}
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 4 }}>
              {t('buy.why_join_description')}
            </Typography>

            <Grid container spacing={3}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      height: '100%',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" 
                       
                        gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Right side - Signup Form */}
        <Grid item xs={12} md={5}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4,
              background: theme.palette.background.paper,
              position: 'sticky',
              top: 24
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <TimerIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                {t('buy.limited_spots')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('buy.early_access')}
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                type="email"
                label={t('buy.email_label')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                variant="outlined"
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isSubmitting}
                sx={{
                  py: 2,
                  bgcolor: 'gold',
                  color: 'black',
                  '&:hover': {
                    bgcolor: '#e2bf02',
                    color: 'white'
                  }
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  t('buy.join_waitlist')
                )}
              </Button>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center" 
                sx={{ mt: 2 }}
              >
                {t('buy.notification_text')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success">
          {t('buy.waitlist_success')}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Checkout;