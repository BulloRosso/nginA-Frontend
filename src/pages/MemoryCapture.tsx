// src/pages/MemoryCapture.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Stack,
  ImageList,
  ImageListItem,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Camera as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { InterviewService } from '../services/interviews';
import MemoryService from '../services/memories';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Category } from '../types/memory';
import MemoryTimeline from '../components/memories/VerticalTimeline';
import { Memory } from '../types/memory';
import { createDefaultMemories } from '../utils/memoryDefaults';
import { Profile } from '../types/profile';
import { ProfileService } from '../services/profiles';

const CameraPreview = styled('video')({
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
  borderRadius: '8px',
  backgroundColor: 'black', // Makes it easier to see when camera is loading
  marginBottom: '16px'
});

const AudioWaveform = styled(Box)(({ theme, isRecording }) => ({
  width: '100%',
  height: '60px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    background: isRecording
      ? 'linear-gradient(90deg, #f44336 50%, transparent 50%)'
      : 'none',
    backgroundSize: '200% 100%',
    animation: isRecording ? 'wave 1s linear infinite' : 'none',
  },
}));

const MemoryCapture = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [mediaMode, setMediaMode] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Initialize speech recognition
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] },
    onDrop: useCallback(async (acceptedFiles) => {
      const newImages = await Promise.all(
        acceptedFiles.map(async (file) => {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          return { src: dataUrl, file };
        })
      );
      setImages([...images, ...newImages]);
      setIsUploadDialogOpen(false);
    }, [images])
  });

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images => images.filter((_, index) => index !== indexToRemove));
  };
  
  useEffect(() => {
    const fetchProfileAndMemories = async () => {
      try {
        setLoading(true);
        const profileId = localStorage.getItem('profileId');
        if (!profileId) {
          throw new Error('No profile ID found');
        }

        // Fetch profile
        const profileData = await ProfileService.getProfile(profileId);
        setProfile(profileData);

        // Fetch memories after profile is set
        await fetchMemories();
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load profile or memories');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndMemories();
  }, []); 
  
  useEffect(() => {
    const initInterview = async () => {
      try {
        setLoading(true);
        const profileId = localStorage.getItem('profileId');
        if (!profileId) {
          throw new Error('No profile ID found');
        }

        const result = await InterviewService.startInterview(profileId, i18n.language);
        setSessionId(result.session_id);
        setQuestion(result.initial_question);
      } catch (err) {
        console.error('Failed to start interview:', err);
        setError('Failed to start interview session');
      } finally {
        setLoading(false);
      }
    };

    initInterview();
  }, [i18n.language]);

  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true);
      const profileId = localStorage.getItem('profileId');
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      const fetchedMemories = await MemoryService.getMemories(profileId);

      // If no memories and profile exists, create defaults
      if (fetchedMemories.length === 0 && profile) {
        setMemories(createDefaultMemories(profile));
      } else {
        setMemories(fetchedMemories);
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
      setError('Failed to load memories');
    } finally {
      setLoading(false);
    }
  }, [profile]); // Add profile as dependency since it's used in the function

  // Camera handling
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      setIsCameraOpen(true); // Set this first to open the dialog

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      console.log('Got camera stream:', stream);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setMediaMode('camera'); // Then set the mode
        console.log('Camera started, mode set to:', 'camera');
      }
    } catch (err) {
      console.error('Failed to access camera:', err);
      setError('Failed to access camera');
      setIsCameraOpen(false);
      setMediaMode(null);
    }
  };

  const handleCloseCamera = () => {
    stopCamera();
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setIsCameraOpen(false);
    setMediaMode(null);
    console.log('Camera stopped, mode set to:', null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const imageUrl = canvas.toDataURL('image/jpeg');

          // Add the new image to the images array
          setImages(prevImages => [...prevImages, { src: imageUrl, file }]);

          // Close the camera after capturing
          handleCloseCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  

  // Add useEffect to clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Audio recording handling
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      if (recognitionRef.current) {
        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript(prev => prev + ' ' + transcript);
        };
        recognitionRef.current.start();
      }

      setIsRecording(true);
      setMediaMode('audio');
      mediaRecorderRef.current.start();
    } catch (err) {
      setError('Failed to start recording');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setMediaMode(null);
      setResponse(prev => prev + ' ' + transcript);
      setTranscript('');
    }
  };

  // Memory submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileId = localStorage.getItem('profileId');
      if (!profileId || !sessionId) {
        throw new Error('Missing profile ID or session ID');
      }

      // Submit response to get classification and sentiment
      const interviewResponse = await InterviewService.submitResponse(
        profileId,
        sessionId,
        {
          text: response,
          language: i18n.language
        }
      );

      // Clear input regardless of memory classification
      setResponse('');
      setImages([]);
      setTranscript('');
      setQuestion(interviewResponse.follow_up);

      // Only refresh memories if the input was classified as a memory
      if (interviewResponse.is_memory) {
        // Wait for the memories to be fetched to ensure timeline is up to date
        await fetchMemories();

        // Optional: Scroll to the new memory in the timeline
        // You could pass the memory_id to the timeline component
        if (interviewResponse.memory_id) {
          // Add this to your types if not already present
          const timelineElement = document.querySelector(
            `[data-memory-id="${interviewResponse.memory_id}"]`
          );
          timelineElement?.scrollIntoView({ behavior: 'smooth' });
        }
      }

    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Failed to save response: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

