import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';

export default function IntroductionVideo() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleVideoEnd = () => {
    navigate('/interview');
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Typography variant="h4" sx={{ mb: 4 }}>
        Before we begin, please watch this video
      </Typography>
      <Box sx={{ width: '100%', maxWidth: '800px' }}>
        <video
          ref={videoRef}
          onEnded={handleVideoEnd}
          style={{ width: '100%', borderRadius: '8px' }}
          controls={false}
        >
          <source src="https://samplelib.com/lib/preview/mp4/sample-5s.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Box>
    </Container>
  );
}