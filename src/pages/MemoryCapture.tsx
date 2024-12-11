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
  DialogTitle
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
  
  // Start interview session on component mount
  useEffect(() => {
    const initInterview = async () => {
      try {
        setLoading(true);
        const profileId = localStorage.getItem('profileId');
        if (!profileId) {
          throw new Error('No profile ID found');
        }

        // Start new interview session
        const result = await InterviewService.startInterview(profileId);
        setSessionId(result.session_id);
        setQuestion(result.initial_question);
      } catch (err) {
        setError('Failed to start interview session');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initInterview();
  }, []);

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

      // First create the memory
      const memoryData = {
        category: Category.CHILDHOOD,
        description: response,
        time_period: new Date().toISOString(),
        location: {
          name: "Unknown",
          city: null,
          country: null,
          description: null
        },
        people: [],
        emotions: [],
        image_urls: [],
        audio_url: null
      };

      // Create memory first
      const createdMemory = await MemoryService.createMemory(profileId, sessionId, memoryData);

      // Then upload images if any
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(image => {
          formData.append('files', image.file);
        });

        await MemoryService.uploadMedia(formData, createdMemory.id);
      }

      // Clear form
      setResponse('');
      setImages([]);
      setTranscript('');

      // Refresh memories list
      await fetchMemories();

      // Get next question
      const nextQuestion = await InterviewService.getNextQuestion(profileId, sessionId);
      setQuestion(nextQuestion.text);
    } catch (err) {
      setError('Failed to save memory: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

return (
    <Container >
      <Box sx={{ my: 4 }}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <MemoryTimeline memories={memories}  onMemoryDeleted={fetchMemories}  />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Stack spacing={3}>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || (!response && !images.length)}
                  endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                >
                  {t('interview.save_memory')}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

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