// src/pages/Checkout.tsx
import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Check as CheckIcon,
         PanToolOutlinedIcon as ImportantIcon,
         AnnouncementOutlined as WarningIcon,
       } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Checkout = () => {
  const { t } = useTranslation(['buy', 'common']);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
        navigate('/profile-selection');
      }, 3000);
    } catch (err) {
      console.error('Error joining waitlist:', err);
      setError(t('buy.waitlist_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          {t('buy.checkout_title')}
        </Typography>

        <Box sx={{ my: 4 }}>
          <List>
            {['terms1', 'terms2', 'terms3', 'terms4', 'terms5'].map((term) => (
              <ListItem key={term}>
                <ListItemIcon>
                  <WarningIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={t(`buy.${term}`)} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            {t('buy.waitlist_title')}
          </Typography>

          <TextField
            fullWidth
            type="email"
            label={t('buy.email_label')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{
              backgroundColor: 'gold',
              color: 'black',
              '&:hover': {
                backgroundColor: '#e2bf02',
                color: 'white'
              }
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              t('buy.waitlist_button')
            )}
          </Button>
        </Box>

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
      </Paper>
    </Container>
  );
};

export default Checkout;