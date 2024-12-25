import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';
import { SkipNext as SkipIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function IntroductionVideo() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t, i18n } = useTranslation(['common']);
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleVideoEnd = () => {
    navigate('/profile-selection');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const remaining = videoRef.current.duration - videoRef.current.currentTime;
      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);
      setRemainingTime(
        `${minutes}:${seconds.toString().padStart(2, '0')}`
      );
    }
  };

  const handleSkip = () => {
    navigate('/profile-selection');
  };

  // Get video source based on current language
  const videoSrc = `/videos/noblivion_intro_${i18n.language}.mp4`;

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Typography variant="h4" sx={{ mb: 4 }}>
        {t('common.watch_video')}
      </Typography>
      <Box sx={{ 
        width: '100%', 
        maxWidth: '1400px',
        position: 'relative'
      }}>
        <video
          ref={videoRef}
          onEnded={handleVideoEnd}
          onTimeUpdate={handleTimeUpdate}
          style={{ width: '100%', borderRadius: '8px' }}
          controls={false}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <Box sx={{ 
          mt: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="body2" color="text.secondary">
            {remainingTime && `${t('common.remaining_time')}: ${remainingTime}`}
          </Typography>

          <Button
            variant="text"
            onClick={handleSkip}
            endIcon={<SkipIcon />}
            sx={{ ml: 'auto' }}
          >
            {t('common.skip_video')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}