return (
    <Container 
        maxWidth="{false}" // This removes max-width constraint
        disableGutters
        sx={{ 
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingBottom: 0,
          marginBottom:0,
          height: 'calc(100vh - 42px)', // Full viewport height minus margin
          py: 2,
          mb: 0, // Added: explicitly set margin bottom to 0
            '& .MuiContainer-root': { // Added: override MUI's default margin
              marginBottom: 0
            }
        }}
      >
        <Grid 
          container 
          spacing={3} 
          sx={{ 
            height: '100%',
          }}
        >
          {/* Memory Input Area */}
          <Grid item xs={12} md={6} xl={4} xxl={5} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ 
                flex: 1, 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Stack spacing={3} sx={{ flex: 1 }}>
                  {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}
    
                  {/* AI Question */}
                  <Typography variant="h6" gutterBottom>
                    {question || t('interview.loading_question')}
                  </Typography>
    
                  {/* Text Input */}
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder={t('interview.share_memory')}
                    disabled={loading}
                    sx={{ flex: 1 }}
                  />
    
                  {/* Live Transcript */}
                  {transcript && (
                    <Typography variant="body2" color="textSecondary">
                      {t('interview.transcribing')}: {transcript}
                    </Typography>
                  )}
                  
                  {/* Audio UI */}
                  {mediaMode === 'audio' && (
                    <Box sx={{ textAlign: 'center' }}>
                      <AudioWaveform isRecording={isRecording} />
                      <Button
                        variant="contained"
                        color="error"
                        onClick={stopRecording}
                        startIcon={<StopIcon />}
                        sx={{ mt: 1 }}
                      >
                        {t('interview.stop_recording')}
                      </Button>
                    </Box>
                  )}
    
                  {/* Image Preview Grid */}
                  {images.length > 0 && (
                    <ImageList sx={{ mt: 2 }} cols={4} rowHeight={164}>
                      {images.map((image, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={image.src}
                            alt={`Preview ${index + 1}`}
                            loading="lazy"
                            style={{ height: '100%', objectFit: 'cover' }}
                          />
                          <IconButton
                            sx={{
                              position: 'absolute',
                              right: 4,
                              top: 4,
                              bgcolor: 'rgba(0, 0, 0, 0.5)',
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.7)'
                              }
                            }}
                            onClick={() => handleRemoveImage(index)}
                          >
                            <DeleteIcon sx={{ color: 'white' }} />
                          </IconButton>
                        </ImageListItem>
                      ))}
                    </ImageList>
                  )}
    
                  {/* Control Buttons */}
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<PhotoLibraryIcon />}
                          onClick={() => setIsUploadDialogOpen(true)}
                        >
                          {t('interview.add_images')}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CameraIcon />}
                          onClick={startCamera}
                          disabled={mediaMode === 'audio'} // Only disable if audio recording is active
                        >
                          {t('interview.use_camera')}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<MicIcon />}
                          onClick={startRecording}
                          disabled={mediaMode !== null}
                        >
                          {t('interview.start_recording')}
                        </Button>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || (!response && !images.length)}
                        endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                      >
                        {t('interview.save_memory')}
                      </Button>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            </Grid>
          
            {/* Timeline Area */}
            <Grid item xs={12} md={6} xl={8} xxl={7} sx={{ height: '100%' }}>
               <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: '#f1f1f1',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#888',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: '#666',
                      },
                    },
                  }}>
                  <MemoryTimeline 
                    memories={memories} 
                    onMemoryDeleted={fetchMemories} 
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

      {/* Camera Dialog */}
      <Dialog
        open={isCameraOpen}
        onClose={handleCloseCamera}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('interview.take_photo')}</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            py: 2,
          }}>
            <CameraPreview 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
            />
            <Box sx={{ 
              mt: 2,
              display: 'flex',
              gap: 2,
              width: '100%',
              justifyContent: 'center',
            }}>
              <Button
                variant="contained"
                color="primary"
                onClick={capturePhoto}
                startIcon={<CameraIcon />}
              >
                {t('interview.capture')}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseCamera}
              >
                {t('interview.close_camera')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      
      {/* Upload Dialog */}
      <Dialog 
        open={isUploadDialogOpen} 
        onClose={() => setIsUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('interview.upload_images')}</DialogTitle>
        <DialogContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isUploading ? 'opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isDragActive ? (
              <p>{t('interview.drop_files_here')}</p>
            ) : (
              <div>
                <PhotoLibraryIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography>{t('interview.drag_or_click')}</Typography>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default MemoryCapture;