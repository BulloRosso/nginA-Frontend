// src/components/LandingPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Container, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['landing', 'common']);
  const [heroHeight, setHeroHeight] = useState('auto');

  // Original image dimensions
  const originalWidth = 1755;
  const originalHeight = 916;

  // Dynamically calculate hero section height based on viewport width
  useEffect(() => {
    const updateHeroHeight = () => {
      const viewportWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
      // Calculate the proportional height based on the image's aspect ratio
      const aspectRatio = originalHeight / originalWidth;
      const calculatedHeight = Math.round(viewportWidth * aspectRatio);

      // Set minimum and maximum height constraints
      const minHeight = 400;
      const maxHeight = Math.min(window.innerHeight * 0.9, 916); // 90% of viewport height or original height

      const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight));
      setHeroHeight(`${finalHeight}px`);
    };

    // Update on mount and whenever window resizes
    updateHeroHeight();
    window.addEventListener('resize', updateHeroHeight);

    return () => {
      window.removeEventListener('resize', updateHeroHeight);
    };
  }, []);

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
          height: heroHeight,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#f8f9fa',
          backgroundImage: 'url(/img/landingpage/supercharged.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              justifyItems: 'start',
              textAlign: 'start',
              py: { xs: 3, md: 6 }
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
            <Box sx={{ 
                width: '100%',
                justifyItems: 'end',
                textAlign: 'end',
              }}>
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
                mt: { xs: '50px', sm: '100px', md: '150px' },
                borderRadius: 2
              }}
            >
              {t('landing.try_now')}
            </Button></Box>
          </Box>
        </Container>
      </Box>

      {/* Landing.ds Section - Positioned directly after the hero section */}
      <Box sx={{ py: 6, backgroundColor: 'black', color: 'white',  borderTop: '1px solid black' }}>
        <Container maxWidth="lg">
          <Typography variant="h5" sx={{ fontWeight: 'bold' }} textAlign="center" mb={0}>
            {t('landing.ds')}
          </Typography>
        </Container>
      </Box>

      {/* Backstory Section */}
      <Box sx={{ py: 8, backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" textAlign="center" mb={8}>
            {t('landing.backstory.quote')}
          </Typography> 
          <Typography variant="body1">
            {t('landing.backstory.paragraph1')}
          </Typography>
          <img src="/img/ngina-usecase-bg.jpg" style={{ marginBottom: '24px', marginTop: '24px' }}></img>
          <Typography variant="body1">
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

              <img src="/img/n8n-agent.jpg" style={{ width: '300px'}}></img>
               <br></br>
              <Typography variant="h5" mb={2}>1. {t('landing.features.create_profile.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features.create_profile.description')}
              </Typography>
            </Box>
            <Box sx={{ justifyItems: 'center',textAlign: 'center', p: 3 }}>
              <img src="/img/wrapper.png" style={{ width: '120px'}}></img>
              <br></br>
              <Typography variant="h5" mb={2}>2. {t('landing.features.share_memories.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features.share_memories.description')}
              </Typography>
            </Box>
            <Box sx={{ justifyItems: 'center',textAlign: 'center', p: 3 }}>
              <img src="/img/agent-run.jpg" style={{ width: '260px'}}></img>
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
          <Typography variant="h5" mb={4}>
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
      
        </Container>
      </Box>
    </Box>
  );
}