import React, { useState, useEffect } from 'react';
import {
 Box,
 Container,
 Paper,
 Typography,
 TextField,
 Button,
 CircularProgress,
 IconButton,
 Stack
} from '@mui/material';
import {
 Mic as MicIcon,
 Stop as StopIcon,
 Camera as CameraIcon,
 Send as SendIcon
} from '@mui/icons-material';
import { EmotionalStateIndicator } from '../components/EmotionalStateIndicator';
import { InterviewService } from '../services/interviews';
import { useNavigate } from 'react-router-dom';

const InterviewPage = () => {
 const [loading, setLoading] = useState(false);
 const [recording, setRecording] = useState(false);
 const [response, setResponse] = useState('');
 const [question, setQuestion] = useState('');
 const [sessionId, setSessionId] = useState(null);
 const [emotionalState, setEmotionalState] = useState(null);
 const navigate = useNavigate();

 useEffect(() => {
   startInterview();
 }, []);

 const startInterview = async () => {
   try {
     setLoading(true);
     const result = await InterviewService.startInterview('temp-profile-id'); // Replace with actual profile ID
     setSessionId(result.session_id);
     setQuestion(result.initial_question);
   } catch (error) {
     console.error('Failed to start interview:', error);
   } finally {
     setLoading(false);
   }
 };

 const handleSubmit = async () => {
   if (!response.trim()) return;

   try {
     setLoading(true);
     const result = await InterviewService.submitResponse('temp-profile-id', sessionId, {
       text: response,
       language: 'en' // Replace with actual language from profile
     });

     setEmotionalState(result.sentiment);
     setQuestion(result.follow_up);
     setResponse('');
   } catch (error) {
     console.error('Failed to submit response:', error);
   } finally {
     setLoading(false);
   }
 };

 const toggleRecording = () => {
   setRecording(!recording);
   // Implement audio recording logic
 };

 const handleCapture = () => {
   // Implement photo capture logic
 };

 return (
   <Container maxWidth="md" sx={{ py: 4 }}>
     <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
       <EmotionalStateIndicator emotionalState={emotionalState} />

       <Typography variant="h4" gutterBottom>
         Interview Session
       </Typography>

       {loading ? (
         <Box display="flex" justifyContent="center" p={4}>
           <CircularProgress />
         </Box>
       ) : (
         <Stack spacing={3}>
           <Box>
             <Typography variant="h6" gutterBottom>
               Question:
             </Typography>
             <Typography variant="body1">
               {question || 'Loading question...'}
             </Typography>
           </Box>

           <TextField
             fullWidth
             multiline
             rows={4}
             value={response}
             onChange={(e) => setResponse(e.target.value)}
             placeholder="Share your memory..."
             variant="outlined"
           />

           <Box display="flex" gap={2}>
             <IconButton 
               color={recording ? 'error' : 'primary'}
               onClick={toggleRecording}
             >
               {recording ? <StopIcon /> : <MicIcon />}
             </IconButton>

             <IconButton
               color="primary"
               onClick={handleCapture}
             >
               <CameraIcon />
             </IconButton>

             <Button
               variant="contained"
               endIcon={<SendIcon />}
               onClick={handleSubmit}
               disabled={!response.trim() || loading}
             >
               Submit
             </Button>
           </Box>
         </Stack>
       )}
     </Paper>
   </Container>
 );
};

export default InterviewPage;