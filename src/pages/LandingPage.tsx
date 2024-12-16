// src/components/LandingPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/profile');
  };

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
          backgroundImage: 'url(/public/noblivion-opener.jpg)',
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
           
            <img src="/public/conch-logo.png" alt="Conch Logo" width="100" />
            
            <Typography 
              variant="h2" 
              component="h1"
              sx={{ 
                fontWeight: 'bold',
                mb: 3,
                color: '#2c3e50'
              }}
            >
              <span style={{ color: 'darkred'}}>nO</span>blivion
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 4,
                color: '#34495e'
              }}
            >
              Precious <b>memories</b> persisted
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 6,
                color: '#fff',
                maxWidth: '800px',
                textShadow: '2px 2px 2px #6B6B6B',
                mx: 'auto'
              }}
            >
              Preserve your family's life stories through meaningful conversations with our AI interviewer. 
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
              Try it now
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
              Share memories, add photos, and create a lasting legacy for generations to come.
            </Typography>
           
          </Box>
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
              Walking along the shore, we often stumble upon empty seashells – silent echoes of the past.
            </Typography>  
           <Typography sx={{ 
             color: '#777',
             fontSize: '18px',
          
             fontFamily: 'Averia Libre',
           }} textAlign="center" mb={8}>
            Their stories remain a mystery, lost to time, yet they spark our imagination. These shells, once vibrant and alive in a colorful underwater world, now stand as fragile reminders of something greater. They teach us an essential truth: preserving the stories of the past gives us the wisdom to live more fully in the present.  
             </Typography>  
             <Typography sx={{ 
               color: '#777',
               fontSize: '18px',
               
               fontFamily: 'Averia Libre',
             }} textAlign="center" mb={8}>
              Let us honor these tales, for in understanding where we come from, we shape a brighter, more meaningful today.
               </Typography>  
        </Container>
      </Box>
      
      {/* Features Section */}
      <Box sx={{ py: 12, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" mb={8}>
            How it works
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
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h5" mb={2}>Create Profile</Typography>
              <Typography color="text.secondary">
                Start by creating a profile with basic information about yourself or your loved one
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h5" mb={2}>Share Memories</Typography>
              <Typography color="text.secondary">
                Engage in natural conversations with our AI interviewer to capture life stories
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h5" mb={2}>Preserve Legacy</Typography>
              <Typography color="text.secondary">
                Add photos, organize memories, and create a beautiful timeline of life events which can be
                printed as book from the PDF file we create for you!
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
            Start Preserving Your Memories Today
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
            Try it now
          </Button>
        </Container>
      </Box>
    </Box>
  );
}