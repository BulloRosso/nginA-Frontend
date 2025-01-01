// src/pages/InterviewWelcome.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';
import { SkipNext } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import VideoLoadingIndicator from './VideoLoadingIndicator';

export default function InterviewWelcome() {
 const navigate = useNavigate();
 const videoRef = useRef<HTMLVideoElement>(null);
 const { t, i18n } = useTranslation(['interview']);
 const [remainingTime, setRemainingTime] = useState<string>('');
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   if (videoRef.current) {
     videoRef.current.play();
   }
 }, []);

 const handleVideoEnd = () => {
   navigate('/interview');
 };

 const handleTimeUpdate = () => {
   if (videoRef.current) {
     const remaining = videoRef.current.duration - videoRef.current.currentTime;
     const minutes = Math.floor(remaining / 60);
     const seconds = Math.floor(remaining % 60);
     setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
   }
 };

 const handleSkip = () => navigate('/interview');
 const handleLoadedData = () => setIsLoading(false);
 const videoSrc = `/videos/interview_welcome_${i18n.language}.mp4`;

 return (
   <Container maxWidth="lg" sx={{ 
     height: '100vh',
     display: 'flex',
     flexDirection: 'column',
     justifyContent: 'center',
     alignItems: 'center'
   }}>
     <Typography variant="h4" sx={{ mb: 4 }}>
       {t('interview.welcome_title')}
     </Typography>

     <Box sx={{ width: '100%', maxWidth: '1400px', position: 'relative' }}>
       {isLoading && <VideoLoadingIndicator />}
       <video
         ref={videoRef}
         onEnded={handleVideoEnd}
         onTimeUpdate={handleTimeUpdate}
         onLoadedData={handleLoadedData}
         style={{ width: '100%', borderRadius: '8px' }}
         controls={false}
       >
         <source src={videoSrc} type="video/mp4" />
         {t('interview.video_not_supported')}
       </video>

       <Box sx={{ 
         mt: 2,
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center'
       }}>
         <Typography variant="body2" color="text.secondary">
           {remainingTime && `${t('interview.remaining_time')}: ${remainingTime}`}
         </Typography>

         <Button
           variant="text"
           onClick={handleSkip}
           endIcon={<SkipNext />}
           sx={{ ml: 'auto' }}
         >
           {t('interview.skip_welcome')}
         </Button>
       </Box>
     </Box>
   </Container>
 );
}