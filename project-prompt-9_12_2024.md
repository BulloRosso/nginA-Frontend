# Noblivion - Your experiences are precious
Noblivion is a AI system which helps you capturing your personal or professional experiences during various on-screen interviews. The empathetic AI interviewer guides you through the depths of your memories, captures them, gives them structure and finally ouputs them as a book in PDF format.

## How to get Noblivion?
Noblivion is a gift from children to their parents and the process starts when a person enters the personal data of another person (called the client from here) as profile in the Noblivion React frontend. This profile contains personal information and will help the AI interviewer to get started and to focus on the most relevant facets of the client.

## Process of the interviews
An interview can only start if a profileID (UUIDv4) is selected in the frontend. Then we change to the memory collection process:
* first initiate a new sessionID 
* every client input or ai output will be collected in a session object in the storage
* create an message to the client using AI giving some ideas what memories could be collected in this session
* receive on input item from the client which could be eiter text input multiline, audio recording from direct voice input, uploaded image file or image taken from the camera
* binary input items should be saved in object storage, text items should be stored directly in the session object, audio should be transcribed using openAI API and converted and saved as text item
* the backend extracts information for the knowledge graph using OpenAI entity extraction and appends the information (like relationships to persons, likes and dislikes of the client)
* the backend extracts timeline information using an OpenAI prompts and extends the timeline object with a reference to the input item (so the frontend can later display a link to the memory)
* the backend extracts the sentiment of the current user input by taking the last 4 user inputs as a reference and sends it back to the frontend (the frontend displays it as an icon)
* the backend constructs a reflection on the users input item with OpenAI and sends it back to the frontend (the frontend displays it and reads it as audio produced by a streaming OpenAI text synthesis call)
* the next input item is received until the user presses an "Leave/end interview session" in the frontend

## Capturing of memories of the client 
We want to capture and extract the following data from the interviews and arrange them in a structure.

For each memory which is received from the frontend by the backend it has to be analyzed in the following steps:

1. extract the point in time from the memory text using AI. If no point in time was found use today as timestamp.
2. store the memory with the point in time as formated text or as image resource
3. extract named entities and relationships from the memory text using AI
4. update the knowledge graph with named entities and relationships
5. query the knowledge graph with the first named entity to get information for the follow up question

### timeline
Each memory is assigned to a point in time and and optional location (e. g. "I met Kerstin on 22.02.1971 in Nürnberg, Germany")
### memory
The memory as a formatted text using markdown and optional images
### knowledge graph
The knowledge graph contains all relations between persons, locations, pets, houses/addresses and other entities which happened in the life of the client

## Technical parts of the Noblivion system

### Frontend: React, vite, mui v6 and Typescript
The frontend uses plaing mui v6 styling and is intended to used by non-trained users. Handling instructions and step-by-step guidance should always be provided.

#### App (entry point)
The app looks like this:
-------------------

### src/App.tsx
```
// src/App.tsx
import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MemoryTimeline from './components/common/MemoryTimeline';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';
import ProfileSelection from './pages/ProfileSelection';
import { LanguageSwitch } from './components/common/LanguageSwitch';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Noblivion
              </Typography>
              <LanguageSwitch />
            </Toolbar>
          </AppBar>
  
          <Routes>
            <Route path="/" element={<ProfileSelection />} />
            <Route path="/profile" element={<ProfileSetup />} />
            <Route path="/interview" element={<MemoryCapture />} />
            <Route path="/timeline" element={
              <MemoryTimeline 
                memories={[]}
                onMemorySelect={(memory) => console.log('Selected memory:', memory)}
              />
            } />
          </Routes>
        </Box>
      </BrowserRouter>
    </I18nextProvider>
  );
};

export default App;
```
-------------------

These are the libraries used by the app. Always prefer using an existing library/package to solve a problem rather than adding a new one:
--------------------

### package.json
```
{
  "name": "noblivion-frontend",
  "version": "1.0.0",
  "type": "module",
  "description": "Frontend for the Noblivion memory preservation system.",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    "@material-tailwind/react": "^2.1.10",
    "@mui/icons-material": "^5.15.10",
    "@mui/lab": "^5.0.0-alpha.165",
    "@mui/material": "^5.15.10",
    "@mui/x-date-pickers": "^6.19.4",
    "@supabase/supabase-js": "^2.39.3",
    "axios": "^1.6.7",
    "date-fns": "^2.13.0",
    "i18next": "^23.7.16",
    "i18next-browser-languagedetector": "^7.2.0",
    "i18next-http-backend": "^2.4.2",
    "lodash": "^4.17.21",
    "luxon": "^3.4.4",
    "nprogress": "^0.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.3.5",
    "react-force-graph": "^1.29.3",
    "react-hook-form": "^7.50.1",
    "react-i18next": "^14.0.0",
    "react-markdown": "^9.0.1",
    "react-pdf": "^9.1.1",
    "react-query": "^3.39.3",
    "react-router-dom": "^6.22.1",
    "react-spring": "^9.7.3",
    "react-vertical-timeline-component": "^3.6.0",
    "recharts": "^2.12.0",
    "tailwindcss": "^3.4.16",
    "uuid": "^9.0.1",
    "yup": "^1.3.3",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.15",
    "@types/react-dom": "^18.0.6",
    "@vitejs/plugin-react": "^2.0.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.5",
    "typescript": "^4.7.4",
    "vite": "^3.0.4"
  }
}
```
--------------------

#### Components
These are the components we already have. You can modify them if you like:
--------------------

### src/components/memories/EditMemoryDialog.tsx
```
// src/components/memories/EditMemoryDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography
} from '@mui/material';
import { Memory, Category, Location } from '../../types/memory';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

interface EditMemoryDialogProps {
  open: boolean;
  memory: Memory | null;
  onClose: () => void;
  onSave: (updatedMemory: Partial<Memory>) => Promise<void>;
}

const EditMemoryDialog: React.FC<EditMemoryDialogProps> = ({
  open,
  memory,
  onClose,
  onSave
}) => {
  const [category, setCategory] = React.useState<Category>(Category.CHILDHOOD);
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [location, setLocation] = React.useState<Location>({
    name: '',
    city: '',
    country: '',
    description: ''
  });

  React.useEffect(() => {
    if (memory) {
      setCategory(memory.category);
      setDescription(memory.description);
      setDate(new Date(memory.timePeriod));
      setLocation(memory.location || {
        name: '',
        city: '',
        country: '',
        description: ''
      });
    }
  }, [memory]);

  const handleSave = async () => {
    if (!memory) return;

    try {
      setLoading(true);
      await onSave({
        id: memory.id,
        category,
        description,
        time_period: date?.toISOString(), // Changed from timePeriod to time_period
        location: {
          name: location.name || '',
          city: location.city || '',
          country: location.country || '',
          description: location.description || ''
        }
      });
      onClose();
    } catch (error) {
      console.error('Failed to update memory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Memory</DialogTitle>
      <DialogContent>
        <div className="space-y-4 mt-4">
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {Object.values(Category).map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          <Typography variant="h6" className="mt-4 mb-2">
            Location Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Name"
                value={location.name}
                onChange={(e) => setLocation({ ...location, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Country"
                value={location.country}
                onChange={(e) => setLocation({ ...location, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Description"
                value={location.description}
                onChange={(e) => setLocation({ ...location, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMemoryDialog;
```

