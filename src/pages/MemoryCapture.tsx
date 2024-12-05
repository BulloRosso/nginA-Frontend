import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  Fab,
} from '@mui/material';
import {
  Camera as CameraIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';

// Styled components
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
  '@keyframes wave': {
    '0%': { backgroundPosition: '100% 0' },
    '100%': { backgroundPosition: '0 0' },
  },
}));

const MemoryCapture = () => {
  const [mediaMode, setMediaMode] = useState(null); // 'camera' | 'audio' | null
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [images, setImages] = useState([]);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Speech recognition setup
  const recognitionRef = useRef(null);
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
  }

  // File upload handling
  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/jpeg',
    onDrop: useCallback(async (acceptedFiles) => {
      const newImages = await Promise.all(
        acceptedFiles.map(async (file) => {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          return { src: dataUrl, type: 'file' };
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
        setMediaMode('camera');
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImages([...images, { src: dataUrl, type: 'camera' }]);
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

      // Set up speech recognition
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
      console.error('Recording error:', err);
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
      const formData = new FormData();

      // Add text response
      formData.append('response', response);

      // Add images
      images.forEach((image, index) => {
        // Convert data URL to blob for server upload
        if (image.type === 'camera' || image.type === 'file') {
          const blob = dataURLtoBlob(image.src);
          formData.append(`image_${index}`, blob);
        }
      });

      await fetch('/api/memories', {
        method: 'POST',
        body: formData,
      });

      // Reset state
      setResponse('');
      setImages([]);
      setTranscript('');
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  // Utility function to convert data URL to Blob
  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Card>
          <CardContent>
            {/* Text/Speech Input Section */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Share your memory..."
              />
              {transcript && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Transcribing: {transcript}
                </Typography>
              )}
            </Box>

            {/* Media Capture Section */}
            <Box sx={{ mb: 3 }}>
              {mediaMode === 'camera' && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <CameraPreview ref={videoRef} autoPlay />
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      onClick={capturePhoto}
                      startIcon={<CameraIcon />}
                    >
                      Capture
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={stopCamera}
                      sx={{ ml: 1 }}
                    >
                      Close Camera
                    </Button>
                  </Box>
                </Box>
              )}

              {mediaMode === 'audio' && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <AudioWaveform isRecording={isRecording} />
                  <Button
                    variant="contained"
                    color="error"
                    onClick={stopRecording}
                    startIcon={<StopIcon />}
                    sx={{ mt: 1 }}
                  >
                    Stop Recording
                  </Button>
                </Box>
              )}
            </Box>

            {/* Image Gallery */}
            {images.length > 0 && (
              <ImageList sx={{ mb: 3 }} cols={3} rowHeight={164}>
                {images.map((image, index) => (
                  <ImageListItem key={index}>
                    <img src={image.src} alt={`Memory ${index + 1}`} loading="lazy" />
                  </ImageListItem>
                ))}
              </ImageList>
            )}

            {/* Media Controls */}
            <SpeedDial
              ariaLabel="Media capture controls"
              sx={{ position: 'fixed', bottom: 16, right: 16 }}
              icon={<SpeedDialIcon openIcon={<EditIcon />} />}
            >
              <SpeedDialAction
                icon={<CameraIcon />}
                tooltipTitle="Take Photo"
                onClick={startCamera}
              />
              <SpeedDialAction
                icon={<MicIcon />}
                tooltipTitle={isRecording ? "Stop Recording" : "Start Recording"}
                onClick={isRecording ? stopRecording : startRecording}
              />
              <SpeedDialAction
                icon={<PhotoLibraryIcon />}
                tooltipTitle="Upload Photos"
                {...getRootProps()}
              />
            </SpeedDial>

            {/* File Input (hidden) */}
            <input {...getInputProps()} />

            {/* Submit Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!response && !images.length}
              >
                Save Memory
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default MemoryCapture;