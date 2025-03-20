// src/components/LandingPage.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Container, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['landing', 'common']);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleGotoBusiness = () => {
    navigate('/business');
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          maxHeight: '100vh',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          backgroundColor: '#f8f9fa',
          backgroundImage: 'url(/img/landingpage/supercharged.jpg)',
          backgroundSize: '100vw',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              justifyItems: 'start',
              textAlign: 'start',
              py: 6
            }}
          >
            <img src="/ngina-logo.jpg" alt="ngina Logo" width="300" />

            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 6,
                color: '#fff',
                textShadow: '2px 2px 2px #6B6B6B',
                maxWidth: '800px'
              }}
            >
              {t('landing.description')}
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleGetStarted}
              sx={{
                fontWeight: 'bold',
                backgroundColor: 'gold',
                '&:hover': {
                  backgroundColor: '#179699'
                },
                py: 2,
                px: 6,
                mt: '200px',
                borderRadius: 2
              }}
            >
              {t('landing.try_now')}
            </Button>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 6, backgroundColor: '#f6f5ef' }}>
        <Container maxWidth="lg">
          <Typography variant="h6" textAlign="center" mb={2}>
            {t('landing.ds')}
          </Typography>
        </Container>
      </Box>

      {/* Backstroy Section */}
      <Box sx={{ py: 8, backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{ 
            color: '#1eb3b7',
            fontSize: '22px',
            fontWeight: 'bold',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory.quote')}
          </Typography>  
          <Typography sx={{ 
            color: '#777',
            fontSize: '18px',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory.paragraph1')}
          </Typography>  
          <Typography sx={{ 
            color: '#777',
            fontSize: '18px',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory.paragraph2')}
          </Typography>  
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 12, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" mb={8}>
            {t('landing.how_it_works')}
          </Typography>
          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr 1fr'
              },
              gap: 4
            }}
          >
            <Box sx={{ justifyItems: 'center', textAlign: 'center', p: 3 }}>
             
              <img src="/noblivion-icon-1.png" style={{ width: '160px'}}></img>
               <br></br>
              <Typography variant="h5" mb={2}>1. {t('landing.features.create_profile.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features.create_profile.description')}
              </Typography>
            </Box>
            <Box sx={{ justifyItems: 'center',textAlign: 'center', p: 3 }}>
              <img src="/noblivion-icon-2.png" style={{ width: '160px'}}></img>
              <br></br>
              <Typography variant="h5" mb={2}>2. {t('landing.features.share_memories.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features.share_memories.description')}
              </Typography>
            </Box>
            <Box sx={{ justifyItems: 'center',textAlign: 'center', p: 3 }}>
              <img src="/noblivion-icon-3.png" style={{ width: '160px'}}></img>
              <br></br>
              <Typography variant="h5" mb={2}>3. {t('landing.features.preserve_legacy.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features.preserve_legacy.description')}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box 
        sx={{ 
          py: 12, 
          backgroundColor: '#1eb3b7',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" mb={4}>
            {t('landing.cta.title')}
          </Typography>
          <Button 
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              backgroundColor: 'gold',
              color: '#000',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            {t('landing.cta.button')}
          </Button>
          <Typography variant="h5" mt={4}>
            <Link to="/business" style={{ textDecoration: 'underline' }}>{t('landing.business_edition_hint')}</Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}