### src/components/memories/VerticalTimeline.tsx
```
// src/components/memories/VerticalTimeline.tsx
import React, { useCallback } from 'react';
import { 
  VerticalTimeline, 
  VerticalTimelineElement 
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { Memory } from '../../types/memory';
import {
  School as SchoolIcon,
  Work as WorkIcon,
  FlightTakeoff as TravelIcon,
  Favorite as RelationshipsIcon,
  SportsEsports as HobbiesIcon,
  Pets as PetsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import {
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
} from '@mui/material';
import MemoryService from '../../services/memories';
import { useDropzone } from 'react-dropzone';
import EditMemoryDialog from './EditMemoryDialog';

interface TimelineProps {
  memories: Memory[];
  onMemoryDeleted?: () => void; // Callback to refresh the memories list
}

const categoryConfig = {
  childhood: {
    icon: SchoolIcon,
    color: '#FF9800',
    background: '#FFF3E0'
  },
  career: {
    icon: WorkIcon,
    color: '#2196F3',
    background: '#E3F2FD'
  },
  travel: {
    icon: TravelIcon,
    color: '#4CAF50',
    background: '#E8F5E9'
  },
  relationships: {
    icon: RelationshipsIcon,
    color: '#E91E63',
    background: '#FCE4EC'
  },
  hobbies: {
    icon: HobbiesIcon,
    color: '#9C27B0',
    background: '#F3E5F5'
  },
  pets: {
    icon: PetsIcon,
    color: '#795548',
    background: '#EFEBE9'
  }
};

const MemoryTimeline: React.FC<TimelineProps> = ({ memories, onMemoryDeleted }) => {
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editingMemory, setEditingMemory] = React.useState<Memory | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [selectedMemoryForUpload, setSelectedMemoryForUpload] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedMemoryForUpload) return;

    try {
      setIsUploading(true);
      const urls = await MemoryService.addMediaToMemory(selectedMemoryForUpload, acceptedFiles);

      if (onMemoryDeleted) {
        onMemoryDeleted(); // Refresh the memories list
      }

      setIsUploadDialogOpen(false);
    } catch (err) {
      setError('Failed to upload images');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  }, [selectedMemoryForUpload, onMemoryDeleted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] },
    onDrop
  });

  const handleEditSave = async (updatedMemory: Partial<Memory>) => {
    try {
      await MemoryService.updateMemory(updatedMemory.id!, updatedMemory);
      if (onMemoryDeleted) {
        onMemoryDeleted(); // Refresh the memories list
      }
      setEditingMemory(null);
    } catch (err) {
      setError('Failed to update memory');
      console.error(err);
    }
  };
  
  const handleDelete = async (memoryId: string) => {
    if (!memoryId) return;

    try {
      setIsDeleting(memoryId);
      setError(null);

      await MemoryService.deleteMemory(memoryId);

      // Call the callback to refresh the memories list
      if (onMemoryDeleted) {
        onMemoryDeleted();
      }
    } catch (err) {
      console.error('Error deleting memory:', err);
      setError('Failed to delete memory. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <>
    <VerticalTimeline lineColor="#DDD">
      {memories.map((memory, index) => {
        const category = memory.category.toLowerCase();
        const config = categoryConfig[category] || categoryConfig.childhood;
        const IconComponent = config.icon;
        const isEven = index % 2 === 0;

        return (
          
          <VerticalTimelineElement
            key={memory.id}
            className={isEven ? 'vertical-timeline-element--right' : 'vertical-timeline-element--left'}
            position={isEven ? 'right' : 'left'}
            date={new Date(memory.time_period).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            iconStyle={{ background: config.color, color: '#fff' }}
            icon={<IconComponent />}
            contentStyle={{
              background: config.background,
              borderRadius: '8px',
              paddingTop: '4px',
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
              position: 'relative' // Added for absolute positioning of delete button
            }}
            contentArrowStyle={{ borderRight: `7px solid ${config.background}` }}
          >
            
            <p className="text-gray-600">
              {memory.description}
            </p>
            {memory.location?.name && (
              <p className="text-sm text-gray-500 mt-2">
                📍 {memory.location.name}
              </p>
            )}
            {memory.image_urls && memory.image_urls.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {memory.image_urls.map((url, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={url}
                    alt={`Memory ${imgIndex + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            <div className="absolute bottom-2 right-2 flex space-x-2">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedMemoryForUpload(memory.id);
                  setIsUploadDialogOpen(true);
                }}
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.54)',
                  '&:hover': { color: '#2196F3' }
                }}
              >
                <ImageIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={() => setEditingMemory(memory)}
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.54)',
                  '&:hover': { color: '#4CAF50' }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={() => handleDelete(memory.id)}
                disabled={isDeleting === memory.id}
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.54)',
                  '&:hover': { color: '#f44336' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          </VerticalTimelineElement>
        );
      })}
    </VerticalTimeline>
      {/* Edit Dialog */}
      <EditMemoryDialog
        open={!!editingMemory}
        memory={editingMemory}
        onClose={() => setEditingMemory(null)}
        onSave={handleEditSave}
      />

      {/* Upload Dialog */}
      <Dialog 
        open={isUploadDialogOpen} 
        onClose={() => setIsUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
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
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some images here, or click to select files</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MemoryTimeline;
```

### src/components/profile/ProfileForm.tsx
```
// src/components/profile/ProfileForm.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

export const ProfileForm = () => {
  const navigate = useNavigate();

  const handleSubmit = async (event:any) => {
    event.preventDefault();
    // ... save profile logic ...
    navigate('/interview'); // Add this line
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
      <Button type="submit">Continue to Interview &gt;</Button>
    </form>
  );
};
```

### src/pages/InterviewPage.tsx
```
// src/pages/InterviewPage.tsx
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
```

### src/pages/MemoryCapture.tsx
```
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
```

### src/pages/ProfileSelection.tsx
```
// src/pages/ProfileSelection.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar,
  Button,
  Box,
  CircularProgress,
  Divider
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Profile, calculateAge } from '../types/profile';
import { formatDistance } from 'date-fns';
import { ProfileService } from '../services/profiles';

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

