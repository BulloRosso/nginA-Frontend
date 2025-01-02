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
  Grid,
  Tabs, 
  Tab
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Camera as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  TouchApp as TouchAppIcon,
  PostAdd as AddMemoryIcon,
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
import { AudioWaveformProps } from '@/types/components';

const QuestionTypography = styled(Typography)(({ theme }) => ({
  fontFamily: '"Pangolin", regular',
  fontSize: '1.3rem',
  lineHeight: 1.4,
  paddingLeft: '10px',
  paddingRight: '0px',
  marginBottom: theme.spacing(0),
  color: theme.palette.text.primary
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`memory-tabpanel-${index}`}
      aria-labelledby={`memory-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const CameraPreview = styled('video')({
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
  borderRadius: '8px',
  backgroundColor: 'black', // Makes it easier to see when camera is loading
  marginBottom: '16px'
});

const AudioWaveform = styled('canvas')({
  width: '100%',
  height: '60px',
  backgroundColor: '#f5f5f5',
  borderRadius: '4px'
});

const AudioVisualizer = ({ isRecording, mediaRecorder }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    if (isRecording && mediaRecorder) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaRecorder.stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const draw = () => {
        if (!isRecording) return;

        animationFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / dataArrayRef.current.length;
        let x = 0;

        dataArrayRef.current.forEach(value => {
          const barHeight = (value / 255) * canvas.height;
          ctx.fillStyle = `rgb(30, 179, 183, ${value / 255})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth;
        });
      };

      draw();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        audioContext.close();
      };
    }
  }, [isRecording]);

  return (
    <AudioWaveform ref={canvasRef} />
  );
};

const AnimatedMicIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  left: '0px',  // Pull out of the flow
  width: '40px',
  height: '40px',
  minWidth: '40px',  // Enforce circle shape
  minHeight: '40px', // Enforce circle shape
  borderRadius: '50%',
  backgroundColor: 'gold', //theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',  // Top align
  marginTop: '4px',  // Fine-tune top alignment
  animation: 'pulse 4s infinite',
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(255, 165, 0, 0.4)', // Orange version
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(255, 165, 0, 0)', // Orange version
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(255, 165, 0, 0)', // Orange version
    }
  }
}));

const SelectedMemoryDisplay = ({ memory, onClose }) => {
  const { t } = useTranslation();

  if (!memory) {
    return (
      <Card sx={{ 
        mt: 2, 
        backgroundColor: '#f8f9fa',
        border: '1px dashed #ccc'
      }}>
        <CardContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          p: 3
        }}>
          <TouchAppIcon 
            sx={{ 
              color: '#1eb3b7',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)',
                  opacity: 0.7,
                },
                '50%': {
                  transform: 'scale(1.1)',
                  opacity: 1,
                },
                '100%': {
                  transform: 'scale(1)',
                  opacity: 0.7,
                }
              }
            }} 
          />
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            {t('memory.selection_hint',  { ns: 'memory' })}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 2, position: 'relative', backgroundColor: '#f1efe8' }}>
      <CardContent>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" gutterBottom sx={{ color: 'rgb(252, 156, 43)' }}>
          <AddMemoryIcon /> {t('memory.selected_memory', { ns: 'memory' })} 
        </Typography>

        <Grid container spacing={2}>

          <Grid item xs={12}>
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                fontFamily: 'Pangolin'
              }}
            >
              {memory.description}
            </Typography>
          </Grid>

        </Grid>
      </CardContent>
    </Card>
  );
};

const MemoryCapture = () => {
  const { t, i18n } = useTranslation(['interview', 'memory','common']);
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
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);  // For initial data load
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);  // For memory operations
  const [isSubmitting, setIsSubmitting] = useState(false);  // For memory submission

  // Add the selection handler
  const handleMemorySelect = (memory: Memory) => {
    setSelectedMemory(prevSelected => 
      prevSelected?.id === memory.id ? null : memory
    );
  };
  
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
  const fetchMemories = useCallback(async () => {
    try {
      const profileId = localStorage.getItem('profileId');
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      console.time('Total fetch');
      const fetchedMemories = await MemoryService.getMemories(profileId);

      // Only update state if the component is still mounted
      setMemories(prevMemories => {
        // If no memories and profile exists, create defaults
        if (fetchedMemories.length === 0 && profile) {
          return createDefaultMemories(profile);
        }
        return fetchedMemories;
      });

    } catch (err) {
      console.error('Failed to fetch memories:', err);
      setError('Failed to load memories');
    } finally {
      console.timeEnd('Total fetch');
    }
  }, []); 
  
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsInitializing(true);
        
        let profileId = localStorage.getItem('profileId');
        
        // If not in localStorage, check sessionStorage (for interview tokens)
        if (!profileId) {
          profileId = sessionStorage.getItem('profile_id');
        }
        
        if (!profileId) {
          throw new Error('No profile ID found');
        }

        console.time('Parallel API calls');
        // Run all API calls in parallel
        const [profileData, memoriesData, interviewData] = await Promise.all([
          ProfileService.getProfile(profileId),
          MemoryService.getMemories(profileId),
          InterviewService.startInterview(profileId, i18n.language)
        ]);
        console.timeEnd('Parallel API calls');

        // Set all states
        setProfile(profileData);
        setMemories(memoriesData.length === 0 ? createDefaultMemories(profileData) : memoriesData);
        setSessionId(interviewData.session_id);
        setQuestion(interviewData.initial_question);

      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Failed to load data');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, []);
