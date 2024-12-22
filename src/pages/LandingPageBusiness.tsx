// src/components/LandingPage.tsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, 
        Container, 
        Typography, 
        Box,
        Table,
        TableBody,
        TableCell,
        TableContainer,
        TableHead,
        TableRow,
        Paper,
        getIconButtonUtilityClass,
} from '@mui/material';
import {
  Check as CheckIcon,
  ChatTwoTone as ChatIcon,
  CableTwoTone as APIIcon,
  HubTwoTone as KnowledgeIcon,
  EngineeringTwoTone as EngineeringIcon,
  LocalOffer as PriceIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function LandingPageBusiness() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    navigate('/profile');
  };

  const getIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <EngineeringIcon sx={{ marginRight: '10px' }} />;
      case 1:
        return <KnowledgeIcon sx={{ marginRight: '10px' }} />;
      case 2:
        return <ChatIcon sx={{ marginRight: '10px' }}/>;
      case 3:
        return <APIIcon sx={{ marginRight: '10px' }}/>;
    }
    return null;
  }

  const benefits = useMemo(() => [
    {
      category: t('landing.feature_comparison.agents'),
      basic: t('landing.feature_comparison.basic_agents'),
      premium: t('landing.feature_comparison.premium_agents'),

    },
    {
      category: t('landing.feature_comparison.knowledge'),
      basic: t('landing.feature_comparison.basic_knowledge'),
      premium: t('landing.feature_comparison.premium_knowledge'),

    },
    {
      category: t('landing.feature_comparison.bot'),
      basic: t('landing.feature_comparison.basic_bot'),
      premium: t('landing.feature_comparison.premium_bot'),

    },
    {
      category: t('landing.feature_comparison.API'),
      basic: t('landing.feature_comparison.basic_API'),
      premium: t('landing.feature_comparison.premium_API'),

    },
  ], [t]); 
  
  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          backgroundColor: '#f8f9fa',
          backgroundImage: 'url(/public/leaving_expert.jpg)',
          backgroundSize: '100vw',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          overflow: 'hidden' 
        }}
      >
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              justifyItems: 'center',
              textAlign: 'center',
              py: 6
            }}
          >
            <Box sx={{ justifyItems: 'center',
                        textAlign: 'center', paddingLeft: '160px'}}>  
              <img src="/public/conch-logo.png" alt="Conch Logo" width="100" />
  
              <Typography 
                variant="h2" 
                component="h1"
                sx={{ 
                  fontWeight: 'bold',
                  mb: 6,
                  color: '#2c3e50',
                  textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
                }}
              >
                <span style={{ color: 'darkred'}}>nO</span>blivion
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  mb: 2,
                  color: '#fff',
                  textShadow: '2px 2px 2px #6B6B6B',
                }}
              >
                {t('landing.subtitle_business')}
              </Typography>
              </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: '#fff',
                textShadow: '2px 2px 2px #6B6B6B',
                maxWidth: '800px',
                mx: 'auto'
              }}
            >
              {t('landing.description_business')}
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
                borderRadius: 2
              }}
            >
              {t('landing.try_now')}
            </Button>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3,
                mt: 3,
                color: '#fff',
                maxWidth: '800px',
                textShadow: '2px 2px 2px #6B6B6B',
                mx: 'auto'
              }}
            >
              
            </Typography>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 6, backgroundColor: '#f6f5ef' }}>
        <Container maxWidth="lg">
          <Typography variant="h6" textAlign="center" mb={2}>
            {t('landing.ds_business')}
          </Typography>
        </Container>
      </Box>

      {/* Backstroy Section */}
      <Box sx={{ py: 6, backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{ 
            color: '#1eb3b7',
            fontSize: '22px',
            fontWeight: 'bold',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory_business.quote')}
          </Typography>  
          <Typography sx={{ 
            color: '#777',
            fontSize: '18px',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory_business.paragraph1')}
          </Typography>  
          <Typography sx={{ 
            color: '#777',
            fontSize: '18px',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory_business.paragraph2')}
          </Typography>  
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" mb={4}>
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
             
              <img src="/public/noblivion-icon-1.png" style={{ width: '160px'}}></img>
               <br></br>
              <Typography variant="h5" mb={2}>1. {t('landing.features_business.create_profile.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features_business.create_profile.description')}
              </Typography>
            </Box>
            <Box sx={{ justifyItems: 'center',textAlign: 'center', p: 3 }}>
              <img src="/public/noblivion-icon-2.png" style={{ width: '160px'}}></img>
              <br></br>
              <Typography variant="h5" mb={2}>2. {t('landing.features_business.share_memories.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features_business.share_memories.description')}
              </Typography>
            </Box>
            <Box sx={{ justifyItems: 'center',textAlign: 'center', p: 3 }}>
              <img src="/public/noblivion-icon-3.png" style={{ width: '160px'}}></img>
              <br></br>
              <Typography variant="h5" mb={2}>3. {t('landing.features_business.preserve_legacy.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features_business.preserve_legacy.description')}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 6, backgroundColor: '#f6f5ef' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" mb={4}>
            {t('landing.feature_comparison_title')}
          </Typography>
          <Box 
            sx={{ 
              justifyItems: 'center',
              textAlign: 'center',
              py: 6
            }}
          >
          {/* Benefits Table */}
          <TableContainer component={Paper} sx={{  mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>{t('buy.feature')}</TableCell>
                  <TableCell>{t('landing.feature_comparison.title_personal')}</TableCell>
                  <TableCell sx={{ bgcolor: 'gold', color: '#000' }}>
                    {t('landing.feature_comparison.title_business')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {benefits.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      {getIcon(index)}
                      <b>{row.category}</b>
                    </TableCell>
                    <TableCell>{row.basic}</TableCell>
                    <TableCell sx={{ bgcolor: '#fff9c4' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon sx={{ color: 'gold' }} />
                        {row.premium}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
            {t('landing.cta_business.title')}
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
            {t('landing.cta_business.button')}
          </Button>
        </Container>
      </Box>
    </Box>
  );
}