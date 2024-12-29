// src/pages/PrintSettings.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PrintService, PrintSettings as IPrintSettings } from '../services/print';
import { useNavigate } from 'react-router-dom';

const PrintSettings: React.FC = () => {
  const [settings, setSettings] = useState<IPrintSettings>({
    template: 'professional',
    sortOrder: 'category',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['print', 'common']);
  const profileId = localStorage.getItem('profileId');
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/profile-selection');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async () => {
    if (!profileId) {
      setError('No profile selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await PrintService.submitPrintJob(profileId, settings);
      setSuccess(true);
    } catch (err) {
      console.error('Print request error:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to submit print request');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/profile-selection');
  };

  if (success) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="success">
          {t('print.request_received')}
        </Alert>
      </Container>
    );
  }

  // Calculate legal paper aspect ratio (8.5 x 14 inches)
  const previewWidth = 400; // pixels
  const legalAspectRatio = 14 / 8.5;
  const previewHeight = previewWidth * legalAspectRatio;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{  p: 3 }}>
          <Typography variant="h5" sx={{ mb: 4, }} >
            {t('print.settings')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3 
          }}>
            <FormControl fullWidth>
              <InputLabel>{t('print.template')}</InputLabel>
              <Select
                value={settings.template}
                label={t('print.template')}
                onChange={(e) => setSettings({ ...settings, template: e.target.value as IPrintSettings['template'] })}
              >
                <MenuItem value="professional">{t('print.professional')}</MenuItem>
                <MenuItem value="warm">{t('print.warm')}</MenuItem>
                <MenuItem value="romantic">{t('print.romantic')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('print.sort_order')}</InputLabel>
              <Select
                value={settings.sortOrder}
                label={t('print.sort_order')}
                onChange={(e) => setSettings({ ...settings, sortOrder: e.target.value as IPrintSettings['sortOrder'] })}
              >
                <MenuItem value="category">{t('print.by_category')}</MenuItem>
                <MenuItem value="timestamp">{t('print.by_timestamp')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {settings.template && (
            <Box sx={{ 
              mb: 3, 
              border: 1, 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              p: 2
            }}>
              <iframe
                src={`/print-templates/${settings.template}.html`}
                style={{ 
                  width: `${previewWidth}px`, 
                  height: `${previewHeight}px`, 
                  border: 'none',
                  backgroundColor: 'white',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                }}
                title="Template Preview"
              />
            </Box>
          )}

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Button
              onClick={handleBack}
              sx={{ 
                border: 'none',
                '&:hover': {
                  border: 'none',
                  backgroundColor: 'transparent'
                }
              }}
            >
              {t('print.back_to_profiles')}
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ 
                backgroundColor: 'gold',
                '&:hover': {
                  backgroundColor: '#e2bf02'
                }
              }}
            >
              {t('print.generate')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PrintSettings;