/*  
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
*/

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      if (recognitionRef.current) {
        setTranscript('');
        let silenceTimeout;

        recognitionRef.current.onresult = (event) => {
          if (silenceTimeout) clearTimeout(silenceTimeout);

          const current = event.resultIndex;
          const latestTranscript = event.results[current][0].transcript;
          setTranscript(latestTranscript);

          silenceTimeout = setTimeout(() => {
            stopRecording();
          }, 2000);
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
      // Stop the recorder
      mediaRecorderRef.current.stop();

      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
      });

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      setIsRecording(false);
      setMediaMode(null);

      if (transcript) {
        setResponse(prev => (prev + ' ' + transcript).trim());
        setTranscript('');
      }
    }
  };

  // Cleanup in useEffect
  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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

      let user_id = JSON.parse(localStorage.getItem('user')).id;
      if (!user_id ) {
        console.log(localStorage.getItem('user'))
        throw new Error('Cannot read user id from local storage');
      }
      
      // Submit response to get classification and sentiment
      const interviewResponse = await InterviewService.submitResponse(
        profileId,
        sessionId,
        {
          user_id: user_id,
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
        maxWidth={false} // This removes max-width constraint
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
          <Grid item xs={12} md={5} xl={4} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    fontSize: '0.9rem',
                    minWidth: 'unset',
                    px: 3,
                  }
                }}
              >
                <Tab label={t('interview.tab_interview')} />
                <Tab label={t('interview.tab_sessions')} />
                <Tab label={t('interview.tab_tips')} />
              </Tabs>
              
              <CardContent sx={{ 
                flex: 1, 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
              <TabPanel value={activeTab} index={0}
                sx={{ 
                  height: '100%', 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}
                >
                <Stack spacing={3} sx={{ flex: 1 }}>
                  {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}
    
                  {/* AI Question */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start'  // Change to flex-start for top alignment
                  }}>
                    <AnimatedMicIcon>
                      <MicIcon sx={{ 
                        color: 'black', 
                        fontSize: '20px',
                        // Center the icon within the circle
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }} />
                    </AnimatedMicIcon>
                    <QuestionTypography variant="h6" gutterBottom>
                      {question || t('interview.loading_question')}
                    </QuestionTypography>
                  </Box>
    
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
                  {isRecording && transcript && (
                    <Typography variant="body2" color="textSecondary">
                      {t('interview.transcribing')}: {transcript}
                    </Typography>
                  )}
                  
                  {/* Audio UI */}
                  {mediaMode === 'audio' && (
                    <Box sx={{ textAlign: 'center' }}>
                      <AudioVisualizer isRecording={isRecording} mediaRecorder={mediaRecorderRef.current} />
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
                          onClick={(e) => {
                            e.preventDefault();
                            startRecording();
                          }}
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
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('interview.previous_sessions')}
                  </Typography>
                  {/* Add your sessions content here */}
                  <Typography variant="body1">
                    {t('interview.no_previous_sessions')}
                  </Typography>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('interview.tips_title')}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {t('interview.tips_content')}
                  </Typography>
                  {/* Add more tips content */}
                </Box>
              </TabPanel>
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <SelectedMemoryDisplay 
                  memory={selectedMemory} 
                  onClose={() => setSelectedMemory(null)}
                />
              </Box>
            </Card>
            </Grid>
          
            {/* Timeline Area */}
            <Grid item xs={12} md={7} xl={8} sx={{ height: '100%' }}>
               <Card sx={{ height: '100%', display: 'flex', paddingBottom: '0 important', margin: 0, flexDirection: 'column' }}>
                  <CardContent sx={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingBottom: '0 important',
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
                    {isInitializing  ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <CircularProgress 
                          size={60}
                          sx={{ color: '#1eb3b7' }}
                        />
                        <Typography variant="body1" color="textSecondary">
                          {t('memory.loading_timeline',  { ns: 'memory' })}
                        </Typography>
                      </Box>
                    ) : (
                      <MemoryTimeline 
                        memories={memories}
                        onMemoryDeleted={fetchMemories}
                        onMemorySelect={handleMemorySelect}
                        selectedMemoryId={selectedMemory?.id || null}
                      />
                    )}
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