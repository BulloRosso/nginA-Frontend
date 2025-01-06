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
  Tab,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Mic as MicIcon,
  QuestionMark as QuestionIcon,
  Stop as StopIcon,
  Camera as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  TouchApp as TouchAppIcon,
  PostAdd as AddMemoryIcon,
  AccessTime as TimeIcon, 
  Check as CompletedIcon,
  Event as CalendarIcon,
  KeyboardVoice as VoiceIcon,
  PhotoLibrary as ImageIcon,
  FormatListNumbered as ListIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { InterviewService } from '../services/interviews';
import MemoryService from '../services/memories';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Category } from '../types/memory';
import MemoryTimeline from '../components/memories/VerticalTimeline';
import { Memory } from '../types/memory';
import { createDefaultMemories } from '../utils/memoryDefaults';
import { Profile } from '../types/profile';
import { ProfileService } from '../services/profiles';
import { AudioWaveformProps } from '@/types/components';
import { format } from 'date-fns';
import { de, fr, hy, ja } from 'date-fns/locale';
import { useTTS } from '../hooks/useTTS';
import { VolumeUp as SpeakIcon } from '@mui/icons-material';

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

const MemoryTips = () => {
  const { t } = useTranslation(['interview']);

  const tips = [
    {
      icon: <CalendarIcon />,
      color: '#FF6B6B', // coral red
      key: 'timeline_tip'
    },
    {
      icon: <VoiceIcon />,
      color: '#4ECDC4', // turquoise
      key: 'voice_tip'
    },
    {
      icon: <ImageIcon />,
      color: '#45B7D1', // ocean blue
      key: 'image_tip'
    },
    {
      icon: <ListIcon />,
      color: '#96CEB4', // sage green
      key: 'separate_tip'
    }
  ];

  return (
    <Box sx={{ p: 0 }}>
     
      <Stack spacing={3} sx={{ mt: 1 }}>
        {tips.map((tip, index) => (
          <Card 
            key={index}
            sx={{ 
              borderLeft: 4,
              borderColor: tip.color,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: `${tip.color}15`, // 15% opacity
                  p: 1,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {React.cloneElement(tip.icon, { 
                  sx: { color: tip.color, fontSize: 28 } 
                })}
              </Box>
              <Typography variant="body1">
                {t(`interview.${tip.key}`)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

const SessionList = ({ sessions, language }) => {
  const { t } = useTranslation(['interview', 'memory', 'common']);

  const getDateLocale = () => {
    switch (language) {
      case 'de': return de;
      case 'fr': return fr;
      case 'hy': return hy;
      case 'ja': return ja;
      default: return undefined;
    }
  };

  if (sessions.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 2,
        p: 4 
      }}>
        <TimeIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
        <Typography variant="body1" color="text.secondary">
          {t('interview.no_previous_sessions')}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table  aria-label="sessions table">
        <TableHead>
          <TableRow>
            <TableCell>{t('interview.date')}</TableCell>
            <TableCell>{t('interview.status')}</TableCell>
            <TableCell>{t('interview.summary')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session, index) => (
            <TableRow
              key={session.id}
              sx={{ 
                '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell component="th" scope="row">
                {format(
                  new Date(session.started_at),
                  'PP',
                  { locale: getDateLocale() }
                )}
              </TableCell>
              <TableCell>
                <Chip
                  icon={session.status === 'active' ? <TimeIcon /> : <CompletedIcon />}
                  label={session.status}
                  color={session.status === 'active' ? 'primary' : 'success'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {session.summary}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

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
  // session handling
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('sessionId'));
  const [sessionError, setSessionError] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [sessions, setSessions] = useState([]);
  
  const latestTranscriptRef = useRef('');
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);  // For initial data load
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);  // For memory operations
  const [isSubmitting, setIsSubmitting] = useState(false);  // For memory submission
  
  const isMounted = useRef(true);
  const navigate = useNavigate();
  
  // ------------ Session Handling -------------------

  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setSessionError(false);

      const profileId = localStorage.getItem('profileId');
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      // Get session and initial question in one call
      const result = await InterviewService.startInterview(profileId, i18n.language);

      localStorage.setItem('sessionId', result.session_id);
      setSessionId(result.session_id);
      setCurrentQuestion(result.initial_question); // Store initial question directly

    } catch (err) {
      console.error('Failed to initialize session:', err);
      setSessionError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to end current session
  const endSession = useCallback(async () => {
    try {
      const currentSessionId = localStorage.getItem('sessionId');
      if (currentSessionId) {
        await InterviewService.endSession(currentSessionId);
        localStorage.removeItem('sessionId');
        localStorage.removeItem('profileId'); 
        setSessionId(null);
        navigate('/profile-selection');
      }
    } catch (err) {
      console.error('Failed to end session:', err);
      setSessionError(true);
    }
  }, [navigate]);
  
  //  ----------- Realtime Speech --------------------
  const {
    isConnected,
    isPlaying,
    error: ttsError,
    connect: connectTTS,
    speak
  } = useTTS();

  const handleSpeak = async (question) => {
    if (question) {
      try {
        speak(question);
      } catch (err) {
        console.error('Failed to speak:', err);
      }
    }
  };

  //  ----------- /Realtime Speech --------------------
  
  // Initialize speech recognition
  useEffect(() => {
    if (!recognitionRef.current && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = i18n.language === 'de' ? 'de-DE' : 'en-US';
    }
  }, [i18n.language]);
  
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
      setIsMemoryLoading(true);
      const profileId = localStorage.getItem('profileId');
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      const fetchedMemories = await MemoryService.getMemories(profileId);
      setMemories(fetchedMemories);

    } catch (err) {
      console.error('Failed to fetch memories:', err);
      setError('Failed to load memories');
    } finally {
      setIsMemoryLoading(false);
    }
  }, []);

  const resetState = useCallback(() => {
    setLoading(false);
    setQuestion('');
    setResponse('');
    setMediaMode(null);
    setIsRecording(false);
    setImages([]);
    setError(null);
    setTranscript('');
    setSessionError(false);
    setIsSessionExpired(false);
    setProfile(null);
    setMemories([]);
    setSessionId(null);
    setSessionsLoaded(false); 
    setSessions([]); 
    setSelectedMemory(null);
    setIsInitializing(true); // Set back to true as we're about to initialize
  }, []);

  const initializeData = useCallback(async () => {
    try {
      setIsInitializing(true);  // Set this at the start
      resetState();

      let profileId = localStorage.getItem('profileId');
      if (!profileId) {
        profileId = sessionStorage.getItem('profile_id');
      }

      if (!profileId) {
        throw new Error('No profile ID found');
      }

      console.log('Fetching data for profile:', profileId);

      const [profileData, memoriesData] = await Promise.all([
        ProfileService.getProfile(profileId),
        MemoryService.getMemories(profileId),
      ]);

      if (!profileData) {
        throw new Error('No profile data received');
      }

      setProfile(profileData);
      setMemories(memoriesData);

    } catch (err) {
      console.error('Failed to initialize data:', err);
      setError('Failed to load data');
    } finally {
      setIsInitializing(false);  // Always set this to false when done
    }
  }, [resetState]);
  
  // Separate function for interview initialization
  const initializeInterview = useCallback(async () => {
    try {
      setSessionError(false);

      const profileId = localStorage.getItem('profileId');
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      // Start new interview session and get initial question
      const interviewData = await InterviewService.startInterview(profileId, i18n.language);
      setSessionId(interviewData.session_id);
      setCurrentQuestion(interviewData.initial_question);  // Store initial question
      localStorage.setItem('sessionId', interviewData.session_id);

    } catch (err) {
      console.error('Session error:', err);
      setSessionError(true);
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      resetState();
    };
  }, [resetState]);

  // Use effects to initialize component
  useEffect(() => {
    const profileId = localStorage.getItem('profileId');
    if (profileId) {
      console.log('Starting initialization for profile:', profileId);
      initializeData();
      initializeInterview();  // Call this here to ensure proper sequencing
    }
  }, [initializeData, initializeInterview]);
  
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
        let silenceTimeout;

        recognitionRef.current.onresult = (event) => {
          if (silenceTimeout) clearTimeout(silenceTimeout);

          latestTranscriptRef.current = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ');

          setTranscript(latestTranscriptRef.current);

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
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      setIsRecording(false);
      setMediaMode(null);
      setResponse(prev => prev ? `${prev} ${latestTranscriptRef.current}`.trim() : latestTranscriptRef.current.trim());
      setTranscript('');
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

  const handleTabChange = async (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Load sessions only when switching to sessions tab for the first time
    if (newValue === 1 && !sessionsLoaded) {
      try {
        setIsLoadingSessions(true);
        const profileId = localStorage.getItem('profileId');
        if (!profileId) return;

        const fetchedSessions = await InterviewService.getInterviewSessions(profileId);
        setSessions(fetchedSessions);
        setSessionsLoaded(true);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    }
  };
  
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setIsSubmitting(true);

      const profileId = localStorage.getItem('profileId');
      const currentSessionId = localStorage.getItem('sessionId');
      const currentMemoryId = localStorage.getItem('memoryId');

      if (!profileId || !currentSessionId) {
        throw new Error('Missing profile ID or session ID');
      }

      const userId = JSON.parse(localStorage.getItem('user')).id;

      // Submit response and get next question
      const result = await InterviewService.submitResponse(
        currentSessionId,
        {
          user_id: userId,
          text: response,
          language: i18n.language,
          memory_id: currentMemoryId ,
          session_id: currentSessionId 
        }
      );

      if (images.length > 0 && result.memory_id) {
        const formData = new FormData();
        images.forEach(image => {
          formData.append('files', image.file);
        });

        await MemoryService.addMediaToMemory(result.memory_id, formData);
      }

      // Get next question
      const nextQuestion = await InterviewService.getNextQuestion(
        currentSessionId,
        i18n.language
      );

      // Update UI state
      setCurrentQuestion(nextQuestion);
      setResponse('');
      setImages([]);
      setSelectedMemory(null);
      localStorage.removeItem('memoryId');

      // Handle memory updates based on memory_is_new flag
      if (result.is_memory) {
        if (result.memory_is_new) {
          // If it's a new memory, refresh the entire timeline
          await fetchMemories();
        } else if (result.memory_id) {
          // If it's an update to existing memory, just update that specific memory
          try {
            console.log("Updating memory with id:", result.memory_id)
            const updatedMemory = await MemoryService.getMemory(result.memory_id);

            console.log('Updated memory from API:', updatedMemory);
            
            setMemories(prevMemories => {
              console.log('Previous memories:', prevMemories);
              const newMemories = prevMemories.map(memory => 
                memory.id === result.memory_id ? updatedMemory : memory
              );
              console.log('New memories array:', newMemories);
              return newMemories;
            });
          } catch (err) {
            console.error('Failed to fetch updated memory:', err);
            // Fallback to full refresh if single memory fetch fails
            await fetchMemories();
          }
        }
      }

    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setIsSessionExpired(true);
        return;
      }
      console.error('Error submitting response:', err);
      setError('Failed to submit response');
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleMemorySelect = (memory: Memory) => {
    if (selectedMemory?.id === memory.id) {
      setSelectedMemory(null);
      localStorage.removeItem('memoryId');
    } else {
      setSelectedMemory(memory);
      localStorage.setItem('memoryId', memory.id);
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

                  {/* Session error alert */}
                  {sessionError && (
                    <Alert 
                      severity="error"
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          onClick={initializeSession}
                          disabled={isLoading}
                        >
                          {t('interview.retry')}
                        </Button>
                      }
                    >
                      <AlertTitle>{t('interview.session_error_title')}</AlertTitle>
                      {t('interview.session_error_message')}
                    </Alert>
                  )}

                  {/* Session expired alert */}
                  {isSessionExpired && (
                    <Alert 
                      severity="warning"
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          onClick={initializeSession}
                          disabled={isLoading}
                        >
                          {t('interview.start_new_session')}
                        </Button>
                      }
                    >
                      <AlertTitle>{t('interview.session_expired_title')}</AlertTitle>
                      {t('interview.session_expired_message')}
                    </Alert>
                  )}
                  
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
                      <QuestionIcon 
                        onClick={() => question && handleSpeak(question)}
                        sx={{ 
                        color: 'black', 
                        cursor: 'pointer',
                        fontSize: '20px',
                        // Center the icon within the circle
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }} />
                    </AnimatedMicIcon>
                    <QuestionTypography variant="h6" gutterBottom>
                      {currentQuestion || t('interview.loading_question')}
                    </QuestionTypography>
                  </Box>
    
                  {/* Text Input */}
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={isRecording ? transcript : response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder={isRecording ? t('common.listening') : t('interview.share_memory')}
                    disabled={loading || isRecording}
                    sx={{ 
                      flex: 1,
                      '& .MuiInputBase-root': {
                        backgroundColor: isRecording ? '#fdf2bd' : 'transparent',
                        transition: 'background-color 0.3s ease'
                      }
                    }}
                  />
    
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
                  <Box sx={{  pt: 2 }}>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      {/* End Interview Button */}
                    
                      <Button
                        variant="outlined"
                        onClick={endSession}
                        sx={{ minHeight: '100%' }}
                        startIcon= {<StopIcon />}
                      >
                        {t('interview.end_interview')}
                      </Button>
                     
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || isSubmitting || (!response && !images.length)}
                        endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                      >
                        {t('interview.save_memory')}
                      </Button>
                    </Box>
                  </Box>
                </Stack>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box sx={{ p: 0 }}>
                  {isLoadingSessions ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <SessionList sessions={sessions} language={i18n.language} />
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ m: 0, p: 0 }}>
                  
                   <MemoryTips />
                </Box>
              </TabPanel>
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <SelectedMemoryDisplay 
                  memory={selectedMemory} 
                  onClose={() => {
                    setSelectedMemory(null);
                    localStorage.removeItem('memoryId');
                  }}
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