const ProfileSelection: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ProfileService.getAllProfiles();
        setProfiles(data);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError('Failed to load profiles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleProfileSelect = (profileId: string) => {
    localStorage.setItem('profileId', profileId);
    if (onSelect) {
      onSelect(profileId);
    }
    navigate('/interview');
  };

  const handleCreateNew = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Select a Profile
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleCreateNew}
            fullWidth
            sx={{ mb: 3 }}
          >
            Create New Profile
          </Button>

          <Divider sx={{ my: 2 }}>or continue with existing profile</Divider>

          <List sx={{ width: '100%' }}>
            {profiles.map((profile) => (
              <ListItem
                key={profile.id}
                button
                onClick={() => handleProfileSelect(profile.id)}
                sx={{
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={profile.profile_image_url}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      mr: 2,
                      bgcolor: 'primary.main' // Fallback color if image fails to load
                    }}
                  >
                    {!profile.profile_image_url && `${profile.first_name[0]}${profile.last_name[0]}`}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${profile.first_name} ${profile.last_name}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Age: {calculateAge(profile.date_of_birth)}
                      </Typography>
                      {profile.updated_at && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Last interview: {formatDistance(new Date(profile.updated_at), new Date(), { addSuffix: true })}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          {profiles.length === 0 && !error && (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>
              No profiles found. Create a new one to get started.
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfileSelection;
```

### src/pages/ProfileSetup.tsx
```
// src/pages/ProfileSetup.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio,
  Chip,
  Avatar,
  Alert,
  IconButton,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

const ProfileImage = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  margin: '0 auto',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.primary.main}`,
  '&:hover': {
    opacity: 0.8,
  },
}));

const ProfileSetup = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    placeOfBirth: '',
    gender: '',
    children: [],
    spokenLanguages: [],
    profileImage: null,
    imageUrl: null,
  });

  const [errors, setErrors] = useState({});
  const [newChild, setNewChild] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  // Load existing profile if available
  const loadProfile = async () => {
    try {
      const profileId = localStorage.getItem('profileId');
      if (!profileId) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profiles/${profileId}`);
      if (!response.ok) throw new Error('Profile not found');

      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        firstName: data.first_name,
        lastName: data.last_name,
        dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        placeOfBirth: data.place_of_birth,
        gender: data.gender,
        children: data.children || [],
        spokenLanguages: data.spoken_languages || [],
        imageUrl: data.profile_image_url
      }));
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setProfile(prev => ({
          ...prev,
          profileImage: file,
          imageUrl: URL.createObjectURL(file),
        }));
        setErrors(prev => ({ ...prev, profileImage: null }));
      } else {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Please upload an image file',
        }));
      }
    }
  };

  const handleAddChild = () => {
    if (newChild.trim()) {
      setProfile(prev => ({
        ...prev,
        children: [...prev.children, newChild.trim()],
      }));
      setNewChild('');
    }
  };

  const handleRemoveChild = (index) => {
    setProfile(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      setProfile(prev => ({
        ...prev,
        spokenLanguages: [...prev.spokenLanguages, newLanguage.trim()],
      }));
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (index) => {
    setProfile(prev => ({
      ...prev,
      spokenLanguages: prev.spokenLanguages.filter((_, i) => i !== index),
    }));
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profile.firstName) newErrors.firstName = 'First name is required';
    if (!profile.lastName) newErrors.lastName = 'Last name is required';
    if (!profile.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!profile.placeOfBirth) newErrors.placeOfBirth = 'Place of birth is required';
    if (!profile.gender) newErrors.gender = 'Gender is required';
    if (!profile.profileImage) newErrors.profileImage = 'Profile image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validateProfile()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (profile.profileImage) {
        formData.append('profile_image', profile.profileImage);
      }

      const profileData = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        date_of_birth: profile.dateOfBirth?.toISOString().split('T')[0],
        place_of_birth: profile.placeOfBirth,
        gender: profile.gender,
        children: profile.children,
        spoken_languages: profile.spokenLanguages
      };

      formData.append('profile', JSON.stringify(profileData));

      const response = await fetch('https://e5ede652-5081-48eb-9e93-64c13c6bbf50-00-2cmwk7hnytqn6.worf.replit.dev/api/v1/profiles', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save profile');
      }

      const data = await response.json();
      localStorage.setItem('profileId', data.id);
      navigate('/interview');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Person Profile
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 4 }}>
              <input
                accept="image/*"
                id="profile-image-upload"
                type="file"
                onChange={handleImageChange}
                className={Input}
              />
              <label htmlFor="profile-image-upload">
                <ProfileImage
                  src={profile.imageUrl}
                  variant="rounded"
                >
                  {!profile.imageUrl && <PhotoCameraIcon sx={{ width: 40, height: 40 }} />}
                </ProfileImage>
              </label>
              {errors.profileImage && (
                <Typography color="error" variant="caption" display="block" textAlign="center">
                  {errors.profileImage}
                </Typography>
              )}
            </Box>

            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Date of Birth"
                  value={profile.dateOfBirth}
                  onChange={(date) => setProfile(prev => ({ ...prev, dateOfBirth: date }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.dateOfBirth}
                      helperText={errors.dateOfBirth}
                    />
                  )}
                />
                <TextField
                  fullWidth
                  label="Place of Birth"
                  value={profile.placeOfBirth}
                  onChange={(e) => setProfile(prev => ({ ...prev, placeOfBirth: e.target.value }))}
                  error={!!errors.placeOfBirth}
                  helperText={errors.placeOfBirth}
                />
              </Box>

              <FormControl error={!!errors.gender}>
                <FormLabel>Gender</FormLabel>
                <RadioGroup
                  row
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                </RadioGroup>
                {errors.gender && (
                  <Typography color="error" variant="caption">
                    {errors.gender}
                  </Typography>
                )}
              </FormControl>

              <Box>
                <TextField
                  fullWidth
                  label="Add Child"
                  value={newChild}
                  onChange={(e) => setNewChild(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleAddChild} edge="end">
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.children.map((child, index) => (
                    <Chip
                      key={index}
                      label={child}
                      onDelete={() => handleRemoveChild(index)}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Add Spoken Language"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleAddLanguage} edge="end">
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.spokenLanguages.map((language, index) => (
                    <Chip
                      key={index}
                      label={language}
                      onDelete={() => handleRemoveLanguage(index)}
                    />
                  ))}
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                endIcon={<NextIcon />}
              >
                Continue to Interview
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ProfileSetup
```
---------------------

### Services
These are the exitsing frontend services:
--------------

### src/services/api.ts
```
// src/services/api.ts
import axios, { AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://e5ede652-5081-48eb-9e93-64c13c6bbf50-00-2cmwk7hnytqn6.worf.replit.dev';

// Remove /api/v1 from baseURL if it's included there
const cleanBaseURL = baseURL.endsWith('/api/v1') 
  ? baseURL.slice(0, -7) 
  : baseURL;

const api: AxiosInstance = axios.create({
  baseURL: cleanBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Make sure URL starts with /api/v1
    if (config.url && !config.url.startsWith('/api/v1')) {
      config.url = `/api/v1${config.url}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          localStorage.removeItem('token');
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
      }

      // Log the error for debugging
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url
      });
    }
    return Promise.reject(error);
  }
);

export default api;
```

### src/services/interviews.ts
```
// src/services/interviews.ts
import api from './api';
import { Interview, InterviewResponse } from '../types';

export const InterviewService = {
  startInterview: async (profileId: string) => {
    const response = await api.post(`/api/v1/interviews/${profileId}/start`);
    return response.data;
  },

  submitResponse: async (profileId: string, sessionId: string, response: InterviewResponse) => {
    const result = await api.post(`/api/v1/interviews/${profileId}/response`, {
      session_id: sessionId,
      ...response
    });
    return result.data;
  },

  getNextQuestion: async (profileId: string, sessionId: string) => {
    const response = await api.get(`/api/v1/interviews/${profileId}/question`, {
      params: { session_id: sessionId }
    });
    return response.data;
  }
};

export default InterviewService;
```

### src/services/memories.ts
```
// src/services/memories.ts
import { Memory, Category, Location, Person, Emotion } from '../types/memory';
import api from './api';
import { UUID } from '../types/common';

interface MemoryResponse {
  id: UUID;
  profile_id: UUID;
  session_id: UUID;
  category: Category;
  description: string;
  time_period: string;
  location?: Location;
  people: Person[];
  emotions: Emotion[];
  image_urls: string[];
  audio_url?: string;
  created_at: string;
  updated_at: string;
  sentiment_analysis?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    nostalgia: number;
    intensity: number;
  };
}

class MemoryService {
  /**
   * Get all memories for a profile
   */
  static async getMemories(profileId: UUID): Promise<Memory[]> {
    try {
      const response = await api.get<MemoryResponse[]>(`/api/v1/memories/${profileId}`);
      return response.data.map(memory => ({
        ...memory,
        timePeriod: new Date(memory.time_period),
        createdAt: new Date(memory.created_at),
        updatedAt: new Date(memory.updated_at)
      }));
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      throw new Error('Failed to fetch memories');
    }
  }

  /**
   * Create a new memory
   */
  static async createMemory(
    profileId: UUID, 
    sessionId: UUID, 
    memory: MemoryCreate
  ): Promise<Memory> {
    try {
      // Convert the memory data to the format expected by the API
      const memoryData = {
        profile_id: profileId,
        session_id: sessionId,
        category: memory.category,
        description: memory.description,
        time_period: memory.time_period,
        location: memory.location || {
          name: "Unknown",
          city: null,
          country: null,
          description: null
        },
        people: memory.people || [],
        emotions: memory.emotions || [],
        image_urls: memory.image_urls || [],
        audio_url: memory.audio_url || null
      };

      const response = await api.post<MemoryResponse>(
        '/api/v1/memories',
        memoryData,
        {
          params: {
            profile_id: profileId,
            session_id: sessionId
          }
        }
      );

      return {
        ...response.data,
        timePeriod: new Date(response.data.time_period),
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at)
      };
    } catch (error) {
      console.error('Failed to create memory:', error);
      throw new Error('Failed to create memory');
    }
  }

  /**
   * Upload media files (images or audio) for a memory
   */
  static async uploadMedia(formData: FormData): Promise<{ url: string }> {
    try {
      const response = await api.post<{ url: string }>(
        '/api/v1/memories/media',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw new Error('Failed to upload media');
    }
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(memoryId: UUID): Promise<void> {
    try {
      await api.delete(`/memories/${memoryId}`);
    } catch (error) {
      console.error('Failed to delete memory:', error);
      throw new Error('Failed to delete memory');
    }
  }

  /**
   * Update an existing memory
   */
  static async updateMemory(
    memoryId: UUID,
    updates: Partial<MemoryCreate>
  ): Promise<Memory> {
    try {
      const response = await api.put<MemoryResponse>(
        `/api/v1/memories/${memoryId}`,
        updates
      );

      return {
        ...response.data,
        timePeriod: new Date(response.data.time_period),
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at)
      };
    } catch (error) {
      console.error('Failed to update memory:', error);
      throw new Error('Failed to update memory');
    }
  }

  /**
   * Add media files to an existing memory
   */
  static async addMediaToMemory(
    memoryId: UUID,
    files: File[]
  ): Promise<string[]> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post<{ urls: string[] }>(
        `/api/v1/memories/${memoryId}/media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.urls;
    } catch (error) {
      console.error('Failed to add media to memory:', error);
      throw new Error('Failed to add media to memory');
    }
  }

  /**
   * Export memories to PDF
   */
  static async exportToPDF(profileId: UUID): Promise<string> {
    try {
      const response = await api.post<{ url: string }>(
        '/api/v1/memories/export-pdf',
        { profile_id: profileId }
      );
      return response.data.url;
    } catch (error) {
      console.error('Failed to export memories to PDF:', error);
      throw new Error('Failed to export memories to PDF');
    }
  }

  /**
   * Get memories by category
   */
  static async getMemoriesByCategory(
    profileId: UUID,
    category: Category
  ): Promise<Memory[]> {
    try {
      const memories = await this.getMemories(profileId);
      return memories.filter(memory => memory.category === category);
    } catch (error) {
      console.error('Failed to fetch memories by category:', error);
      throw new Error('Failed to fetch memories by category');
    }
  }

  /**
   * Get memories by date range
   */
  static async getMemoriesByDateRange(
    profileId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<Memory[]> {
    try {
      const memories = await this.getMemories(profileId);
      return memories.filter(memory => 
        memory.timePeriod >= startDate && memory.timePeriod <= endDate
      );
    } catch (error) {
      console.error('Failed to fetch memories by date range:', error);
      throw new Error('Failed to fetch memories by date range');
    }
  }
}

export default MemoryService;
```

### src/services/profiles.ts
```
// src/services/profiles.ts
import api from './api';
import { Profile } from '../types/profile';

export const ProfileService = {
  getAllProfiles: async (): Promise<Profile[]> => {
    const response = await api.get('/profiles');  // No need to add /api/v1 here
    return response.data;
  },

  createProfile: async (profileData: FormData): Promise<Profile> => {
    const response = await api.post('/profiles', profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProfile: async (profileId: string): Promise<Profile> => {
    const response = await api.get(`/profiles/${profileId}`);
    return response.data;
  },

  updateProfile: async (profileId: string, profileData: FormData): Promise<Profile> => {
    const response = await api.put(`/profiles/${profileId}`, profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProfile: async (profileId: string): Promise<void> => {
    await api.delete(`/profiles/${profileId}`);
  }
};

export default ProfileService;
```
--------------

#### Types
These are the types which we use. They must be always in sync with the Python models in the Backend. If you want to add something always change the Python model
first and then the type definition in the frontend project:
------------------------
{frontend_types}
------------------------

#### Multi-language setup/i18n
You should not insert labels as plain text but always use the react-i18n-library:
---------------------
{frontend_i18n}
---------------------

### Backend: Python, FastAPI and Pydantic, neo4j knowledge graph
The backend exposes several API endpoints. Internally it uses models to maintain models.
These are the models:
----------------------

### models/memory.py
```
# models/memory.py
from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import List, Optional, Dict
from enum import Enum

class Category(str, Enum):
    CHILDHOOD = "childhood"
    CAREER = "career"
    TRAVEL = "travel"
    RELATIONSHIPS = "relationships"
    HOBBIES = "hobbies"
    PETS = "pets"

    @classmethod
    def _missing_(cls, value):
        """Handle case when enum value has 'Category.' prefix"""
        if isinstance(value, str):
            # Remove 'Category.' prefix if it exists
            clean_value = value.replace('Category.', '').lower()
            for member in cls:
                if member.value.lower() == clean_value:
                    return member
        return None

class Person(BaseModel):
    name: str
    relation: str
    age_at_time: Optional[int]

class Location(BaseModel):
    name: str
    city: Optional[str]
    country: Optional[str]
    description: Optional[str]

class Emotion(BaseModel):
    type: str
    intensity: float
    description: Optional[str]

class MemoryCreate(BaseModel):
    category: Category
    description: str
    time_period: datetime
    location: Optional[Location]
    people: List[Person] = []
    emotions: List[Emotion] = []
    image_urls: List[str] = []
    audio_url: Optional[str]

class MemoryUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    time_period: Optional[datetime] = None
    location: Optional[dict] = None
    people: Optional[List[dict]] = None
    emotions: Optional[List[dict]] = None
    image_urls: Optional[List[str]] = None
    audio_url: Optional[str] = None

class Memory(MemoryCreate):
    id: UUID4
    profile_id: UUID4
    session_id: UUID4
    created_at: datetime
    updated_at: datetime
    sentiment_analysis: Optional[Dict]

class InterviewResponse(BaseModel):
    text: str
    language: str
    audio_url: Optional[str]
    emotions_detected: Optional[List[Emotion]]

class InterviewQuestion(BaseModel):
    text: str
    context: Optional[str]
    suggested_topics: List[str] = []
    requires_media: bool = False
```

### models/profile.py
```
# models/profile.py
from pydantic import BaseModel, UUID4, EmailStr
from datetime import date, datetime
from typing import List, Optional

class ProfileCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    place_of_birth: str
    gender: str
    children: List[str] = []
    spoken_languages: List[str] = []
    profile_image_url: Optional[str]

class Profile(ProfileCreate):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    @property
    def age(self) -> int:
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

class Achievement(BaseModel):
    id: str
    type: str
    title: dict  # Multilingual
    description: dict  # Multilingual
    icon: str
    color: str
    required_count: int
    unlocked_at: Optional[datetime]

class AchievementProgress(BaseModel):
    profile_id: UUID4
    achievement_id: str
    current_count: int
    completed: bool
    unlocked_at: Optional[datetime]
```
----------------------
These are the endpoints:
----------------------

### api/v1/__init__.py
```
# api/v1/__init__.py
from fastapi import APIRouter
from .interviews import router as interviews_router
from .memories import router as memories_router
from .achievements import router as achievements_router
from .profiles import router as profiles_router

router = APIRouter(prefix="/v1")
router.include_router(interviews_router)
router.include_router(memories_router)
router.include_router(achievements_router)
router.include_router(profiles_router)
```

### api/v1/achievements.py
```
# api/v1/achievements.py
from fastapi import APIRouter
from uuid import UUID
from services.achievements import AchievementService

router = APIRouter(prefix="/achievements", tags=["achievements"])

@router.get("/{profile_id}")
async def get_achievements(profile_id: UUID, language: str = 'en'):
    service = AchievementService()
    return await service.get_profile_achievements(profile_id, language)

@router.post("/check")
async def check_achievements(profile_id: UUID):
    service = AchievementService()
    unlocked = await service.check_achievements(profile_id)
    return {"unlocked_achievements": unlocked}
```

### api/v1/interviews.py
```
# api/v1/interviews.py
from fastapi import APIRouter, HTTPException
from typing import Optional
from uuid import UUID
from services.sentiment import EmpatheticInterviewer
from models.memory import InterviewResponse, InterviewQuestion
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["interviews"])

@router.post("/{profile_id}/start")
async def start_interview(profile_id: UUID):
    interviewer = EmpatheticInterviewer()
    return await interviewer.start_new_session(profile_id)

@router.post("/{profile_id}/response")
async def process_response(
    profile_id: UUID,
    response: InterviewResponse,
    session_id: UUID
):
    interviewer = EmpatheticInterviewer()
    return await interviewer.process_interview_response(
        profile_id,
        session_id,
        response.text,
        response.language
    )

@router.get("/{profile_id}/question")
async def get_next_question(
    profile_id: UUID,
    session_id: UUID
):
    """Get the next interview question based on the session context."""
    try:
        interviewer = EmpatheticInterviewer()
        result = await interviewer.generate_next_question(profile_id, session_id)
        return {
            "text": result,
            "suggested_topics": [],  # Optional: Could be generated based on previous responses
            "requires_media": False  # Optional: Could be set based on question context
        }
    except Exception as e:
        logger.error(f"Error generating next question: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate next question"
        )
```

### api/v1/memories.py
```
# api/v1/memories.py
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from typing import List
from uuid import UUID
from models.memory import Memory, MemoryCreate, MemoryUpdate
from services.memory import MemoryService
import logging
import traceback
from pydantic import BaseModel
from datetime import datetime
import io

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/memories", tags=["memories"])

@router.put("/{memory_id}")
async def update_memory(memory_id: UUID, memory: MemoryUpdate):
    """Update a memory by ID"""
    try:
        logger.debug(f"Received update request for memory_id={memory_id}")
        logger.debug(f"Update data: {memory.dict(exclude_unset=True)}")

        # Only include fields that were actually provided in the update
        update_data = memory.dict(exclude_unset=True)

        # Ensure category is properly formatted if provided
        if 'category' in update_data and isinstance(update_data['category'], str):
            update_data['category'] = update_data['category'].replace('Category.', '')

        # Convert time_period to ISO format if provided
        if 'time_period' in update_data and isinstance(update_data['time_period'], datetime):
            update_data['time_period'] = update_data['time_period'].isoformat()

        result = await MemoryService.update_memory(memory_id, update_data)

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Memory not found"
            )

        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating memory: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update memory: {str(e)}"
        )

@router.get("/{profile_id}")
async def get_memories_by_profile(profile_id: UUID) -> List[Memory]:
    """Get all memories for a specific profile"""
    try:
        logger.debug(f"Fetching memories for profile_id={profile_id}")

        memory_service = MemoryService.get_instance()
        result = memory_service.supabase.table("memories").select("*").eq(
            "profile_id", str(profile_id)
        ).order('created_at', desc=True).execute()

        if not result.data:
            return []

        # Convert string category to enum value
        memories = []
        for memory_data in result.data:
            # Remove 'Category.' prefix if it exists
            if isinstance(memory_data.get('category'), str):
                memory_data['category'] = memory_data['category'].replace('Category.', '')
            try:
                memories.append(Memory(**memory_data))
            except Exception as e:
                logger.error(f"Error converting memory data: {str(e)}")
                logger.error(f"Problematic memory data: {memory_data}")
                continue

        return memories

    except Exception as e:
        logger.error(f"Error fetching memories: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch memories: {str(e)}"
        )

@router.post("")
async def create_memory(
    request: Request,
    memory: MemoryCreate,
    profile_id: UUID,
    session_id: UUID
):
    try:
        logger.debug(f"Received create memory request for profile_id={profile_id}, session_id={session_id}")
        logger.debug(f"Memory data: {memory.dict()}")

        # Verify the session exists first
        session_exists = await MemoryService.verify_session(session_id, profile_id)
        if not session_exists:
            logger.warning(f"Session not found: profile_id={profile_id}, session_id={session_id}")
            raise HTTPException(
                status_code=404,
                detail="Interview session not found or doesn't belong to this profile"
            )

        # Log the request body for debugging
        body = await request.json()
        logger.debug(f"Request body: {body}")

        result = await MemoryService.create_memory(memory, profile_id, session_id)
        logger.debug(f"Memory created successfully: {result}")
        return result
    except HTTPException as he:
        logger.error(f"HTTP Exception: {str(he)}")
        raise
    except Exception as e:
        logger.error(f"Error creating memory: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error creating memory: {str(e)}"
        )

@router.delete("/{memory_id}")
async def delete_memory(memory_id: UUID):
    """Delete a memory by ID"""
    try:
        logger.debug(f"Received delete request for memory_id={memory_id}")

        deleted = await MemoryService.delete_memory(memory_id)

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Memory not found"
            )

        return {"status": "success", "message": "Memory deleted successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting memory: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete memory: {str(e)}"
        )

@router.post("/{memory_id}/media")
async def add_media_to_memory(
    memory_id: UUID,
    files: List[UploadFile] = File(...),
):
    """Add media files to a memory"""
    try:
        logger.debug(f"Received media upload request for memory_id={memory_id}")
        logger.debug(f"Number of files: {len(files)}")

        # Read and validate each file
        file_contents = []
        content_types = []

        for file in files:
            content_type = file.content_type
            if not content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} is not an image"
                )

            content = await file.read()
            file_contents.append(content)
            content_types.append(content_type)

        # Process the files
        result = await MemoryService.add_media_to_memory(
            memory_id=memory_id,
            files=file_contents,
            content_types=content_types
        )

        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error adding media: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add media: {str(e)}"
        )
```

### api/v1/profiles.py
```
# api/v1/profiles.py
from fastapi import APIRouter, HTTPException, File, Form, Request, UploadFile
from typing import Optional
from uuid import UUID
import json
import os
from datetime import datetime, date
import traceback
from models.profile import Profile, ProfileCreate
from supabase import create_client
import asyncio
from services.profile import ProfileService
from io import BytesIO
from typing import List
from models.profile import Profile
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profiles", tags=["profiles"])

# Initialize Supabase client
supabase = create_client(
    supabase_url = os.getenv("SUPABASE_URL"),
    supabase_key = os.getenv("SUPABASE_KEY")
)

@router.get("")
async def list_profiles() -> List[Profile]:
    """Get all profiles"""
    try:
        profiles = await ProfileService.get_all_profiles()
        return profiles
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch profiles: {str(e)}")

@router.post("")
async def create_profile(
  profile_image: UploadFile = File(...),
  profile: str = Form(...)
):
  try:
      profile_data = json.loads(profile)
      # print("Profile data before creation:", profile_data)  # Debug print
      first_name = profile_data.get("first_name")
      last_name = profile_data.get("last_name")
      profile_data["date_of_birth"] = datetime.strptime(profile_data["date_of_birth"], "%Y-%m-%d").date()

      if not first_name or not last_name:
          raise ValueError("Both first_name and last_name are required.")

      file_path = f"profile_images/{first_name}_{last_name}.jpg"
      file_content = await profile_image.read()

      try:
          supabase.storage.from_("profile-images").remove([file_path])
      except:
          pass

      result = supabase.storage.from_("profile-images").upload(
          path=file_path,
          file=file_content,
          file_options={"content-type": profile_image.content_type}
      )

      image_url = supabase.storage.from_("profile-images").get_public_url(file_path)
      profile_data["profile_image_url"] = image_url

      profile_create = ProfileCreate(**profile_data)
      return await ProfileService.create_profile(profile_create)

  except Exception as e:
      tb = traceback.extract_tb(e.__traceback__)[-1]
      error_info = f"Error in {tb.filename}, line {tb.lineno}: {str(e)}"
      print(f"Validation error: {error_info}")
      raise HTTPException(
          status_code=500, 
          detail=f"Error processing profile: {error_info}"
      )

@router.get("/{profile_id}")
async def get_profile(profile_id: UUID):
    """Get a profile by ID"""
    try:
        logger.debug(f"Fetching profile with ID: {profile_id}")
        service = ProfileService()  # Create instance
        profile = await service.get_profile(profile_id)  # Call instance method

        if not profile:
            logger.debug(f"Profile not found: {profile_id}")
            raise HTTPException(status_code=404, detail="Profile not found")

        return profile
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
```
----------------------
When you change existing endpoints give a clear notice.

These are the exitsing backend services:
--------------

### services/__init__.py
```
# services/__init__.py
from .interviewer import MemoryInterviewer
from .sentiment import EmpatheticInterviewer
from .achievements import AchievementService
from .pdfgenerator import PDFGenerator
```

### services/achievements.py
```
# services/achievements.py
from typing import List
from uuid import UUID
from datetime import datetime
from models.profile import Achievement, AchievementProgress

class AchievementService:
    async def check_achievements(self, profile_id: UUID) -> List[Achievement]:
        try:
            stats = await self._get_profile_stats(profile_id)
            current_achievements = await self._get_current_achievements(profile_id)
            unlocked = []

            for achievement in self.ACHIEVEMENTS:
                if achievement.id not in current_achievements and \
                   await self._check_achievement_criteria(achievement, stats):
                    await self._unlock_achievement(profile_id, achievement.id)
                    unlocked.append(achievement)

            return unlocked
        except Exception as e:
            raise ValueError(f"Achievement check failed: {str(e)}")

    async def get_profile_achievements(
        self,
        profile_id: UUID,
        language: str = 'en'
    ) -> List[dict]:
        try:
            achievements = await self._get_all_achievements()
            progress = await self._get_achievement_progress(profile_id)

            return [
                {
                    **achievement.dict(),
                    'title': achievement.title[language],
                    'description': achievement.description[language],
                    'progress': progress.get(achievement.id, 0)
                }
                for achievement in achievements
            ]
        except Exception as e:
            raise ValueError(f"Failed to get achievements: {str(e)}")

    # Helper methods to be implemented
    async def _get_profile_stats(self, profile_id: UUID):
        pass

    async def _get_current_achievements(self, profile_id: UUID):
        pass

    async def _check_achievement_criteria(self, achievement: Achievement, stats: dict):
        pass

    async def _unlock_achievement(self, profile_id: UUID, achievement_id: str):
        pass
```

### services/memory.py
```
# services/memory.py
from typing import Optional, List
from uuid import UUID
from models.memory import MemoryCreate
from supabase import create_client, Client
import os
from datetime import datetime
import logging
import traceback
import io
from PIL import Image
import uuid

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class MemoryService:
    table_name = "memories"
    storage_bucket = "memory-media"

    def __init__(self):
        logger.debug("Initializing MemoryService")
        self.supabase = create_client(
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY")
        )
    @classmethod
    async def delete_memory(cls, memory_id: UUID) -> bool:
        """Delete a memory by ID"""
        try:
            logger.debug(f"Attempting to delete memory with ID: {memory_id}")
            instance = cls.get_instance()

            # Delete the memory from Supabase
            result = instance.supabase.table(cls.table_name).delete().eq(
                "id", str(memory_id)
            ).execute()

            logger.debug(f"Delete response: {result}")

            # Check if deletion was successful
            if not result.data:
                logger.warning(f"No memory found with ID {memory_id}")
                return False

            return True

        except Exception as e:
            logger.error(f"Error deleting memory: {str(e)}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to delete memory: {str(e)}")

    @classmethod
    async def update_memory(cls, memory_id: UUID, memory_data: dict) -> bool:
        """Update a memory by ID"""
        try:
            logger.debug(f"Attempting to update memory with ID: {memory_id}")
            logger.debug(f"Update data: {memory_data}")

            instance = cls.get_instance()

            # Handle time_period field name conversion
            if "time_period" in memory_data:
                time_period = memory_data["time_period"]
                # Ensure it's in ISO format if it's not already
                if isinstance(time_period, datetime):
                    time_period = time_period.isoformat()
                memory_data["time_period"] = time_period

            # Add updated_at timestamp
            update_data = {
                **memory_data,
                "updated_at": datetime.utcnow().isoformat()
            }

            # Update the memory in Supabase
            result = instance.supabase.table(cls.table_name)\
                .update(update_data)\
                .eq("id", str(memory_id))\
                .execute()

            logger.debug(f"Update response: {result}")

            # Check if update was successful
            if not result.data:
                logger.warning(f"No memory found with ID {memory_id}")
                return False

            return result.data[0]

        except Exception as e:
            logger.error(f"Error updating memory: {str(e)}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to update memory: {str(e)}")

    @staticmethod
    def get_instance():
        if not hasattr(MemoryService, "_instance"):
            MemoryService._instance = MemoryService()
        return MemoryService._instance

    @classmethod
    async def verify_session(cls, session_id: UUID, profile_id: UUID) -> bool:
        """Verify that the session exists and belongs to the profile"""
        try:
            logger.debug(f"Verifying session for profile_id={profile_id}, session_id={session_id}")
            instance = cls.get_instance()
            result = instance.supabase.table("interview_sessions").select("*").eq(
                "id", str(session_id)
            ).eq(
                "profile_id", str(profile_id)
            ).execute()

            session_exists = len(result.data) > 0
            logger.debug(f"Session verification result: {session_exists}")
            return session_exists
        except Exception as e:
            logger.error(f"Error verifying session: {str(e)}")
            logger.error(traceback.format_exc())
            return False

    @classmethod
    async def create_memory(cls, memory: MemoryCreate, profile_id: UUID, session_id: UUID):
        """Create a new memory"""
        try:
            logger.debug(f"Creating memory for profile_id={profile_id}, session_id={session_id}")
            logger.debug(f"Memory data: {memory.dict()}")

            instance = cls.get_instance()
            now = datetime.utcnow().isoformat()

            # Log the memory object to see what we're working with
            logger.debug(f"Memory object: {memory}")

            # Create the data dictionary with full error handling
            try:
                data = {
                    "profile_id": str(profile_id),
                    "session_id": str(session_id),
                    "category": str(memory.category),
                    "description": str(memory.description),
                    "time_period": datetime.now().isoformat(),  # Use current time if time_period is causing issues
                    "emotions": [],  # Start with empty arrays if these are causing issues
                    "people": [],
                    "image_urls": [],
                    "created_at": now,
                    "updated_at": now
                }

                # Add optional fields with validation
                if hasattr(memory, 'location') and memory.location:
                    data["location"] = memory.location.dict() if hasattr(memory.location, 'dict') else None

                if hasattr(memory, 'emotions') and memory.emotions:
                    data["emotions"] = [emotion.dict() for emotion in memory.emotions] if all(hasattr(e, 'dict') for e in memory.emotions) else []

                if hasattr(memory, 'people') and memory.people:
                    data["people"] = [person.dict() for person in memory.people] if all(hasattr(p, 'dict') for p in memory.people) else []

                if hasattr(memory, 'image_urls') and memory.image_urls:
                    data["image_urls"] = memory.image_urls

                if hasattr(memory, 'audio_url') and memory.audio_url:
                    data["audio_url"] = memory.audio_url

                logger.debug(f"Prepared data for insert: {data}")
            except Exception as e:
                logger.error(f"Error preparing memory data: {str(e)}")
                logger.error(traceback.format_exc())
                raise Exception(f"Error preparing memory data: {str(e)}")

            # Insert into database with error logging
            try:
                response = instance.supabase.table(cls.table_name).insert(data).execute()
                logger.debug(f"Supabase response: {response}")

                if not response.data:
                    raise Exception("No data returned from memory creation")

                return response.data[0]
            except Exception as e:
                logger.error(f"Error inserting into database: {str(e)}")
                logger.error(traceback.format_exc())
                raise

        except Exception as e:
            logger.error(f"Error in create_memory: {str(e)}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to create memory: {str(e)}")

    @classmethod
    async def add_media_to_memory(cls, memory_id: UUID, files: List[bytes], content_types: List[str]) -> dict:
        """Add media files to a memory and return the URLs"""
        try:
            logger.debug(f"Adding media to memory {memory_id}")
            instance = cls.get_instance()

            # Verify memory exists
            memory = instance.supabase.table(cls.table_name)\
                .select("image_urls")\
                .eq("id", str(memory_id))\
                .execute()

            if not memory.data:
                raise Exception("Memory not found")

            current_urls = memory.data[0].get('image_urls', [])
            new_urls = []

            for idx, (file_content, content_type) in enumerate(zip(files, content_types)):
                try:
                    # Generate unique filename
                    file_ext = "jpg" if "jpeg" in content_type.lower() else "png"
                    filename = f"{memory_id}/{uuid.uuid4()}.{file_ext}"

                    # Upload to Supabase Storage
                    result = instance.supabase.storage\
                        .from_(cls.storage_bucket)\
                        .upload(
                            path=filename,
                            file=file_content,
                            file_options={"content-type": content_type}
                        )

                    if hasattr(result, 'error') and result.error:
                        raise Exception(f"Upload error: {result.error}")

                    # Get public URL
                    url = instance.supabase.storage\
                        .from_(cls.storage_bucket)\
                        .get_public_url(filename)

                    new_urls.append(url)

                except Exception as e:
                    logger.error(f"Error uploading file {idx}: {str(e)}")
                    continue

            # Update memory with new URLs
            updated_urls = current_urls + new_urls
            update_result = instance.supabase.table(cls.table_name)\
                .update({"image_urls": updated_urls})\
                .eq("id", str(memory_id))\
                .execute()

            return {
                "message": "Media added successfully",
                "urls": new_urls,
                "total_urls": len(updated_urls)
            }

        except Exception as e:
            logger.error(f"Error adding media: {str(e)}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to add media: {str(e)}")
```

### services/sentiment.py
```
# services/sentiment.py
from uuid import UUID, uuid4
from datetime import datetime
from models.memory import InterviewQuestion
import openai
import os
from typing import Dict, Any
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

class EmpatheticInterviewer:
    def __init__(self):
        self.openai_client = openai.Client(api_key=os.getenv("OPENAI_API_KEY"))
        self.supabase = create_client(
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY")
        )

    async def start_new_session(self, profile_id: UUID) -> Dict[str, Any]:
        """
        Start a new interview session for a profile.
        Returns initial question and session details.
        """
        try:
            # Generate an empathetic opening question using OpenAI
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an empathetic interviewer helping people preserve their memories. Generate a warm, inviting opening question that encourages sharing personal memories."
                    },
                    {
                        "role": "user",
                        "content": "Generate an opening question for a memory preservation interview."
                    }
                ],
                max_tokens=100
            )

            initial_question = response.choices[0].message.content
            session_id = uuid4()
            now = datetime.utcnow()

            # Create the session record in Supabase
            session_data = {
                "id": str(session_id),
                "profile_id": str(profile_id),
                "category": "general",
                "started_at": now.isoformat(),
                "emotional_state": {"initial": "neutral"},
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }

            logger.debug(f"Creating session with data: {session_data}")

            # Insert the session into Supabase
            result = self.supabase.table("interview_sessions").insert(
                session_data
            ).execute()

            logger.debug(f"Session creation result: {result}")

            if not result.data:
                raise Exception("Failed to create interview session record")

            return {
                "session_id": str(session_id),
                "initial_question": initial_question or "Tell me about a memorable moment from your life.",
                "started_at": now.isoformat(),
                "profile_id": str(profile_id)
            }

        except Exception as e:
            logger.error(f"Error starting interview session: {str(e)}")
            raise Exception(f"Failed to start interview session: {str(e)}")

    async def process_interview_response(
        self,
        profile_id: UUID,
        session_id: UUID,
        response_text: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Process a response from the interviewee and generate the next question.
        """
        try:
            # Analyze sentiment
            sentiment = await self._analyze_sentiment(response_text)

            # Generate follow-up question based on the response
            next_question = await self._generate_follow_up_question(response_text, language)

            return {
                "sentiment": sentiment,
                "follow_up": next_question
            }

        except Exception as e:
            print(f"Error processing interview response: {str(e)}")
            return {
                "sentiment": {"joy": 0.5, "nostalgia": 0.5},
                "follow_up": "Can you tell me more about that?"
            }

    async def _analyze_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze the emotional content of the response.
        """
        try:
            response = self.openai_client.chat.completions.create(  # Remove await
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "Analyze the emotional content of this memory and return scores from 0 to 1 for: joy, sadness, nostalgia, and intensity."
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                max_tokens=100
            )

            # Parse the response to extract sentiment scores
            sentiment = {
                "joy": 0.5,
                "sadness": 0.0,
                "nostalgia": 0.5,
                "intensity": 0.5
            }

            return sentiment

        except Exception as e:
            print(f"Error analyzing sentiment: {str(e)}")
            return {
                "joy": 0.5,
                "sadness": 0.0,
                "nostalgia": 0.5,
                "intensity": 0.5
            }

    async def generate_next_question(self, profile_id: UUID, session_id: UUID) -> str:
        """Generate the next question based on previous responses in the session."""
        try:
            # Get previous responses from this session
            previous_responses = self.supabase.table("memories").select(
                "description"
            ).eq(
                "session_id", str(session_id)
            ).order(
                "created_at", desc=True
            ).limit(3).execute()

            context = ""
            if previous_responses.data:
                context = "Previous responses: " + " ".join(
                    [r["description"] for r in previous_responses.data]
                )

            # Generate follow-up question using OpenAI
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an empathetic interviewer helping people preserve their 
                        memories. Generate a follow-up question that encourages deeper sharing and 
                        reflection. Focus on details, emotions, and sensory experiences."""
                    },
                    {
                        "role": "user",
                        "content": f"Given this context: {context}\nGenerate an engaging follow-up question."
                    }
                ],
                max_tokens=100
            )

            next_question = response.choices[0].message.content
            return next_question or "Can you tell me more about that experience? What details stand out in your memory?"

        except Exception as e:
            logger.error(f"Error generating next question: {str(e)}")
            return "What other memories would you like to share today?"
```

### services/profile.py
```
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, UUID4
from supabase import create_client, Client
import os
import logging
from models.profile import Profile, ProfileCreate

logger = logging.getLogger(__name__)

# Service Class
class ProfileService:
    table_name = "profiles"

    def __init__(self):
        self.supabase = create_client(
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY")
        )
        self.table_name = "profiles"

    @classmethod
    async def get_all_profiles(cls) -> List[Profile]:
        """Get all profiles"""
        try:
            service = cls()
            result = service.supabase.table(service.table_name).select("*").order(
                'updated_at', desc=True
            ).execute()

            profiles = []
            for profile_data in result.data:
                try:
                    # Convert date strings
                    if isinstance(profile_data['date_of_birth'], str):
                        profile_data['date_of_birth'] = datetime.fromisoformat(
                            profile_data['date_of_birth']
                        ).date()

                    if isinstance(profile_data['created_at'], str):
                        profile_data['created_at'] = datetime.fromisoformat(
                            profile_data['created_at']
                        )

                    if isinstance(profile_data['updated_at'], str):
                        profile_data['updated_at'] = datetime.fromisoformat(
                            profile_data['updated_at']
                        )

                    profiles.append(Profile(**profile_data))
                except Exception as e:
                    logger.error(f"Error converting profile data: {str(e)}")
                    logger.error(f"Problematic profile data: {profile_data}")
                    continue

            return profiles

        except Exception as e:
            logger.error(f"Error fetching all profiles: {str(e)}")
            raise

    @staticmethod
    async def create_profile(profile_data: ProfileCreate) -> Profile:
        """
        Creates a new profile in the Supabase table.
        """
        try:
            # Convert profile data to dict
            data = {
                "first_name": profile_data.first_name,
                "last_name": profile_data.last_name,
                "date_of_birth": profile_data.date_of_birth.isoformat(),
                "place_of_birth": profile_data.place_of_birth,
                "gender": profile_data.gender,
                "children": profile_data.children,
                "spoken_languages": profile_data.spoken_languages,
                "profile_image_url": profile_data.profile_image_url
            }

            # Insert data into Supabase
            response = supabase.table(ProfileService.table_name).insert(data).execute()

            if hasattr(response, 'error') and response.error:
                raise Exception(f"Supabase error: {response.error}")

            result_data = response.data[0] if response.data else None
            if not result_data:
                raise Exception("No data returned from Supabase")

            return Profile(**result_data)
        except Exception as e:
            raise Exception(f"Failed to create profile: {str(e)}")

    async def get_profile(self, profile_id: UUID4) -> Optional[Profile]:
        """Retrieves a profile by ID"""
        try:
            logger.debug(f"Fetching profile with ID: {profile_id}")

            # Fetch the profile from Supabase
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq("id", str(profile_id))\
                .execute()

            if not result.data:
                return None

            profile_data = result.data[0]

            # Convert date strings to proper date objects
            if isinstance(profile_data['date_of_birth'], str):
                profile_data['date_of_birth'] = datetime.fromisoformat(
                    profile_data['date_of_birth']
                ).date()

            if isinstance(profile_data['created_at'], str):
                profile_data['created_at'] = datetime.fromisoformat(
                    profile_data['created_at']
                )

            if isinstance(profile_data['updated_at'], str):
                profile_data['updated_at'] = datetime.fromisoformat(
                    profile_data['updated_at']
                )

            return Profile(**profile_data)

        except Exception as e:
            logger.error(f"Error in get_profile: {str(e)}")
            logger.error(f"Profile ID: {profile_id}")
            logger.error(f"Profile data: {profile_data if 'profile_data' in locals() else 'No data fetched'}")
            raise


    @staticmethod
    async def update_profile(profile_id: UUID4, profile_data: ProfileCreate) -> Profile:
        """
        Updates an existing profile by ID.
        """
        try:
            # Update data in Supabase
            response = supabase.table(ProfileService.table_name).update(profile_data.dict()).eq("id", str(profile_id)).execute()

            # Check for errors
            if response.get("error"):
                raise Exception(f"Supabase error: {response['error']['message']}")

            if response["data"]:
                profile = Profile(**response["data"][0])
                return profile
            raise Exception("Profile not found")
        except Exception as e:
            raise Exception(f"Failed to update profile: {str(e)}")

    @staticmethod
    async def delete_profile(profile_id: UUID4) -> bool:
        """
        Deletes a profile by ID.
        """
        try:
            # Delete the profile from Supabase
            response = supabase.table(ProfileService.table_name).delete().eq("id", str(profile_id)).execute()

            # Check for errors
            if response.get("error"):
                raise Exception(f"Supabase error: {response['error']['message']}")

            # Return True if deletion was successful
            return response["data"] is not None
        except Exception as e:
            raise Exception(f"Failed to delete profile: {str(e)}")
```
--------------

This is the configuration of FASTAPI:
------------

### main.py
```
# /main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api.v1 import router as v1_router
from supabase import create_client
from dotenv import load_dotenv
import logging
import os
import logging


logger = logging.getLogger()  # Root logger
logger.setLevel(logging.INFO)  # Set the logging level

# Create a file handler
file_handler = logging.FileHandler("agent.log")
file_handler.setLevel(logging.INFO)  # Set level for this handler
file_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
file_handler.setFormatter(file_formatter)

# Create a stream handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)  # Set level for this handler
console_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
console_handler.setFormatter(console_formatter)

# Add handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

logger.info("This is an INFO log.")
logger.debug("This is a DEBUG log.")

app = FastAPI(title="Noblivion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://8ede5a9c-1536-4919-b14f-82f6fd92faca-00-bvc5u3f2ay1d.janeway.replit.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        logger.debug(f"Request path: {request.url.path}")
        logger.debug(f"Request method: {request.method}")
        response = await call_next(request)
        logger.debug(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        # Log the error message and stack trace
        logger.error(f"An error occurred while processing the request: {e}", exc_info=True)
        raise  # Re-raise the exception to let FastAPI handle it properly

# Initialize Supabase client
supabase = create_client(
    supabase_url = os.getenv("SUPABASE_URL"),
    supabase_key = os.getenv("SUPABASE_KEY")
)

@app.get("/")
async def root():
   return {
       "status": "ready",
       "app": "Noblivion Backend",
       "version": "1.0.0"
   }

app.include_router(v1_router, prefix="/api")
```
------------

### Storage Layer: Supabase
In Supabase we use the object storage to store binary files per client. In Supabase we use the table storage to retain memories, profiles and all other relevant data.
The unique identifier for an client is a UUIDv4. Each client can have several interview sessions.
This is the current schema in Supabase:
---------------

### storage_layer_scripts.sql
```
-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Profiles table
create table profiles (
    id uuid primary key default uuid_generate_v4(),
    first_name text not null,
    last_name text not null,
    date_of_birth date not null,
    place_of_birth text not null,
    gender text not null,
    children text[] default '{}',
    spoken_languages text[] default '{}',
    profile_image_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Interview sessions table
create table interview_sessions (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid references profiles(id) on delete cascade not null,
    category text not null,
    started_at timestamptz default now(),
    completed_at timestamptz,
    summary text,
    emotional_state jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Memories table
create table memories (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid references profiles(id) on delete cascade not null,
    session_id uuid references interview_sessions(id) on delete cascade not null,
    category text not null,
    description text not null,
    time_period date not null,
    location jsonb,
    emotions text[] default '{}',
    people jsonb[] default '{}',
    image_urls text[] default '{}',
    audio_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    sentiment_analysis jsonb
);

-- Memory sentiments table
create table memory_sentiments (
    id uuid primary key default uuid_generate_v4(),
    memory_id uuid references memories(id) on delete cascade not null,
    sentiment_data jsonb not null,
    emotional_triggers text[] default '{}',
    intensity float default 0.0,
    requires_support boolean default false,
    created_at timestamptz default now()
);

-- Achievements table
create table achievements (
    id text primary key,
    type text not null,
    titles jsonb not null, -- Multilingual titles
    descriptions jsonb not null, -- Multilingual descriptions
    icon text not null,
    color text not null,
    required_count integer not null,
    bonus_achievement_id text references achievements(id),
    created_at timestamptz default now()
);

-- Achievement progress table
create table achievement_progress (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid references profiles(id) on delete cascade not null,
    achievement_id text references achievements(id) on delete cascade not null,
    current_count integer default 0,
    completed boolean default false,
    unlocked_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(profile_id, achievement_id)
);

-- PDF exports table
create table pdf_exports (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid references profiles(id) on delete cascade not null,
    file_url text not null,
    generated_at timestamptz default now(),
    category text,
    date_range tstzrange,
    created_at timestamptz default now()
);

-- Triggers for updated_at timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
    before update on profiles
    for each row
    execute function update_updated_at();

create trigger sessions_updated_at
    before update on interview_sessions
    for each row
    execute function update_updated_at();

create trigger memories_updated_at
    before update on memories
    for each row
    execute function update_updated_at();

create trigger achievement_progress_updated_at
    before update on achievement_progress
    for each row
    execute function update_updated_at();

-- Insert default achievements
insert into achievements (id, type, titles, descriptions, icon, color, required_count) values
    ('first_memories', 'memory_milestones', 
     '{"en": "Memory Keeper", "de": "Erinnerungsbewahrer"}',
     '{"en": "Shared your first 5 memories", "de": "Ihre ersten 5 Erinnerungen geteilt"}',
     'AutoStories', '#4CAF50', 5),

    ('photo_collector', 'media_sharing',
     '{"en": "Photo Collector", "de": "Fotograf"}',
     '{"en": "Added photos to 10 memories", "de": "10 Erinnerungen mit Fotos ergänzt"}',
     'PhotoLibrary', '#2196F3', 10),

    ('childhood_expert', 'category_completion',
     '{"en": "Childhood Chronicles", "de": "Kindheitserinnerungen"}',
     '{"en": "Shared 8 childhood memories", "de": "8 Kindheitserinnerungen geteilt"}',
     'ChildCare', '#9C27B0', 8),

    ('family_historian', 'family_connection',
     '{"en": "Family Historian", "de": "Familienchronist"}',
     '{"en": "Mentioned 10 different family members", "de": "10 verschiedene Familienmitglieder erwähnt"}',
     'People', '#FF9800', 10),

    ('consistent_sharing', 'session_streaks',
     '{"en": "Regular Storyteller", "de": "Regelmäßiger Erzähler"}',
     '{"en": "Completed 5 interview sessions", "de": "5 Interviewsitzungen abgeschlossen"}',
     'Timer', '#FF5722', 5),

    ('emotional_journey', 'emotional_sharing',
     '{"en": "Heart of Gold", "de": "Herz aus Gold"}',
     '{"en": "Shared deeply emotional memories", "de": "Emotional bedeutsame Erinnerungen geteilt"}',
     'Favorite', '#E91E63', 3);

-- RLS Policies
alter table profiles enable row level security;
alter table interview_sessions enable row level security;
alter table memories enable row level security;
alter table memory_sentiments enable row level security;
alter table achievement_progress enable row level security;
alter table pdf_exports enable row level security;

-- Create indexes for better performance
create index idx_memories_profile_id on memories(profile_id);
create index idx_memories_session_id on memories(session_id);
create index idx_memories_time_period on memories(time_period);
create index idx_sessions_profile_id on interview_sessions(profile_id);
create index idx_achievement_progress_profile on achievement_progress(profile_id);
create index idx_memory_sentiments_memory on memory_sentiments(memory_id);

-- Create view for achievement statistics
create view achievement_statistics as
select 
    p.id as profile_id,
    p.first_name,
    p.last_name,
    count(distinct ap.achievement_id) as completed_achievements,
    count(distinct m.id) as total_memories,
    count(distinct m.id) filter (where m.image_urls != '{}') as memories_with_photos,
    count(distinct m.session_id) as total_sessions
from profiles p
left join achievement_progress ap on p.id = ap.profile_id and ap.completed = true
left join memories m on p.id = m.profile_id
group by p.id, p.first_name, p.last_name;

-- Storage configuration (run this after creating the bucket in Supabase dashboard)
insert into storage.buckets (id, name) values ('profile-images', 'Profile Images') on conflict do nothing;
insert into storage.buckets (id, name) values ('memory-media', 'Memory Media') on conflict do nothing;
insert into storage.buckets (id, name) values ('exports', 'PDF Exports') on conflict do nothing;
```
---------------
We will use the supabase Python client.

### AI models: OpenAI
The backend uses OpenAI API and langchain to send prompts to an AI.