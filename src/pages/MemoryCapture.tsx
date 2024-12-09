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
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Camera as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Send as SendIcon,
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
  borderRadius: '8px',
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
  const [mediaMode, setMediaMode] = useState(null);
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

  
  // Initialize speech recognition
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
  }

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

  // File upload handling
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
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
    }, [images])
  });

  // Camera handling
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setMediaMode('camera');
      }
    } catch (err) {
      setError('Failed to access camera');
      console.error(err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImages([...images, { 
          src: canvas.toDataURL('image/jpeg'), 
          file 
        }]);
      }, 'image/jpeg');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setMediaMode(null);
    }
  };

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

      // First, upload any images
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const formData = new FormData();
          formData.append('file', image.file);
          const result = await MemoryService.uploadMedia(formData);
          return result.url;
        })
      );

      // Create the memory with the current session ID
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
        image_urls: imageUrls,
        audio_url: null
      };

      await MemoryService.createMemory(profileId, sessionId, memoryData);

      // Clear form
      setResponse('');
      setImages([]);
      setTranscript('');

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
            <Box sx={{ maxHeight: "600px", overflowY: "auto" }}> 
              <MemoryTimeline memories={memories}  onMemoryDeleted={fetchMemories}  />
            </Box>
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

              {/* Camera UI */}
              {mediaMode === 'camera' && (
                <Box sx={{ textAlign: 'center' }}>
                  <CameraPreview ref={videoRef} autoPlay playsInline />
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      onClick={capturePhoto}
                      startIcon={<CameraIcon />}
                    >
                      {t('interview.capture')}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={stopCamera}
                      sx={{ ml: 1 }}
                    >
                      {t('interview.close_camera')}
                    </Button>
                  </Box>
                </Box>
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

              {/* Submit Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
    </Container>
  );
};

export default MemoryCapture;