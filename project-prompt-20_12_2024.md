# Noblivion - Your experiences are precious
Noblivion is a AI system which helps you capturing your personal or professional experiences during various on-screen interviews. The empathetic AI interviewer guides you through the depths of your memories, captures them, gives them structure and finally ouputs them as a book in PDF format.

## How to get Noblivion?
Noblivion is a gift from children to their parents and the process starts when a person enters the personal data of another person (called the client from here) as profile in the Noblivion React frontend. This profile contains personal information and will help the AI interviewer to get started and to focus on the most relevant facets of the client.

## Registration process
### 1. User creation
To create a profile you need to sign up/register with the noblivion system. 
A registered user can be found in the supabase table "users":
* a registered user has an unique "id" property of type UUID
* a registered user has a email which is used for notification mails
* a registered user has a profile property of the type JSONB
The profile property looks like this:
```
{
  "signup_secret": "03212476",
  "is_validated_by_email": true,
  "profiles": [
      { "id": "9aa460e7-9c5d-40c7-ad51-b67d0130336e", "isDefault": true }
  ]
}
```
One registered user can have more than one profiles. 

### 2. Profile creation
A registed user can create one or more profiles. Each profile is written to the profile property of the 
supabase table "users".
The profiles are stored in the supabase table "profiles".
Each profile has at least these fields/properties:
* a profile has a unique "id" property of type UUID
* a profile has a date of birth in ISO format (without time)
* a profile has a geneder property like "male"
* a profile has profile_image_url which is a full URL pointing to an avatar image on a public webserver
* a profile has a metadata property of the type JSONB

The metadata property looks like this:
```
{
  "backstory": "<about the life of the person>"
}
```
Each profile accumulates memories by having interview sessions between the empathetic interviewer AI and the user.

### 3. Interview sessions for a profile
Each interview is started to aquire memories from the user.
A interview is stored in the supabase table "interview_sessions".
Each interview has at least these fields/properties:
* a interview has a unique "id" property of type UUID
* a assigned profile (Foreign key) via the field name profile_id
* a started_at timestamp (timestamptz)
* a summary (text)
Each night an AI agent fills the summary of the interviews which are older than 6 hours by analyzing the
memories of this sessions.

### 4. Memories collected during an interview session
Each memory belongs to a session and is stored in the supabase table "memories". 
Each memory has at least these fields/properties:
* a memory has a unique "id" property of type UUID
* an assigned profile (Foreign key) via the field name profile_id
* an assigned session (Foreign key) via the field name session_id
* a category (text) which is travel | childhood | relationships | pets | hobbies | career
* a description (text) which contains the core information
* a time_period (date) which marks the start of the memory
* a location (jsonb) with the properties "city", "name", "county" and "description"
* a image_urls (text[]) which contains the full URLs of images of the memory. A memory can contain 0 or more images
* 

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

We will implement the knowledge graph using neo4j-graphrag library:
```python
pip install fsspec langchain-text-splitters tiktoken openai python-dotenv numpy torch neo4j-graphrag
```

This is an example how to use the neo4j-graphrag Python library:
```python
from dotenv import load_dotenv
import os

# load neo4j credentials (and openai api key in background).
load_dotenv('.env', override=True)
NEO4J_URI = os.getenv('NEO4J_URI')
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD')


import neo4j
from neo4j_graphrag.llm import OpenAILLM as LLM
from neo4j_graphrag.embeddings.openai import OpenAIEmbeddings as Embeddings
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline
from neo4j_graphrag.retrievers import VectorRetriever
from neo4j_graphrag.generation.graphrag import GraphRAG

neo4j_driver = neo4j.GraphDatabase.driver(NEO4J_URI,
                                          auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

ex_llm=LLM(
   model_name="gpt-4o-mini",
   model_params={
       "response_format": {"type": "json_object"},
       "temperature": 0
   })

embedder = Embeddings()

# 1. Build KG and Store in Neo4j Database
kg_builder_pdf = SimpleKGPipeline(
   llm=ex_llm,
   driver=neo4j_driver,
   embedder=embedder,
   from_pdf=True
)
await kg_builder_pdf.run_async(file_path='precision-med-for-lupus.pdf')

# 2. KG Retriever
vector_retriever = VectorRetriever(
   neo4j_driver,
   index_name="text_embeddings",
   embedder=embedder
)

# 3. GraphRAG Class
llm = LLM(model_name="gpt-4o")
rag = GraphRAG(llm=llm, retriever=vector_retriever)

# 4. Run
response = rag.search( "How is precision medicine applied to Lupus?")
print(response.answer)
```
The SimpleKGPipeline class allows you to automatically build a knowledge graph with a few key inputs, including
* a driver to connect to Neo4j,
* an LLM for entity extraction, and
* an embedding model to create vectors on text chunks for similarity search.

Likewise, we will use OpenAI’s default **text-embedding-3-small** for the embedding model.

In the graph DB we will use a schema, which can be used in the potential_schema argument:
```
category_node_labels = ["childhood", "career", "travel", "travel","hobbies", "pets"]

location_node_labels = ["Home", "Workplace"]

node_labels = basic_node_labels + category_node_labels + location_node_labels

# define relationship types
rel_types = ["MET", "TRAVELED", "IS_CHILD_OF", "BOUGHT", "SOLD", …]
```
While not required, adding a graph schema is highly recommended for improving knowledge graph quality. It provides guidance for the node and relationship types to create during entity extraction.

For our graph schema, we will define entities (a.k.a. node labels) and relations that we want to extract. While we won’t use it in this simple example, there is also an optional potential_schema argument, which can guide which relationships should connect to which nodes.

We can use fill the nodes in neo4j using the matching prompt:
```
prompt_template = '''
You are an empathetic interviewer which extracts information from answers of the client 
and structuring it in a property graph to document the life of the client.

Extract the entities (nodes) and specify their type from the following Input text.
Also extract the relationships between these nodes. the relationship direction goes from the start node to the end node. 


Return result as JSON using the following format:
{{"nodes": [ {{"id": "0", "label": "the type of entity", "properties": {{"name": "name of entity" }} }}],
  "relationships": [{{"type": "TYPE_OF_RELATIONSHIP", "start_node_id": "0", "end_node_id": "1", "properties": {{"details": "Description of the relationship"}} }}] }}

- Use only the information from the Input text. Do not add any additional information.  
- If the input text is empty, return empty Json. 
- Make sure to create as many nodes and relationships as needed to offer rich medical context for further research.
- An AI knowledge assistant must be able to read this graph and immediately understand the context to inform detailed research questions. 
- Multiple documents will be ingested from different sources and we are using this property graph to connect information, so make sure entity types are fairly general. 

Use only fhe following nodes and relationships (if provided):
{schema}

Assign a unique ID (string) to each node, and reuse it to define relationships.
Do respect the source and target node types for relationship and
the relationship direction.

Do not return any additional information other than the JSON in it.

Examples:
{examples}

Input text:

{text}
'''
```

We won't use PDFs as input like in the examples here - we will use the plain text of the memories.
```
from neo4j_graphrag.experimental.components.text_splitters.fixed_size_splitter import FixedSizeSplitter
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline

kg_builder_pdf = SimpleKGPipeline(
   llm=ex_llm,
   driver=driver,
   text_splitter=FixedSizeSplitter(chunk_size=500, chunk_overlap=100),
   embedder=embedder,
   entities=node_labels,
   relations=rel_types,
   prompt_template=prompt_template,
   from_pdf=True
)
```
A Note on Custom & Detailed Knowledge Graph Building
Under the Hood, the SimpleKGPipeline runs the components listed below. The GraphRAG package provides a lower-level pipeline API, allowing you to customize the knowledge graph-building process to a great degree. For further details, see this documentation.

* Document Parser: extract text from documents, such as PDFs.
* Text Splitter: split text into smaller pieces manageable by the LLM context window (token limit).
* Chunk Embedder: compute the text embeddings for each chunk
* Schema Builder: provide a schema to ground the LLM entity extraction for an accurate and easily navigable knowledge graph.
* Entity & Relation Extractor: extract relevant entities and relations from the text
* Knowledge Graph Writer: save the identified entities and relations to the KG

2. Retrieve Data From Your Knowledge Graph
The GraphRAG Python package provides multiple classes for retrieving data from your knowledge graph, including:

* Vector Retriever: performs similarity searches using vector embeddings
* Vector Cypher Retriever: combines vector search with retrieval queries in Cypher, Neo4j’s Graph Query language, to traverse the graph and incorporate additional nodes and relationships.
* Hybrid Retriever: Combines vector and full-text search.
* Hybrid Cypher Retriever: Combines vector and full-text search with Cypher retrieval queries for additional graph traversal.
* Text2Cypher: converts natural language queries into Cypher queries to run against Neo4j.
* Weaviate & Pinecone Neo4j Retriever: Allows you to search vectors stored in Weaviate or Pinecone and connect them to nodes in Neo4j using external id properties.
* Custom Retriever: allows for tailored retrieval methods based on specific needs.
* These retrievers enable you to implement diverse data retrieval patterns, boosting the relevance and accuracy of your RAG pipelines.

#####Instantiate and Run GraphRAG
The GraphRAG Python package makes instantiating and running GraphRAG pipelines easy. We can use a dedicated GraphRAG class. At a minimum, you need to pass the constructor an LLM and a retriever. You can optionally pass a custom prompt template. We will do so here, just to provide a bit more guidance for the LLM to stick to information from our data source.

Below we create GraphRAG objects for both the vector and vector-cypher retrievers.
```
from neo4j_graphrag.llm import OpenAILLM as LLM
from neo4j_graphrag.generation import RagTemplate
from neo4j_graphrag.generation.graphrag import GraphRAG

llm = LLM(model_name="gpt-4o",  model_params={"temperature": 0.0})

rag_template = RagTemplate(template='''Answer the Question using the following Context. Only respond with information mentioned in the Context. Do not inject any speculative information not mentioned.

# Question:
{query_text}

# Context:
{context}

# Answer:
''', expected_inputs=['query_text', 'context'])

v_rag  = GraphRAG(llm=llm, retriever=vector_retriever, prompt_template=rag_template)
vc_rag = GraphRAG(llm=llm, retriever=vc_retriever, prompt_template=rag_template)
```
Now we can ask a simple question and see how the different knowledge graph retrieval patterns compare:
```
q = "How is precision medicine applied to Lupus? provide in list format."

print(f"Vector Response: \n{v_rag.search(q, retriever_config={'top_k':5}).answer}")
print("\n===========================\n")
print(f"Vector + Cypher Response: \n{vc_rag.search(q, retriever_config={'top_k':5}).answer}")
```
Of course, one can tune and combine retrieval methods to further improve these responses; this is just a starting example. Let’s ask a bit more complex questions that require sourcing information from multiple text chunks.
```
q = "Can you summarize systemic lupus erythematosus (SLE)? including common effects, biomarkers, and treatments? Provide in detailed list format."

v_rag_result = v_rag.search(q, retriever_config={'top_k': 5}, return_context=True)
vc_rag_result = vc_rag.search(q, retriever_config={'top_k': 5}, return_context=True)

print(f"Vector Response: \n{v_rag_result.answer}")
print("\n===========================\n")
print(f"Vector + Cypher Response: \n{vc_rag_result.answer}")
```

## Processing pipeline for a client's answer
After the backend received an answer it follows these steps in sequence:
1. Analyze whether the text is a memory or not using the current answer and the memory buffer content for this session using an LLM call
2. IF the text is not a memory just return an answer
3. IF the text is a memory then try to extract the category and and rewrite the client's answer to in warm and confident tone using the frontend's current language
4. Come up with the follow-up answer and return it immediatelly to the client
5. Store the memory into Supabase
6. Inform the frontend to refresh the memory timeline
7. Add the memory to GraphRAG in neo4j
8. Add the question and the answer to a memory buffer for this session

## Technical parts of the Noblivion system

### Frontend: React, vite, mui v6 and Typescript
The frontend uses plaing mui v6 styling and is intended to used by non-trained users. Handling instructions and step-by-step guidance should always be provided.

#### Local storage for state management
In the localStorage we have the following items:
* i18nextLng: The current selected locale (Example "de")
* token: the OAuth token received from the backend for the current user
* user: a JSON object of the current user. Example: {"id":"e7f8856b-165a-4bf8-b3ae-551fb58472b9","email":"ralph.goellner@e-ntegration.de","first_name":"Ralph","last_name":"Göllner","is_validated":false}
* profileId: the id of the current selected profile Example: "8f43b7d5-31d2-4f32-b956-195a83bef907"

#### App (entry point)
The app looks like this:
-------------------

### src/App.tsx
```
import './App.css';
import React, { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MemoryTimeline from './components/common/MemoryTimeline';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';
import ProfileSelection from './pages/ProfileSelection';
import { LanguageSwitch } from './components/common/LanguageSwitch';
import { Box, AppBar, Toolbar, Typography, IconButton, Stack, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { 
  LogoutRounded,
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Login, Register, ForgotPassword } from './components/auth';
import { AuthProvider, useAuth } from './contexts/auth';
import { VerificationCheck, VerifiedRoute } from './components/verification';
import LandingPage from './pages/LandingPage';  
import IntroductionVideo from './pages/IntroductionVideo';
import { useTranslation } from 'react-i18next';
import ChatRobot from './components/chat/ChatRobot';
import Settings from './components/modals/Settings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1eb3b7',
    },
  },
});

const AppMenu = ({ anchorEl, onClose, isAuthenticated }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    onClose();
    logout();
    window.location.href = '/login';
  };

  // Create menu items array conditionally
  const menuItems = [
    // Basic navigation items
    <MenuItem key="home" onClick={() => handleNavigation('/')}>
      <ListItemIcon>
        <HomeIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('menu.home')} />
    </MenuItem>,

    <MenuItem key="profiles" onClick={() => handleNavigation('/profile-selection')}>
      <ListItemIcon>
        <PeopleIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('menu.profiles')} />
    </MenuItem>
  ];

  // Add logout items if authenticated
  if (isAuthenticated) {
    menuItems.push(
      <Divider key="divider" />,
      <MenuItem key="logout" onClick={handleLogout}>
        <ListItemIcon>
          <LogoutRounded fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('menu.logout')} />
      </MenuItem>
    );
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      {menuItems}
    </Menu>
  );
};

const Header = () => {
  const { logout } = useAuth();
  const [profileName, setProfileName] = React.useState<string>('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { t } = useTranslation();

  const updateProfileName = useCallback(() => {
    const profileId = localStorage.getItem('profileId');
    setProfileName(null);
    if (profileId) {
      const profiles = localStorage.getItem('profiles');
      if (profiles) {
        try {
          const parsedProfile = JSON.parse(profiles);
          console.log("PARSING")
          setProfileName(parsedProfile.first_name);
          
        } catch (error) {
          console.error('Error parsing profiles:', error);
        }
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    updateProfileName();
  }, [updateProfileName]);

  // Listen for storage changes
  useEffect(() => {
    // Handler for storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'profileId' || event.key === 'profiles') {
        updateProfileName();
      }
    };

    // Handler for direct calls
    const handleCustomEvent = (event: CustomEvent) => {
      updateProfileName();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileSelected', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileSelected', handleCustomEvent as EventListener);
    };
  }, [updateProfileName]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isAuthenticated = !!(token || user);

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1eb3b7'}}>
      <Toolbar variant="dense">
        <img src="/public/conch-logo.png" alt="Conch Logo" width="30" height="30" />
        <Typography variant="h6" component="div" sx={{ 
          marginLeft: '8px',
          fontWeight: 'bold', 
          flexGrow: 1 
        }}>
          <span style={{ color: 'red' }}>nO</span>blivion
          {profileName && (
            <span style={{ 
              marginLeft: '16px', 
              fontSize: '0.9em',
              fontWeight: '400',
              color: '#fff',
              opacity: 0.9 
            }}>
              {t('appbar.sessionwith')} {profileName}
            </span>
          )}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {isAuthenticated && <Settings sx={{ color: 'white' }} />}
          <LanguageSwitch />
        </Stack>

        {isAuthenticated && (
          <IconButton
            size="small"
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 1, color: 'white' }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <AppMenu 
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          isAuthenticated={isAuthenticated}
        />
      </Toolbar>
    </AppBar>
  );
};

const AppLayout = ({ children }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header />
      <VerificationCheck />
      {children}
    </Box>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <AppLayout>{children}</AppLayout>;
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <Routes>
              {/* Landing page - no header */}
              <Route path="/" element={<LandingPage />} />

              {/* Auth routes - no header */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected routes - with header */}
              <Route path="/profile-selection" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <ProfileSelection />
                  </VerifiedRoute>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } />

              <Route path="/introduction" element={
                <ProtectedRoute>
                  <IntroductionVideo />
                </ProtectedRoute>
              } />

              <Route path="/interview" element={
                <ProtectedRoute>
                  <MemoryCapture />
                </ProtectedRoute>
              } />

              <Route path="/timeline" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <MemoryTimeline 
                      memories={[]}
                      onMemorySelect={(memory) => console.log('Selected memory:', memory)}
                    />
                  </VerifiedRoute>
                </ProtectedRoute>
              } />

              <Route path="/chat" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <ChatRobot />
                  </VerifiedRoute>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </I18nextProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
```

### scr/index.tsx
[Content for scr/index.tsx not found]
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
  // Initialize state with default values
  const [category, setCategory] = React.useState<Category>(Category.CHILDHOOD);
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState<Date>(new Date());
  const [loading, setLoading] = React.useState(false);
  const [location, setLocation] = React.useState<Location>({
    name: '',
    city: '',
    country: '',
    description: ''
  });

  // Update state when memory changes
  React.useEffect(() => {
    if (memory) {
      setCategory(memory.category);
      setDescription(memory.description || '');
      setDate(new Date(memory.timePeriod));
      setLocation({
        name: memory.location?.name || '',
        city: memory.location?.city || '',
        country: memory.location?.country || '',
        description: memory.location?.description || ''
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
        time_period: date?.toISOString(),
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

  const handleClose = () => {
    // Reset form when closing
    if (memory) {
      setCategory(memory.category);
      setDescription(memory.description || '');
      setDate(new Date(memory.timePeriod));
      setLocation({
        name: memory.location?.name || '',
        city: memory.location?.city || '',
        country: memory.location?.country || '',
        description: memory.location?.description || ''
      });
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
    >
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
              onChange={(newDate) => setDate(newDate || new Date())}
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
        <Button onClick={handleClose}>Cancel</Button>
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
import React, { useCallback, useMemo, useEffect, useState } from 'react';
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
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
  Grid,
  Box,
  Collapse
} from '@mui/material';
import MemoryService from '../../services/memories';
import { useDropzone } from 'react-dropzone';
import EditMemoryDialog from './EditMemoryDialog';
import ImageLightbox from './ImageLightbox';
import MemoryTypeFilter from './MemoryTypeFilter';
import { Category } from '../../types/memory';
import { useTranslation } from 'react-i18next';
import './VerticalTimeline.css';

interface TimelineProps {
  memories: Memory[];
  onMemoryDeleted?: () => void; 
  onMemorySelect?: (memory: Memory) => void;
  selectedMemoryId?: string | null;
}

const categoryConfig = {
  childhood: {
    icon: SchoolIcon,
    color: '#fc9c2b',
    background: '#ffebd3'
  },
  career: {
    icon: WorkIcon,
    color: '#1eb3b7',
    background: '#c6edee'
  },
  travel: {
    icon: TravelIcon,
    color: '#879b15',
    background: '#e0e7b5'
  },
  relationships: {
    icon: RelationshipsIcon,
    color: '#ee391c',
    background: '#f9e1de'
  },
  hobbies: {
    icon: HobbiesIcon,
    color: '#9C27B0',
    background: '#F3E5F5'
  },
  pets: {
    icon: PetsIcon,
    color: '#cccccc',
    background: '#EFEBE9'
  }
};
const MemoryDescription: React.FC<{ description: string }> = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{ position: 'relative', marginTop: '10px' }}>
      <Collapse in={isExpanded} collapsedSize={54}>
        <p 
          className="text-gray-600" 
          style={{ 
            fontFamily: 'Pangolin',
            marginTop: 0,
            marginBottom: isExpanded ? 24 : 0 // Add space for button when expanded
          }}
        >
          {description}
        </p>
      </Collapse>

      <IconButton
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          position: 'absolute',
          right: '-14px',
          bottom: 0,
          padding: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          },
        }}
      >
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </div>
  );
};

const MemoryTimeline: React.FC<TimelineProps> = ({ memories,
                                                  onMemoryDeleted, 
                                                  onMemorySelect,
                                                  selectedMemoryId = null  }) => {
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editingMemory, setEditingMemory] = React.useState<Memory | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [selectedMemoryForUpload, setSelectedMemoryForUpload] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedImage, setSelectedImage] = useState<number>(-1);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<Category>>(new Set());
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const { t, i18n } = useTranslation();
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(i18n.language, {
      year: 'numeric'
    });
  };
  
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

  // Updated filtering logic to include both category and year range filters
  const filteredMemories = useMemo(() => {
    if (activeFilters.size === 0 && !yearRange) 
      return [...memories].sort((a, b) => new Date(b.time_period).getTime() - new Date(a.time_period).getTime());


      return memories
      .filter(memory => {
          // Category filter
          const passesCategory = activeFilters.size === 0 || activeFilters.has(memory.category);

          // Year range filter
          let passesYearRange = true;
          if (yearRange) {
              const memoryYear = new Date(memory.time_period).getFullYear();
              passesYearRange = memoryYear >= yearRange[0] && memoryYear <= yearRange[1];
          }

          return passesCategory && passesYearRange;
      })
      .sort((a, b) => new Date(b.time_period).getTime() - new Date(a.time_period).getTime());
    
  }, [memories, activeFilters, yearRange]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] },
    onDrop
  });

  const handleToggleFilter = (category: Category) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(category)) {
        newFilters.delete(category);
      } else {
        newFilters.add(category);
      }
      return newFilters;
    });
  };
  
  // Calculate memory counts by category
  const memoryCounts = useMemo(() => {
    const counts = Object.values(Category).reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<Category, number>);

    memories.forEach(memory => {
      counts[memory.category]++;
    });

    return counts;
  }, [memories]);
  
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

  const handleImageClick = (memory: Memory, index: number) => {
    setSelectedMemory(memory);
    setSelectedImage(index);
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedMemory) return;

    try {
      // Get filename from URL
      const filename = imageUrl.split('/').pop()?.split('?')[0];
      if (!filename) throw new Error('Invalid image URL');

      // Delete from storage
      await MemoryService.deleteImage(selectedMemory.id, filename);

      // Update memory's image URLs
      const updatedUrls = selectedMemory.image_urls.filter(url => url !== imageUrl);
      await MemoryService.updateMemory(selectedMemory.id, {
        image_urls: updatedUrls
      });

      // Close lightbox
      setSelectedMemory(null);
      setSelectedImage(-1);

      // Refresh memories list
      if (onMemoryDeleted) {
        onMemoryDeleted();
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      setError('Failed to delete image');
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

  const handleIconClick = (e, memoryId: string) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    alert(memoryId)
  }

  return (
        <Grid container spacing={0} sx={{ height: '100%' }}> {/* Changed from 700px to 100% */}
          <Grid 
            item 
            xs={12} 
            md={10} 
            lg={11}
            sx={{ 
              height: '100%',
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
            }}
          >
          <Box sx={{ height: '100%' }}>
            <div className="vertical-timeline-wrapper">
              <VerticalTimeline lineColor="#DDD">
                {filteredMemories.map((memory, index) => {
                  const category = memory.category.toLowerCase();
                  const config = categoryConfig[category] || categoryConfig.childhood;
                  const IconComponent = config.icon;
                  const isEven = index % 2 === 0;
                  const hasImages = memory.image_urls && memory.image_urls.length > 0;
          
                  return (
                    
                      <VerticalTimelineElement
                        key={memory.id}
                        className={isEven ? 'vertical-timeline-element--right' : 'vertical-timeline-element--left'}
                        position={isEven ? 'right' : 'left'}
                        date={formatDate(memory.time_period)}
                        iconStyle={{ 
                          background: selectedMemoryId === memory.id ? '#fff' : config.color,
                          color: selectedMemoryId === memory.id ? config.color : '#fff',
                          cursor: 'pointer',
                          border: selectedMemoryId === memory.id ? `2px solid ${config.color}` : 'none',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 0 8px rgba(0,0,0,0.2)'
                          }
                        }}
                        icon={
                          <IconComponent 
                            onClick={() => onMemorySelect?.(memory)} 
                            sx={{ 
                              fontSize: '1.2rem',
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.2)'
                              }
                            }}
                          />
                        }
                        contentStyle={{
                          background: selectedMemoryId === memory.id ? '#fff' : config.background,
                          borderRadius: '8px',
                          paddingTop: (hasImages) ? '40px' : '8px',
                          boxShadow: selectedMemoryId === memory.id 
                            ? '0 0 0 2px #1eb3b7'
                            : '0 3px 6px rgba(0,0,0,0.1)',
                          position: 'relative'
                        }}
                        contentArrowStyle={{ 
                          borderRight: `7px solid ${selectedMemoryId === memory.id ? '#1eb3b7' : config.background}` 
                        }}
                      >
                      {memory.image_urls && memory.image_urls.length > 0 && (
                        <div style={{ position: 'absolute', top: '-38px' }} 
                          className="mt-3 grid grid-cols-3 gap-2">
                          {memory.image_urls.map((url, imgIndex) => (
                            <div 
                              key={imgIndex}
                              className="relative group cursor-pointer"
                              onClick={() => handleImageClick(memory, imgIndex)}
                            >
                              <img
                                src={url}
                                alt={`Memory ${imgIndex + 1}`}
                                className="w-full h-24 object-cover rounded-lg transition-transform hover:scale-105"
                                style={{borderRadius: '6px',
                                        aspectRatio: '1/1', 
                                          width: '70px', 
                                          height: '100%', 
                                          objectFit: 'cover'
                                       }}
                                />
                            </div>
                          ))}
                        </div>
                      )}
                      <MemoryDescription description={memory.description} />
                      {memory.location?.name && (
                        <p className="text-sm text-gray-500 mt-2" style={{ position: 'relative', top: '-10px' }}>
                          <LocationIcon /> {memory.location.name}
                        </p>
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
              </VerticalTimeline></div>
          </Box>
  </Grid>

  <Grid item xs={12} md={2} lg={1}>
   
      <MemoryTypeFilter
        memoryCounts={memoryCounts}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        memories={memories}
        onYearRangeChange={setYearRange}
      />
  
  </Grid>
    {/* Lightbox */}
    {selectedMemory && selectedImage >= 0 && (
      <ImageLightbox
        open={true}
        onClose={() => {
          setSelectedMemory(null);
          setSelectedImage(-1);
        }}
        images={selectedMemory.image_urls}
        currentIndex={selectedImage}
        onNavigate={setSelectedImage}
        onDelete={handleDeleteImage}
      />
    )}
    
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
            <p>{t('memory.drop_here')}</p>
          ) : (
            <p>{t('memory.drag_drop')}</p>
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
    
  </Grid>
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
      ? 'linear-gradient(90deg, gold 50%, transparent 50%)'
      : 'none',
    backgroundSize: '200% 100%',
    animation: isRecording ? 'wave 1s linear infinite' : 'none',
  },
}));

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
            {t('memory.selection_hint', 'Tip: You can select a memory in the timeline to add further details to it. Just click the round icon button.')}
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
          <AddMemoryIcon /> {t('memory.selected_memory')} 
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
        const profileId = localStorage.getItem('profileId');
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
          <Grid item xs={12} md={5} xl={4} xxl={5} sx={{ height: '100%' }}>
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
            <Grid item xs={12} md={7} xl={8} xxl={7} sx={{ height: '100%' }}>
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
                          {t('memory.loading_timeline')}
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
  Avatar,
  Button,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  LogoutRounded,
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  SmartToy as RobotIcon,
  AutoFixHigh as MagicWandIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Forum as ForumIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Profile, calculateAge } from '../types/profile';
import { formatDistance } from 'date-fns';
import { ProfileService } from '../services/profiles';
import { useTranslation } from 'react-i18next';
import BuyProduct from '../components/modals/BuyProduct';
import './styles/GoldButton.css';

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

const ProfileSelection: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Single effect for initialization
  useEffect(() => {
    const initializeProfileSelection = async () => {
      try {
        // Clear local storage at component mount
        localStorage.removeItem('profileId');
        localStorage.removeItem('profiles');
        window.dispatchEvent(new CustomEvent('profileSelected'));

        // Fetch profiles
        const data = await ProfileService.getAllProfiles();
        setProfiles(data);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError('Failed to load profiles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeProfileSelection();
  }, []); // Empty dependency array - runs once on mount

  const handleProfileSelect = (profileId: string, route: string) => {
    const selectedProfile = profiles.find(p => p.id === profileId);

    if (selectedProfile) {
      localStorage.setItem('profileId', profileId);
      localStorage.setItem('profiles', JSON.stringify(selectedProfile));
      window.dispatchEvent(new CustomEvent('profileSelected'));

      onSelect?.(profileId);
      if (!route) {
        navigate('/interview');
      } else {
        navigate(route);
      }
     
    }
  };

  const handleCreateNew = () => {
    navigate('/profile');
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, profileId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProfileId(profileId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProfileId(null);
  };

  const handleCreatePDF = async (event: React.MouseEvent<HTMLElement>, profileId: string) => {
    event.stopPropagation();
    setSelectedProfileId(profileId);
    // TODO: Implement PDF creation
    console.log('Creating PDF for profile:', profileId);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProfileId) return;

    setLoading(true);
    setError(null);

    try {
      await ProfileService.deleteProfile(selectedProfileId);
      setProfiles(profiles.filter(p => p.id !== selectedProfileId));
      setSuccessMessage(t('profile.delete_success'));
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError(t('profile.delete_error'));
    } finally {
      setDeleteDialogOpen(false);
      setLoading(false);
      setSelectedProfileId(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ 
        mt: 4, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress />
      </Container>
    );
  }

  // Rest of your rendering code...
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('profile.select_profile')}
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'end',
             flexDirection: 'row'
          }}>
            <img  onClick={handleCreateNew} src="/public/create-profile.jpg" style={{ cursor: 'pointer', width: '140px' }} alt="Noblivion Logo"></img>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleCreateNew}
              fullWidth
              sx={{ mb: 3, backgroundColor: 'gold', '&:hover': {
                    backgroundColor: '#e2bf02',
                    color: 'white'
                  } }}
            >
              {t('profile.create_new')}
            </Button>
            <Paper elevation={3} sx={{ p: 2, marginLeft: '80px', backgroundColor: '#f2f0e8' }}>
              <Box 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ flex: 1 }}
                >
                  {t('profile.help3')}
                </Typography>
              </Box>
              </Paper>
          </Box>
          <Divider sx={{ my: 2 }}>{t('profile.or_continue')}</Divider>

          <List sx={{ width: '100%' }}>
            {profiles.map((profile) => (
              <ListItem
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                sx={{
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Profile Info (Left) */}
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={profile.profile_image_url}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2,
                          bgcolor: 'primary.main'
                        }}
                      >
                        {!profile.profile_image_url && `${profile.first_name[0]}${profile.last_name[0]}`}
                      </Avatar>
                      <Stack spacing={0}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {profile.first_name} {profile.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('profile.age')}: {calculateAge(profile.date_of_birth)}
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>

                  {/* Session Info (Middle) */}
                  <Grid item xs={3}>
                    <Stack direction="row" spacing={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ForumIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {profile.metadata?.session_count || 0} {t('profile.sessions')}
                        </Typography>
                      </Box>
                      {profile.updated_at && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDistance(new Date(profile.updated_at), new Date(), { addSuffix: true })}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>

                  {/* Actions (Right) */}
                  <Grid item xs={5} sx={{ textAlign: 'right' }}>
                    {!profile.subscribed_at && (
                      <Button
                        variant="contained"
                        className="gold-button"
                        sx={{ 
                          mb: 0,
                          mr: 3
                        }}
                        
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfile(profile);
                          setBuyModalOpen(true);
                        }}
                      >
                        {t('profile.buy')}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<RobotIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileSelect(profile.id,'/chat');
                      }}
                      sx={{ 
                        mr: 1,
                        bgcolor: '#1eb3b7',
                        '&:hover': {
                          bgcolor: '#179699'
                        }
                      }}
                    >
                      {t('profile.chat')}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<MagicWandIcon />}
                      onClick={(e) => handleCreatePDF(e, profile.id)}
                      sx={{ mr: 1 }}
                    >
                      PDF
                    </Button>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, profile.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>

          {profiles.length === 0 && !error && (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>
              {t('profile.no_profiles')}
            </Typography>
          )}

          {/* Actions Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem 
              onClick={() => {
                const profileToDelete = selectedProfileId;
                handleMenuClose();
                setSelectedProfileId(profileToDelete);
                setDeleteDialogOpen(true);
              }} 
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              {t('profile.remove_profile')}
            </MenuItem>
          </Menu>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => !loading && setDeleteDialogOpen(false)}
          >
            <DialogTitle>{t('profile.confirm_delete')}</DialogTitle>
            <DialogContent>
              <Typography>
                {t('profile.delete_warning')}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDeleteDialogOpen(false)}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleDeleteConfirm} 
                color="error" 
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
              >
                {t('common.delete')}
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>

      {/* Feedback Messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)}
          severity="error"
          variant="filled"
        >
          {error}
        </Alert>
      </Snackbar>

      <BuyProduct
        open={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        profileId={selectedProfile?.id || ''}
        profileName={selectedProfile?.first_name || ''}
      />
    </Container>
  );
};

export default ProfileSelection;
```

### src/pages/ProfileSetup.tsx
```
// src/pages/PersonProfile.tsx
import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

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

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  placeOfBirth: string;
  gender: string;
  children: string[];
  spokenLanguages: string[];
  profileImage: File | null;
  imageUrl: string | null;
  backstory: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
  profileImage?: string;
  backstory?: string;
}

const PersonProfile = () => {
  const { t, i18n } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    placeOfBirth: '',
    gender: '',
    children: [],
    spokenLanguages: [],
    profileImage: null,
    imageUrl: null,
    backstory: ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [newChild, setNewChild] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const steps = [
    t('profile.steps.basic_info'),
    t('profile.steps.characterization')
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 0) {
      if (!profile.firstName) newErrors.firstName = t('profile.errors.required_first_name');
      if (!profile.lastName) newErrors.lastName = t('profile.errors.required_last_name');
      if (!profile.dateOfBirth) newErrors.dateOfBirth = t('profile.errors.required_dob');
      if (!profile.placeOfBirth) newErrors.placeOfBirth = t('profile.errors.required_pob');
      if (!profile.gender) newErrors.gender = t('profile.errors.required_gender');
      if (!profile.profileImage) newErrors.profileImage = t('profile.errors.required_image');
    } else if (step === 1) {
      if (!profile.backstory || profile.backstory.split('.').length < 3) {
        newErrors.backstory = t('profile.errors.required_backstory');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        setProfile(prev => ({
          ...prev,
          profileImage: file,
          imageUrl: URL.createObjectURL(file),
        }));
        setErrors(prev => ({ ...prev, profileImage: undefined }));
      } else {
        setErrors(prev => ({
          ...prev,
          profileImage: t('profile.errors.invalid_image'),
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

  const handleRemoveChild = (index: number) => {
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

  const handleRemoveLanguage = (index: number) => {
    setProfile(prev => ({
      ...prev,
      spokenLanguages: prev.spokenLanguages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateStep(activeStep)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      if (profile.profileImage) {
        formData.append('profile_image', profile.profileImage);
      }

      // Add the current UI language to the form data
      const currentLanguage = i18n.language || 'en';
      formData.append('language', currentLanguage);

      const profileData = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        date_of_birth: profile.dateOfBirth?.toISOString().split('T')[0],
        place_of_birth: profile.placeOfBirth,
        gender: profile.gender,
        children: profile.children,
        spoken_languages: profile.spokenLanguages,
        metadata: {
          backstory: profile.backstory
        }
      };

      formData.append('profile', JSON.stringify(profileData));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profiles`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || t('profile.errors.save_failed'));
      }

      const data = await response.json();
      localStorage.setItem('profileId', data.id);
      navigate('/introduction');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('profile.errors.save_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <>
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
            sx={{ borderColor: '#777', backgroundColor: '#dfd9c6' }}
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
            label={t('profile.fields.first_name')}
            value={profile.firstName}
            onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
            error={!!errors.firstName}
            helperText={errors.firstName}
          />
          <TextField
            fullWidth
            label={t('profile.fields.last_name')}
            value={profile.lastName}
            onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
            error={!!errors.lastName}
            helperText={errors.lastName}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <DatePicker
            label={t('profile.fields.dob')}
            value={profile.dateOfBirth}
            onChange={(date) => setProfile(prev => ({ ...prev, dateOfBirth: date }))}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.dateOfBirth,
                helperText: errors.dateOfBirth
              }
            }}
          />
          <TextField
            fullWidth
            label={t('profile.fields.pob')}
            value={profile.placeOfBirth}
            onChange={(e) => setProfile(prev => ({ ...prev, placeOfBirth: e.target.value }))}
            error={!!errors.placeOfBirth}
            helperText={errors.placeOfBirth}
          />
        </Box>

        <FormControl error={!!errors.gender}>
          <FormLabel>{t('profile.fields.gender')}</FormLabel>
          <RadioGroup
            row
            value={profile.gender}
            onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
          >
            <FormControlLabel value="female" control={<Radio />} label={t('profile.gender.female')} />
            <FormControlLabel value="male" control={<Radio />} label={t('profile.gender.male')} />
            <FormControlLabel value="other" control={<Radio />} label={t('profile.gender.other')} />
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
            label={t('profile.fields.add_child')}
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
            label={t('profile.fields.add_language')}
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
      </Stack>
    </>
  );

  const renderCharacterization = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        {t('profile.backstory.description')}
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={8}
        label={t('profile.backstory.label')}
        value={profile.backstory}
        onChange={(e) => setProfile(prev => ({ ...prev, backstory: e.target.value }))}
        placeholder={t('profile.backstory.placeholder')}
        error={!!errors.backstory}
        helperText={errors.backstory}
      />
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Grid container spacing={4}>
              {/* Left Column */}
              <Grid item xs={12} md={4} >
                <Paper elevation={3} sx={{ p: 4, backgroundColor: '#f2f0e8' }}>
                <Box 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      pb: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      mb: 2 
                    }}
                  >
                    {t('profile.helpcaption')}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ flex: 1 }}
                  >
                    {t('profile.help')}
                    <br/><br/>
                    {t('profile.help2')}
                  </Typography>
                </Box>
                </Paper>
              </Grid>

              {/* Main Content Column */}
              <Grid item xs={12} md={8}>
                <Paper elevation={3} sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    {t('profile.title')}
                  </Typography>

                  <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {submitError}
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit}>
                    {activeStep === 0 ? renderBasicInfo() : renderCharacterization()}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                      <Button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        startIcon={<ArrowBackIcon />}
                      >
                        {t('common.back')}
                      </Button>

                      {activeStep === steps.length - 1 ? (
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={isSubmitting}
                          endIcon={isSubmitting ? <CircularProgress size={24} /> : <NavigateNextIcon />}
                        >
                          {t('profile.continue_to_interview')}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          endIcon={<NavigateNextIcon />}
                        >
                          {t('common.next')}
                        </Button>
                      )}
                    </Box>
                  </form>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </LocalizationProvider>
      );
    };

export default PersonProfile;
```

### src/pages/IntroductionVideo.tsx
```
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';

export default function IntroductionVideo() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleVideoEnd = () => {
    navigate('/interview');
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Typography variant="h4" sx={{ mb: 4 }}>
        Before we begin, please watch this video
      </Typography>
      <Box sx={{ width: '100%', maxWidth: '800px' }}>
        <video
          ref={videoRef}
          onEnded={handleVideoEnd}
          style={{ width: '100%', borderRadius: '8px' }}
          controls={false}
        >
          <source src="https://samplelib.com/lib/preview/mp4/sample-5s.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Box>
    </Container>
  );
}
```

### src/pages/LandingPage.tsx
```
// src/components/LandingPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    navigate('/profile');
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          backgroundColor: '#f8f9fa',
          backgroundImage: 'url(/public/noblivion-opener.jpg)',
          backgroundSize: '100vw',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              justifyItems: 'center',
              textAlign: 'center',
              py: 6
            }}
          >
            <img src="/public/conch-logo.png" alt="Conch Logo" width="100" />

            <Typography 
              variant="h2" 
              component="h1"
              sx={{ 
                fontWeight: 'bold',
                mb: 3,
                color: '#2c3e50'
              }}
            >
              <span style={{ color: 'darkred'}}>nO</span>blivion
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 4,
                color: '#34495e'
              }}
            >
              {t('landing.subtitle')}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 6,
                color: '#fff',
                textShadow: '2px 2px 2px #6B6B6B',
                maxWidth: '800px',
                mx: 'auto'
              }}
            >
              {t('landing.description')}
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleGetStarted}
              sx={{
                fontWeight: 'bold',
                backgroundColor: 'gold',
                '&:hover': {
                  backgroundColor: '#179699'
                },
                py: 2,
                px: 6,
                borderRadius: 2
              }}
            >
              {t('landing.try_now')}
            </Button>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3,
                mt: 3,
                color: '#fff',
                maxWidth: '800px',
                textShadow: '2px 2px 2px #6B6B6B',
                mx: 'auto'
              }}
            >
              {t('landing.ds')}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Backstroy Section */}
      <Box sx={{ py: 8, backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{ 
            color: '#1eb3b7',
            fontSize: '22px',
            fontWeight: 'bold',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory.quote')}
          </Typography>  
          <Typography sx={{ 
            color: '#777',
            fontSize: '18px',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory.paragraph1')}
          </Typography>  
          <Typography sx={{ 
            color: '#777',
            fontSize: '18px',
            fontFamily: 'Averia Libre',
          }} textAlign="center" mb={8}>
            {t('landing.backstory.paragraph2')}
          </Typography>  
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 12, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" mb={8}>
            {t('landing.how_it_works')}
          </Typography>
          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr 1fr'
              },
              gap: 4
            }}
          >
            <Box sx={{ justifyItems: 'center', textAlign: 'center', p: 3 }}>
             
              <img src="/public/noblivion-icon-1.png" style={{ width: '160px'}}></img>
               <br></br>
              <Typography variant="h5" mb={2}>1. {t('landing.features.create_profile.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features.create_profile.description')}
              </Typography>
            </Box>
            <Box sx={{ justifyItems: 'center',textAlign: 'center', p: 3 }}>
              <img src="/public/noblivion-icon-2.png" style={{ width: '160px'}}></img>
              <br></br>
              <Typography variant="h5" mb={2}>2. {t('landing.features.share_memories.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features.share_memories.description')}
              </Typography>
            </Box>
            <Box sx={{ justifyItems: 'center',textAlign: 'center', p: 3 }}>
              <img src="/public/noblivion-icon-3.png" style={{ width: '160px'}}></img>
              <br></br>
              <Typography variant="h5" mb={2}>3. {t('landing.features.preserve_legacy.title')}</Typography>
              <Typography color="text.secondary">
                {t('landing.features.preserve_legacy.description')}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box 
        sx={{ 
          py: 12, 
          backgroundColor: '#1eb3b7',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" mb={4}>
            {t('landing.cta.title')}
          </Typography>
          <Button 
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              backgroundColor: 'gold',
              color: '#000',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            {t('landing.cta.button')}
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
```

### src/components/memories/MemoryTypeFilter.tsx
```
// src/components/memories/MemoryTypeFilter.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { IconButton, Typography, Box, Tooltip, Popover, Slider } from '@mui/material';
import {
  School as SchoolIcon,
  Work as WorkIcon,
  FlightTakeoff as TravelIcon,
  Favorite as RelationshipsIcon,
  SportsEsports as HobbiesIcon,
  Pets as PetsIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Category } from '../../types/memory';
import { useTranslation } from 'react-i18next';

const FilterButton: React.FC<FilterButtonProps> = ({
  icon,
  count,
  isActive,
  isDisabled,
  onClick,
  label
}) => (
  <Box className="flex flex-col items-center mb-4">
    <Tooltip title={label} placement="left">
      <span>
        <IconButton
          onClick={onClick}
          disabled={isDisabled}
          sx={{
            backgroundColor: isActive ? 'gold' : 'transparent',
            color: isActive ? 'white' : isDisabled ? 'action.disabled' : 'action.active',
            '&:hover': {
              backgroundColor: isActive ? 'darkgoldenrod' : 'action.hover'
            },
            transition: 'all 0.2s'
          }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
    {!isDisabled && (
      <Typography
        variant="caption"
        color={isActive ? 'text.secondary' : 'text.primary'}
        sx={{ mt: 0.5 }}
      >
        ({count})
      </Typography>
    )}
  </Box>
);

const MemoryTypeFilter: React.FC<MemoryTypeFilterProps> = ({
  memoryCounts,
  activeFilters,
  onToggleFilter,
  memories,
  onYearRangeChange
}) => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([0, 0]);
  const [initialYearRange, setInitialYearRange] = useState<[number, number]>([0, 0]);
  const [forceUpdate, setForceUpdate] = useState(0);

  const categoryConfig = useMemo(() => ({
      [Category.CHILDHOOD]: {
        icon: <SchoolIcon />,
        label: t('categories.childhood')
      },
      [Category.CAREER]: {
        icon: <WorkIcon />,
        label: t('categories.career')
      },
      [Category.TRAVEL]: {
        icon: <TravelIcon />,
        label: t('categories.travel')
      },
      [Category.RELATIONSHIPS]: {
        icon: <RelationshipsIcon />,
        label: t('categories.relationships')
      },
      [Category.HOBBIES]: {
        icon: <HobbiesIcon />,
        label: t('categories.hobbies')
      },
      [Category.PETS]: {
        icon: <PetsIcon />,
        label: t('categories.pets')
      }
  }), [t, forceUpdate]); // Recreate when language changes
  
  
  // Calculate the year range from memories
  const { minYear, maxYear, hasMultipleYears } = useMemo(() => {
    const years = memories.map(m => new Date(m.time_period).getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    return {
      minYear: min,
      maxYear: max,
      hasMultipleYears: min !== max && !isNaN(min) && !isNaN(max)
    };
  }, [memories]);

  // Initialize the year ranges when memories change
  useEffect(() => {
    if (hasMultipleYears) {
      setYearRange([minYear, maxYear]);
      setInitialYearRange([minYear, maxYear]);
    }
  }, [minYear, maxYear, hasMultipleYears]);

  // Check if current range is different from initial range
  const isCustomRange = yearRange[0] !== initialYearRange[0] || yearRange[1] !== initialYearRange[1];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleYearRangeChange = (
    _event: Event,
    newValue: number | number[]
  ) => {
    const range = newValue as [number, number];
    setYearRange(range);
    if (onYearRangeChange) {
      onYearRangeChange(range);
    }
  };

  // Calculate filtered memories based on year range
  const yearFilteredMemories = useMemo(() => {
    return memories.filter(memory => {
      const year = new Date(memory.time_period).getFullYear();
      return year >= yearRange[0] && year <= yearRange[1];
    });
  }, [memories, yearRange]);

  // Calculate memory counts based on year-filtered memories
  const filteredMemoryCounts = useMemo(() => {
    const counts = Object.values(Category).reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<Category, number>);

    yearFilteredMemories.forEach(memory => {
      counts[memory.category]++;
    });

    return counts;
  }, [yearFilteredMemories]);

  const open = Boolean(anchorEl);

  return (
    <Box>
      {Object.entries(categoryConfig).map(([category, config]) => (
        <FilterButton
          key={category}
          icon={config.icon}
          count={filteredMemoryCounts[category as Category]}
          isActive={activeFilters.has(category as Category)}
          isDisabled={filteredMemoryCounts[category as Category] === 0}
          onClick={() => onToggleFilter(category as Category)}
          label={config.label}
        />
      ))}

      {hasMultipleYears && (
        <>
          <Box className="flex flex-col items-center mb-4">
            <Tooltip title={t('memoryfilter.year_filter')} placement="left">
              <span>
                <IconButton 
                  onClick={handleClick}
                  sx={{
                    backgroundColor: isCustomRange ? 'gold' : 'transparent',
                    '&:hover': {
                      backgroundColor: isCustomRange ? 'darkgoldenrod' : 'action.hover'
                    }
                  }}
                >
                  <CalendarIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
          >
            <Box sx={{ p: 2, width: 400 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 5,
                mt: 0,
              }}>
                <Typography>
                  {t('memoryfilter.year_range')}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleClose}
                  sx={{ ml: 1 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <div style={{marginLeft:'20px', marginRight:'20px'}}>
              <Slider
                value={yearRange}
                onChange={handleYearRangeChange}
                valueLabelDisplay="on"
                min={minYear}
                max={maxYear}
                marks={[
                  { value: minYear, label: minYear.toString() },
                  { value: maxYear, label: maxYear.toString() }
                ]}
              />
              </div>
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

export default MemoryTypeFilter;
```

### src/components/auth.tsx
```
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthService, SignupData } from '../services/auth';
import { useAuth } from '../contexts/auth';

// Login Component
export const Login = ({ onSuccess }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', formData.email); // Debug logging

      const response = await AuthService.login(
        formData.email,
        formData.password
      );

      console.log('Login response:', response); // Debug log
      login({
        id: response.user.id,
        email: response.user.email,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        is_validated: response.user.is_validated || false // Ensure this is set
      });
      navigate('/profile-selection');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Welcome Back
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Link href="/forgot-password" variant="body2">
              Forgot password?
            </Link>
          </Box>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => {/* Implement Google login */}}
              >
                Google
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHubIcon />}
                onClick={() => {/* Implement GitHub login */}}
              >
                GitHub
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link href="/register" variant="body2">
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

// Register Component
export const Register = ({ onSuccess }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });

      // Update auth context
      login(response.user);

      onSuccess?.();
      navigate('/profile-selection');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Create Account
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Account'}
          </Button>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => {/* Implement Google signup */}}
              >
                Google
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHubIcon />}
                onClick={() => {/* Implement GitHub signup */}}
              >
                GitHub
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/login" variant="body2">
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

// ForgotPassword Component
export const ForgotPassword = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      onSuccess?.();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset instructions have been sent to your email
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="/login" variant="body2">
              Back to Sign In
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
```

### src/components/verification.tsx
```
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { Navigate, useLocation } from 'react-router-dom';
import api  from '../services/api'
import { AuthService } from '../services/auth';

// In your verification components file
interface VerificationDialogProps {
  open: boolean;
  onClose: () => void;
}

export const VerificationCheck: React.FC = () => {
  const { user } = useAuth();
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    // Only show verification dialog if:
    // 1. User exists
    // 2. User is not validated
    // 3. User hasn't dismissed the dialog in this session
    const hasUserDismissedVerification = sessionStorage.getItem('verification_dismissed');

    if (user && 
        user.is_validated === false && 
        !hasUserDismissedVerification) {
      setShowVerification(true);
    }
  }, [user, user?.is_validated]);

  const handleClose = () => {
    setShowVerification(false);
    // Mark verification as dismissed for this session
    sessionStorage.setItem('verification_dismissed', 'true');
  };

  return (
    <VerificationDialog 
      open={showVerification}
      onClose={handleClose}
    />
  );
};

export const VerifiedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkValidation = async () => {
      if (user?.id) {
        try {
          const validationStatus = await AuthService.checkValidationStatus(user.id);
          setIsValidated(validationStatus);
        } catch (error) {
          console.error('Validation check failed:', error);
          setIsValidated(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkValidation();
  }, [user?.id]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isValidated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Email Verification Required
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please verify your email address to access this page.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return <>{children}</>;
};

export const VerificationDialog: React.FC<VerificationDialogProps> = ({ open, onClose }) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirm, setShowResendConfirm] = useState(false);

  const handleResend = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verificationApi.resendVerification(user.id);
      if (result.success) {
        setShowResendConfirm(true);
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowResendConfirm(false);
        }, 5000);
      } else {
        setError('Failed to resend verification code.');
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      setError(error.response?.data?.detail || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleVerification = async () => {
    if (!user?.id || !verificationCode) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verificationApi.verifyEmail(verificationCode, user.id);

      if (result.verified) {
        // First update user state
        login({
          ...user,
          is_validated: true
        });

        // Close the dialog immediately
        onClose();

        // Navigate after a short delay
        setTimeout(() => {
          navigate('/profile-selection');
        }, 100);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.response?.data?.detail || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update your verification code input to handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 8) {
      handleVerification();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Verify Your Email
      </DialogTitle>

      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" gutterBottom>
            Please enter the 8-digit verification code sent to {user?.email}.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {showResendConfirm && (
            <Alert severity="success" sx={{ mb: 2 }}>
              A new verification code has been sent to your email.
            </Alert>
          )}

          <TextField
            fullWidth
            label="Verification Code"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 8) {
                setVerificationCode(value);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter 8-digit code"
            sx={{ mb: 2 }}
            inputProps={{
              maxLength: 8,
              pattern: '[0-9]*'
            }}
            error={!!error}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handleResend}
              disabled={loading}
            >
              Resend Code
            </Button>

            <Button
              variant="contained"
              onClick={handleVerification}
              disabled={loading || verificationCode.length !== 8}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Also update the verificationApi object to properly log responses:
const verificationApi = {
  async verifyEmail(code: string, userId: string): Promise<{ verified: boolean }> {
    try {
      const response = await api.post('/api/v1/auth/verify-email', {
        code: code,  // Changed to match backend's expected format
        user_id: userId
      });
      console.log('Verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Verification API error:', error);
      throw error;
    }
  },

  async resendVerification(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.post('/api/v1/auth/resend-verification', {
        user_id: userId
      });
      console.log('Resend response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Resend API error:', error); // Debug log
      throw error;
    }
  }
};
```

### src/components/chat/ChatRobot.tsx
```
// src/components/chat/ChatRobot.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Stack
} from '@mui/material';
import { 
  Send as SendIcon, 
  Mic as MicIcon, 
} from '@mui/icons-material';

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
import ReactMarkdown from 'react-markdown';
import { ChatService } from '../../services/chat';
import { useTranslation } from 'react-i18next';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Add styles for markdown content
const markdownStyles = `
  .markdown-content {
    font-family: inherit;
  }
  .markdown-content p {
    margin: 0 0 8px 0;
  }
  .markdown-content p:last-child {
    margin-bottom: 0;
  }
  .markdown-content pre {
    background-color: rgba(0, 0, 0, 0.04);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
  }
  .markdown-content code {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.04);
    padding: 2px 4px;
    border-radius: 4px;
  }
  .markdown-content ul, .markdown-content ol {
    margin: 8px 0;
    padding-left: 20px;
  }
`;

const hasInitialized = { current: false };

const ChatRobot: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([{
    text: t('chat.welcome_message'),
    isUser: false,
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!hasInitialized.current && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = i18n.language === 'de' ? 'de-DE' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setTranscript(transcript);
        setInputMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Automatically stop after 5 seconds of silence
      recognitionRef.current.onspeechend = () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };

      // Handle errors
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      hasInitialized.current = true;
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [i18n.language]); // Only reinitialize when language changes

  useEffect(() => {
    // Load profile data from localStorage
    const profileData = localStorage.getItem('profiles');
    if (profileData) {
      setProfile(JSON.parse(profileData));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const newUserMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await ChatService.sendMessage(inputMessage);

      const newBotMessage = {
        text: response.answer,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Update language before starting
      recognitionRef.current.lang = i18n.language === 'de' ? 'de-DE' : 'en-US';
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <style>{markdownStyles}</style>
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header with Avatar and Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={profile?.profile_image_url}
            alt={profile?.first_name}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Typography variant="h5">
            {t('chat.chat_with')} {profile?.first_name}
          </Typography>
        </Box>

        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          mb: 2,
          p: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}>
          <Stack spacing={2}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.isUser ? '#1eb3b7' : '#fff',
                    color: message.isUser ? '#fff' : 'inherit',
                  }}
                >
                  {message.isUser ? (
                    <Typography variant="body1">{message.text}</Typography>
                  ) : (
                    <ReactMarkdown className="markdown-content">
                      {message.text}
                    </ReactMarkdown>
                  )}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      mt: 1,
                      opacity: 0.7
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <CircularProgress size={20} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        {/* Input Area */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={toggleListening}
            disabled={isLoading}
            sx={{
              bgcolor: isListening ? 'red' : '#e0e0e0',
              color: 'white',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              transition: 'all 0.2s',
              animation: isListening ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)'
                },
                '70%': {
                  boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)'
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)'
                }
              },
              '&:hover': {
                bgcolor: isListening ? '#d32f2f' : '#bdbdbd'
              },
              '&.Mui-disabled': {
                bgcolor: '#cccccc'
              }
            }}
          >
            <MicIcon />
          </IconButton>
          <TextField
            fullWidth
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? t('chat.listening') : t('chat.type_message')}
            multiline
            maxRows={4}
            disabled={isLoading}
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: isListening ? 'rgba(255, 0, 0, 0.05)' : 'transparent',
                transition: 'background-color 0.3s ease'
              }
            }}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend}
            disabled={isLoading || !inputMessage.trim()}
            sx={{ 
              bgcolor: 'gold',
              color: 'black',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              '&:hover': {
                bgcolor: '#ffd700'
              },
              '&.Mui-disabled': {
                bgcolor: '#cccccc',
                color: 'white'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Container>
    </>
  );
};

export default ChatRobot;
```

### src/components/modals/BuyProduct.tsx
```
// src/components/modals/BuyProduct.tsx
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress
} from '@mui/material';
import {
  Check as CheckIcon,
  LocalOffer as PriceIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import '../../pages/styles/GoldButton.css';

interface BuyProductProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

const BuyProduct: React.FC<BuyProductProps> = ({ open, onClose, profileId, profileName }) => {
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const benefits = useMemo(() => [
    {
      category: t('buy.category.memories'),
      basic: t('buy.basic_memories'),
      premium: t('buy.premium_memories'),
      
    },
    {
      category: t('buy.category.storage'),
      basic: t('buy.basic_storage'),
      premium: t('buy.premium_storage'),
     
    },
    {
      category: t('buy.category.export'),
      basic: t('buy.basic_exports'),
      premium: t('buy.premium_exports'),
    
    },
    {
      category: t('buy.category.support'),
      basic: t('buy.basic_retention'),
      premium: t('buy.premium_retention'),
   
    },
  ], [t]); 

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);
      await ProfileService.subscribeProfile(profileId);
      onClose();
      // Optionally refresh the profiles list or show success message
    } catch (error) {
      console.error('Failed to process subscription:', error);
      // Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h4" sx={{ color: '#34495e', mb:0, fontFamily: 'Averia Libre' }} align="center" gutterBottom>
          {t('buy.title', { name: profileName })}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ backgroundImage: 'url(/public/noblivion-opener.jpg)',
                           backgroundSize: 'cover' }}>
        {/* Price Tag */}
        <Box
          sx={{
            textAlign: 'center',
            my: 4,
            p: 3,
            bgcolor: 'gold',
            borderRadius: 2,
            display: 'inline-block',
            position: 'relative',
           
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          className="gold-button"
        >
          <PriceIcon sx={{ fontSize: 40, color: 'black', mb: 1 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'black', }}>
            {t('profile.currency')}299
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#000' }}>
            {t('buy.one_time_payment')}
          </Typography>
        </Box>

        {/* Benefits Table */}
        <TableContainer component={Paper} sx={{ mb: 4, opacity: 0.8 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>{t('buy.feature')}</TableCell>
                <TableCell>{t('buy.basic')}</TableCell>
                <TableCell sx={{ bgcolor: 'gold', color: '#000' }}>
                  {t('buy.premium')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {benefits.map((row, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    <b>{row.category}</b>
                  </TableCell>
                  <TableCell>{row.basic}</TableCell>
                  <TableCell sx={{ bgcolor: '#fff9c4' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon sx={{ color: 'gold' }} />
                      {row.premium}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Checkout Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            sx={{ color: "black", 
                 backgroundColor: 'gold', 
                 fontWeight: 'bold', 
                 '&:hover': {
                   backgroundColor: '#e2bf02',
                   color: 'white'
                 },
                 borderRadius: '10px', mb: 2 }}
            onClick={handleCheckout}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t('buy.checkout')
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BuyProduct;
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
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Ensure proper Bearer token format
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Log the error for debugging
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url
      });

      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Only logout if it's a token-related error
          const errorDetail = error.response.data?.detail || '';
          if (
            errorDetail.includes('Invalid token') || 
            errorDetail.includes('Token has expired') ||
            errorDetail.includes('Could not validate credentials')
          ) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          break;

        case 403:
          console.warn('Forbidden access:', error.response.data);
          break;

        case 404:
          console.warn('Resource not found:', error.response.data);
          break;

        case 500:
          console.error('Server error:', error.response.data);
          break;
      }
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
import { UUID } from '../types/common';

interface InterviewResponse {
  text: string;
  language: string;
  audio_url?: string;
  emotions_detected?: Array<{
    type: string;
    intensity: number;
    description?: string;
  }>;
}



export const InterviewService = {
  startInterview: async (profileId: string, language: string) => {
    const response = await api.post(`/api/v1/interviews/${profileId}/start`, null, {
      params: {
        language
      }
    });
    return response.data;
  },

  submitResponse: async (
    profileId: string, 
    sessionId: string, 
    response: { text: string; language: string, user_id: string }
  ): Promise<{
    sentiment: {
      joy: number;
      sadness: number;
      nostalgia: number;
      intensity: number;
    };
    follow_up: string;
    is_memory: boolean;
    memory_id?: string;
  }> => {
    const result = await api.post(
      `/api/v1/interviews/${profileId}/response`,
      {
        user_id: response.user_id,
        text: response.text,
        language: response.language,
        audio_url: null,
        emotions_detected: []
      },
      {
        params: { session_id: sessionId }  // Add as query parameter
      }
    );
    return result.data;
  },

  getNextQuestion: async (profileId: string, sessionId: string, language: string) => {
    const response = await api.get(`/api/v1/interviews/${profileId}/question`, {
      params: {
        session_id: sessionId,
        language
      }
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

  static async deleteImage(memoryId: UUID, filename: string): Promise<void> {
    try {
      // Delete file from Supabase storage
      const response = await api.delete(`/api/v1/memories/${memoryId}/media/${filename}`);
      if (!response.data.success) {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw new Error('Failed to delete image');
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
  static async uploadMedia(formData: FormData, memoryId: string): Promise<string[]> {
    try {
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
import { Profile  } from '../types/profile';

export const ProfileService = {
  getAllProfiles: async (): Promise<Profile[]> => {
    const response = await api.get('/api/v1/profiles');  // No need to add /api/v1 here
    return response.data;
  },

  createProfile: async (profileData: FormData): Promise<Profile> => {
    const response = await api.post('/api/v1/profiles', profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProfile: async (profileId: string): Promise<Profile> => {
    const response = await api.get(`/api/v1/profiles/${profileId}`);
    return response.data;
  },

  updateProfile: async (profileId: string, profileData: FormData): Promise<Profile> => {
    const response = await api.put(`/api/v1/profiles/${profileId}`, profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProfile: async (profileId: string): Promise<void> => {
    const response = await api.delete(`/api/v1/profiles/${profileId}`);
    if (!response.data?.message) {
      throw new Error('Failed to delete profile');
    }
  }
};

export default ProfileService;
```

### src/services/auth.ts
```
// src/services/auth.ts
import api from './api';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export const AuthService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post('/api/v1/auth/signup', {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password
    });

    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }

    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/v1/auth/login', {
        email: email,
        password: password
      });

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  async checkValidationStatus(userId: string): Promise<boolean> {
    try {
      const response = await api.get(`/api/v1/auth/validation-status/${userId}`);
      return response.data.is_validated;
    } catch (error) {
      console.error('Validation check error:', error);
      return false;
    }
  },

  async resetPassword(email: string): Promise<void> {
    await api.post('/api/v1/auth/reset-password', { email });
  },

  logout() {
    localStorage.removeItem('token');
  }
};
```

### scr/contexts/auth/auth.ts
[Content for scr/contexts/auth/auth.ts not found]

### src/services/chat.ts
```
// src/services/chat.ts
import api from './api';

export const ChatService = {
  sendMessage: async (message: string) => {
    try {
      const profileId = localStorage.getItem('profileId');
      if (!profileId) {
        throw new Error('No profile selected');
      }

      const response = await api.post('/api/v1/chat', {
        profile_id: profileId,
        query_text: message
      });

      return response.data;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw error;
    }
  }
};

export default ChatService;
```
--------------

#### Types
These are the types which we use. They must be always in sync with the Python models in the Backend. If you want to add something always change the Python model
first and then the type definition in the frontend project:
------------------------
{frontend_types}
------------------------

#### Primary colors
When we use colors then prefer:
* Blue #1eb3b7
* Green #879b15
* Orange #fc9c2b
* Red #ee391c

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
from uuid import UUID, uuid4

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
    audio_url: Optional[str] = None

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
    audio_url: Optional[str] = None
    emotions_detected: Optional[List[Emotion]] = None
    session_id: Optional[UUID] = None  
    user_id: UUID

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
from typing import List, Optional, Dict, Any

class ProfileCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    place_of_birth: str
    gender: str
    children: List[str] = []
    spoken_languages: List[str] = []
    profile_image_url: Optional[str]
    metadata: Optional[Dict[str, Any]] = {}

class Profile(ProfileCreate):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    subscribed_at: Optional[datetime] = None

    @property
    def is_subscribed(self) -> bool:
        return self.subscribed_at is not None

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
from .auth  import router as auth_router
from .chat  import router as chat_router

router = APIRouter(prefix="/v1")
router.include_router(interviews_router)
router.include_router(memories_router)
router.include_router(achievements_router)
router.include_router(profiles_router)
router.include_router(auth_router)
router.include_router(chat_router)
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
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from uuid import UUID
from services.sentiment import EmpatheticInterviewer
from models.memory import InterviewResponse, InterviewQuestion
import logging
from uuid import UUID, uuid4

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["interviews"])

@router.post("/{profile_id}/start")
async def start_interview(profile_id: UUID, language: str = "en"):
    interviewer = EmpatheticInterviewer()
    return await interviewer.start_new_session(profile_id, language)

@router.post("/{profile_id}/response")
async def process_response(
    profile_id: UUID,
    response: InterviewResponse,
    session_id: UUID = Query(...)  # Now it comes after the required arguments
):
    """Process a response from the interview."""
    try:
        interviewer = EmpatheticInterviewer()
        return await interviewer.process_interview_response(
            user_id=response.user_id,
            profile_id=profile_id,
            session_id=session_id,
            response_text=response.text,
            language=response.language
        )
    except Exception as e:
        logger.error(f"Error processing response: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process response: {str(e)}"
        )

@router.get("/{profile_id}/question")
async def get_next_question(
    profile_id: UUID,
    session_id: UUID,
    language: str = "en"
):
    """Get the next interview question based on the session context."""
    try:
        interviewer = EmpatheticInterviewer()
        result = await interviewer.generate_next_question(profile_id, session_id, language)
        return {
            "text": result,
            "suggested_topics": [],
            "requires_media": False
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

@router.delete("/{memory_id}/media/{filename}")
async def delete_media_from_memory(memory_id: UUID, filename: str):
    """Delete a media file from a memory"""
    try:
        logger.debug(f"Deleting media {filename} from memory {memory_id}")

        result = await MemoryService.delete_media_from_memory(memory_id, filename)

        return {"success": True, "message": "Media deleted successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting media: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete media: {str(e)}"
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
from fastapi import APIRouter, HTTPException, File, Form, Query, UploadFile
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
from io import BytesIO
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
    profile: str = Form(...),
    language: str = Form("en")  # Add language parameter with default "en"
):
    try:
        profile_data = json.loads(profile)
        first_name = profile_data.get("first_name")
        last_name = profile_data.get("last_name")
        profile_data["date_of_birth"] = datetime.strptime(profile_data["date_of_birth"], "%Y-%m-%d").date()

        if not first_name or not last_name:
            raise ValueError("Both first_name and last_name are required.")

        # Sanitize filename - handle non-ASCII characters
        def sanitize_filename(s: str) -> str:
            # Replace umlauts and special characters
            replacements = {
                'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
                'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
                'é': 'e', 'è': 'e', 'ê': 'e',
                'á': 'a', 'à': 'a', 'â': 'a',
                'ó': 'o', 'ò': 'o', 'ô': 'o',
                'í': 'i', 'ì': 'i', 'î': 'i',
                'ú': 'u', 'ù': 'u', 'û': 'u'
            }

            for german, english in replacements.items():
                s = s.replace(german, english)

            # Keep only ASCII chars, numbers, and safe special chars
            return "".join(c for c in s if c.isascii() and (c.isalnum() or c in "_-"))

        safe_first_name = sanitize_filename(first_name)
        safe_last_name = sanitize_filename(last_name)
        file_extension = profile_image.filename.split(".")[-1].lower()
        file_path = f"{safe_first_name}_{safe_last_name}.{file_extension}"

        # Read file content as bytes
        file_content = await profile_image.read()

        try:
            # Remove existing file if it exists
            try:
                supabase.storage.from_("profile-images").remove([file_path])
                logger.debug(f"Removed existing file: {file_path}")
            except Exception as e:
                logger.debug(f"No existing file to remove or removal failed: {str(e)}")

            # Upload new file with raw bytes
            result = supabase.storage.from_("profile-images").upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": profile_image.content_type
                }
            )

            logger.debug(f"Upload result: {result}")

            # Get public URL
            image_url = supabase.storage.from_("profile-images").get_public_url(file_path)
            profile_data["profile_image_url"] = image_url

            logger.debug(f"Successfully uploaded image, URL: {image_url}")

            # Create profile using service with language parameter
            profile_create = ProfileCreate(**profile_data)
            return await ProfileService.create_profile(profile_create, language=language)

        except Exception as e:
            logger.error(f"Storage error: {str(e)}")
            logger.error(f"Error details: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing profile image: {str(e)}"
            )

    except Exception as e:
        tb = traceback.extract_tb(e.__traceback__)[-1]
        error_info = f"Error in {tb.filename}, line {tb.lineno}: {str(e)}"
        logger.error(f"Validation error: {error_info}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
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

@router.delete("/{profile_id}")
async def delete_profile(profile_id: UUID):
    """Delete a profile and all associated data"""
    try:
        logger.debug(f"Deleting profile with ID: {profile_id}")
        service = ProfileService()

        # Delete profile and all associated data
        success = await service.delete_profile(profile_id)

        if not success:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {"message": "Profile and all associated data deleted successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting profile: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
```

### api/v1/auth.py
```
# api/v1/auth.py
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta
from config.jwt import create_access_token
from supabase import create_client
import os
import bcrypt
from services.email import EmailService
import random
import string
from config.jwt import decode_token
import logging
from typing import Dict, Optional
import json

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

supabase = create_client(
    supabase_url=os.getenv("SUPABASE_URL"),
    supabase_key=os.getenv("SUPABASE_KEY")
)

class ProfileUpdate(BaseModel):
    profile: Dict

async def get_current_user(authorization: str = Header(None)) -> str:
    """Get current user from authorization header"""
    if not authorization:
        logger.error("No authorization header provided")
        raise HTTPException(
            status_code=401,
            detail="No authorization header"
        )

    try:
        logger.debug(f"Processing authorization header: {authorization[:20]}...")
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            logger.error(f"Invalid authentication scheme: {scheme}")
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication scheme"
            )

        logger.debug("Attempting to decode token...")
        payload = decode_token(token)
        if not payload:
            logger.error("Token decode returned None")
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        user_id = payload.get("sub")
        if not user_id:
            logger.error("No user ID in token payload")
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload"
            )

        logger.debug(f"Successfully validated token for user: {user_id}")
        return user_id
    except ValueError as e:
        logger.error(f"Invalid authorization header format: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format"
        )
    except Exception as e:
        logger.error(f"Error validating token: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token"
        )

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=8))

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

class VerificationRequest(BaseModel):
    code: str
    user_id: str

# api/v1/auth.py
@router.post("/signup")
async def signup(request: SignupRequest):
    try:
        # Check if user exists
        result = supabase.table("users").select("*").eq("email", request.email).execute()
        if result.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Generate verification code
        verification_code = generate_verification_code()

        # Create user with verification code in profile
        user_data = {
            "first_name": request.first_name,
            "last_name": request.last_name,
            "email": request.email,
            "password": bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "profile": {
                "signup_secret": verification_code,
                "is_validated_by_email": False
            }
        }

        result = supabase.table("users").insert(user_data).execute()
        user = result.data[0]

        # Send verification email (synchronously)
        email_service = EmailService()
        email_service.send_verification_email(request.email, verification_code)  # Removed await

        # Create access token
        access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "is_validated": False
            }
        }
    except Exception as e:
        print(f"Signup error: {str(e)}")  # Add debug logging
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/validation-status/{user_id}")
async def check_validation_status(user_id: str):
    """Check if a user's email is validated"""
    try:
        # Query user from Supabase
        result = supabase.table("users").select("profile").eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = result.data[0]
        profile = user.get("profile", {})

        # Check validation status from profile JSONB
        is_validated = profile.get("is_validated_by_email", False)

        return {
            "is_validated": is_validated,
            "user_id": user_id
        }

    except Exception as e:
        logger.error(f"Error checking validation status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check validation status: {str(e)}"
        )

@router.post("/verify-email")
async def verify_email(verification_data: VerificationRequest):
    try:
        # Get user
        result = supabase.table("users").select("*").eq(
            "id", verification_data.user_id
        ).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = result.data[0]
        profile = user.get("profile", {})

        # Check verification code
        if profile.get("signup_secret") != verification_data.code:
            return {"verified": False}

        # Update user profile
        profile["is_validated_by_email"] = True
        supabase.table("users").update(
            {"profile": profile}
        ).eq("id", verification_data.user_id).execute()

        return {"verified": True}
    except Exception as e:
        print(f"Verification error: {str(e)}")  # Add debug logging
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resend-verification")
async def resend_verification(user_id: str):
    try:
        # Get user
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = result.data[0]

        # Generate new verification code
        verification_code = generate_verification_code()

        # Update user profile
        profile = user.get("profile", {})
        profile["signup_secret"] = verification_code
        supabase.table("users").update({"profile": profile}).eq("id", user_id).execute()

        # Send new verification email
        email_service = EmailService()
        await email_service.send_verification_email(user["email"], verification_code)

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(login_data: LoginRequest):  # Use Pydantic model for validation
    try:
        print(f"Login attempt for email: {login_data.email}")  # Debug logging

        # Get user from Supabase
        result = supabase.table("users").select("*").eq("email", login_data.email).execute()

        if not result.data:
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )

        user = result.data[0]

        # Verify password
        is_valid = bcrypt.checkpw(
            login_data.password.encode('utf-8'),
            user["password"].encode('utf-8')
        )

        if not is_valid:
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )

        # Create access token
        access_token = create_access_token(
            data={"sub": user["id"], "email": user["email"]}
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug logging
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/profile/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get user profile settings"""
    try:
        logger.debug(f"Getting profile for user ID: {user_id}")

        # Verify user is accessing their own profile
        if current_user != user_id:
            logger.warning(f"User {current_user} attempted to access profile of {user_id}")
            raise HTTPException(
                status_code=403,
                detail="Cannot access another user's profile"
            )

        result = supabase.table("users").select("profile").eq("id", user_id).execute()

        if not result.data:
            logger.warning(f"No profile found for user {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        profile_data = result.data[0].get("profile", {})

        # Ensure default fields exist
        profile_data.setdefault("signup_secret", "")
        profile_data.setdefault("is_validated_by_email", False)
        profile_data.setdefault("narrator_perspective", "ego")
        profile_data.setdefault("narrator_verbosity", "normal")
        profile_data.setdefault("narrator_style", "neutral")

        logger.debug(f"Successfully retrieved profile for user {user_id}")
        return {"profile": profile_data}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile")
async def update_user_profile(
    profile_update: ProfileUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update user profile settings"""
    try:
        logger.info(f"Updating profile for user ID: {current_user}")

        # Get current profile to merge with new settings
        current_result = supabase.table("users").select("profile").eq("id", current_user).execute()

        if not current_result.data:
            logger.warning(f"No profile found for user {current_user}")
            raise HTTPException(status_code=404, detail="User not found")

        current_profile = current_result.data[0].get("profile", {})

        # Ensure required fields are preserved
        updated_profile = {
            "signup_secret": current_profile.get("signup_secret", ""),
            "is_validated_by_email": current_profile.get("is_validated_by_email", False),
            **profile_update.profile
        }

        # Update profile in database
        result = supabase.table("users").update(
            {"profile": updated_profile}
        ).eq("id", current_user).execute()

        if not result.data:
            logger.error(f"Failed to update profile for user {current_user}")
            raise HTTPException(status_code=404, detail="Failed to update profile")

        logger.info(f"Successfully updated profile for user {current_user}")
        return {"message": "Profile updated successfully", "profile": updated_profile}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

### api/v1/chat.py
```
# api/v1/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import UUID
import neo4j
from neo4j_graphrag.llm import OpenAILLM as LLM
from neo4j_graphrag.embeddings.openai import OpenAIEmbeddings as Embeddings
from neo4j_graphrag.retrievers import HybridRetriever
from neo4j_graphrag.generation.graphrag import GraphRAG
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatQuery(BaseModel):
    profile_id: UUID
    query_text: str

class ChatResponse(BaseModel):
    answer: str

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

async def get_graph_rag():
    try:
        neo4j_driver = neo4j.GraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USERNAME, NEO4J_PASSWORD)
        )

        embedder = Embeddings()

        hybrid_retriever = HybridRetriever(
            neo4j_driver,
            fulltext_index_name="fulltext_index_noblivion",
            vector_index_name="vector_index_noblivion",
            embedder=embedder
        )

        llm = LLM(model_name="gpt-4o-mini")
        return GraphRAG(llm=llm, retriever=hybrid_retriever)
    except Exception as e:
        logger.error(f"Error initializing GraphRAG: {str(e)}")
        raise

@router.post("", response_model=ChatResponse)
async def process_chat_message(query: ChatQuery):
    try:
        logger.info(f"Processing chat message for profile {query.profile_id}")
        logger.debug(f"Query text: {query.query_text}")

        # Initialize GraphRAG
        rag = await get_graph_rag()

        # Get response
        response = rag.search(query_text=query.query_text)

        logger.debug(f"Generated response: {response.answer}")
        return ChatResponse(answer=response.answer)

    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat message: {str(e)}"
        )
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
logging.basicConfig(level=logging.INFO)
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
                    "time_period": str(memory.time_period),
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
    async def delete_media_from_memory(cls, memory_id: UUID, filename: str) -> bool:
        """Delete a media file from storage and update the memory record"""
        try:
            logger.debug(f"Deleting media {filename} from memory {memory_id}")
            instance = cls.get_instance()

            # First, get the current memory record to get the image URLs
            memory = instance.supabase.table(cls.table_name)\
                .select("image_urls")\
                .eq("id", str(memory_id))\
                .execute()

            if not memory.data:
                raise Exception("Memory not found")

            # Get current image URLs
            current_urls = memory.data[0].get('image_urls', [])

            # Generate the storage URL that matches our stored URL pattern
            storage_url = instance.supabase.storage\
                .from_(cls.storage_bucket)\
                .get_public_url(f"{memory_id}/{filename}")

            # Find and remove the URL from the list
            updated_urls = [url for url in current_urls if url != storage_url]

            if len(updated_urls) == len(current_urls):
                logger.warning(f"URL not found in memory record: {storage_url}")

            # Delete from storage
            try:
                delete_result = instance.supabase.storage\
                    .from_(cls.storage_bucket)\
                    .remove([f"{memory_id}/{filename}"])

                logger.debug(f"Storage delete result: {delete_result}")
            except Exception as e:
                logger.error(f"Error deleting from storage: {str(e)}")
                # Continue anyway to update the memory record
                pass

            # Update the memory record with the new URL list
            update_result = instance.supabase.table(cls.table_name)\
                .update({"image_urls": updated_urls})\
                .eq("id", str(memory_id))\
                .execute()

            logger.debug(f"Memory update result: {update_result}")

            return True

        except Exception as e:
            logger.error(f"Error deleting media from memory: {str(e)}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to delete media: {str(e)}")

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
from services.knowledgemanagement import KnowledgeManagement, MemoryClassification

logger = logging.getLogger(__name__)

class EmpatheticInterviewer:
    def __init__(self):
        self.openai_client = openai.Client(api_key=os.getenv("OPENAI_API_KEY"))
        self.supabase = create_client(
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY")
        )
        self.knowledge_manager = KnowledgeManagement()

    async def start_new_session(self, profile_id: UUID, language: str = "en") -> Dict[str, Any]:
        """Start a new interview session for a profile."""
        try:
            # First, fetch the profile to get the backstory
            profile_result = self.supabase.table("profiles").select("*").eq("id", str(profile_id)).execute()

            if not profile_result.data:
                raise Exception("Profile not found")

            profile = profile_result.data[0]
            backstory = profile.get("metadata", {}).get("backstory", "")
            name = f"{profile['first_name']} {profile['last_name']}"

            # Create system prompt with backstory context and language
            system_prompt = f"""You are an empathetic interviewer helping {name} preserve their memories.

            Context about {name}:
            {backstory if backstory else "No previous context available."}

            Generate a warm, inviting opening question in {language} that:
            1. Makes the person feel comfortable sharing memories
            2. References their background if available
            3. Is open-ended but specific enough to trigger memories
            4. Uses appropriate cultural references based on their background

            The entire response should be in {language} language only."""

            # Generate personalized opening question using OpenAI
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": f"Generate an opening question for {name}'s memory preservation interview."
                    }
                ],
                max_tokens=150,
                temperature=0.7
            )

            initial_question = response.choices[0].message.content
            session_id = uuid4()
            now = datetime.utcnow()

            # Create session record
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
                "initial_question": initial_question,
                "started_at": now.isoformat(),
                "profile_id": str(profile_id)
            }

        except Exception as e:
            logger.error(f"Error starting interview session: {str(e)}")
            raise Exception(f"Failed to start interview session: {str(e)}")

    async def process_interview_response(
        self,
        user_id: UUID,
        profile_id: UUID,
        session_id: UUID,
        response_text: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Process a response from the interviewee and generate the next question.
        """
        try:
            # First, get profile settings
            profile_result = self.supabase.table("users").select("profile").eq(
                "id", str(user_id)
            ).execute()

            if not profile_result.data:
                raise Exception(f"Profile not found {user_id}")

            profile_settings = profile_result.data[0].get("profile", {})

            # Get narrative settings with defaults
            narrator_perspective = profile_settings.get("narrator_perspective", "ego")
            narrator_style = profile_settings.get("narrator_style", "neutral")
            narrator_verbosity = profile_settings.get("narrator_verbosity", "normal")

            logger.debug(f"Using profile settings - perspective: {narrator_perspective}, style: {narrator_style}, verbosity: {narrator_verbosity}")

            # Analyze if the response is a memory and classify it with profile settings
            classification = await KnowledgeManagement.analyze_response(
                response_text=response_text, 
                client=self.openai_client,
                language=language,
                narrator_perspective=narrator_perspective,
                narrator_style=narrator_style,
                narrator_verbosity=narrator_verbosity
            )

            logger.info("------- Analyzed response -------")
            logger.info(f"is_memory={classification.is_memory} "
                      f"category='{classification.category}' "
                      f"location='{classification.location}' "
                      f"timestamp='{classification.timestamp}'")

            # If it's a memory, store it
            if classification.is_memory:
                logger.info(f"rewrittenText='{classification.rewritten_text}'")
                logger.info(f"narrator_perspective='{narrator_perspective}'")
                await self.knowledge_manager.store_memory(
                    profile_id,
                    session_id,
                    classification
                )

            # Analyze sentiment
            sentiment = await self._analyze_sentiment(
                classification.rewritten_text if classification.is_memory else response_text
            )

            # Generate follow-up question based on the processed response
            next_question = await self.generate_next_question(
                profile_id, 
                session_id,
                language
            )

            return {
                "sentiment": sentiment,
                "follow_up": next_question,
                "is_memory": classification.is_memory
            }

        except Exception as e:
            print(f"Error processing interview response: {str(e)}")
            return {
                "sentiment": {"joy": 0.5, "nostalgia": 0.5},
                "follow_up": "Can you tell me more about that?",
                "is_memory": False,
                "memory_id": memory.id if memory else None
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

    async def generate_next_question(self, profile_id: UUID, session_id: UUID, language: str = "en") -> str:
        """Generate the next question based on previous responses."""
        try:
            # Get previous responses...
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
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are an empathetic interviewer helping people preserve their 
                        memories. Generate a follow-up question that encourages deeper sharing and 
                        reflection. Focus on details, emotions, and sensory experiences.
                        Respond in {language} language only."""
                    },
                    {
                        "role": "user",
                        "content": f"Given this context: {context}\nGenerate an engaging follow-up question."
                    }
                ],
                max_tokens=100
            )

            next_question = response.choices[0].message.content
            return next_question

        except Exception as e:
            logger.error(f"Error generating next question: {str(e)}")
            # Return default messages in the correct language
            default_messages = {
                "en": "What other memories would you like to share today?",
                "de": "Welche anderen Erinnerungen möchten Sie heute teilen?"
                # Add more languages as needed
            }
            return default_messages.get(language, default_messages["en"])
```

### services/profile.py
```
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, UUID4
from supabase import create_client, Client
import os
import logging
import json
from models.profile import Profile, ProfileCreate
from models.memory import MemoryCreate, Category, Memory, Location
from services.memory import MemoryService
import openai
from uuid import UUID, uuid4

logger = logging.getLogger(__name__)

# Service Class
class ProfileService:
    table_name = "profiles"

    def __init__(self):
        self.supabase = create_client(
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY")
        )
        self.openai_client = openai.Client(
            api_key=os.getenv("OPENAI_API_KEY")
        )

    async def parse_backstory(self, profile_id: UUID, backstory: str, profile_data: Dict[str, Any], language: str = "de") -> None:
        """Parse memories from backstory and create initial memories in the specified language"""
        try:
            logger.info(f"Parsing backstory for profile {profile_id} in language {language}")

            # Create single session for all initial memories
            session_data = {
                "id": str(uuid4()),
                "profile_id": str(profile_id),
                "category": "initial",
                "started_at": datetime.utcnow().isoformat(),
                "emotional_state": {"initial": "neutral"},
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            # Create session
            try:
                session_result = self.supabase.table("interview_sessions").insert(session_data).execute()
                if not session_result.data:
                    raise Exception("Failed to create interview session")
                session_id = session_result.data[0]['id']
                logger.info(f"Created interview session: {session_id}")
            except Exception as e:
                logger.error(f"Failed to create interview session: {str(e)}")
                raise

            # Use the same session_id for all memories

            # Create birth memory
            try:
                city = profile_data['place_of_birth'].split(',')[0].strip()
                country = profile_data['place_of_birth'].split(',')[-1].strip()

                birth_description = {
                    "de": f"{profile_data['first_name']} {profile_data['last_name']} wurde in {profile_data['place_of_birth']} geboren",
                    "en": f"{profile_data['first_name']} {profile_data['last_name']} was born in {profile_data['place_of_birth']}"
                }.get(language, f"{profile_data['first_name']} {profile_data['last_name']} was born in {profile_data['place_of_birth']}")

                birth_memory = MemoryCreate(
                    category=Category.CHILDHOOD,
                    description=birth_description,
                    time_period=datetime.strptime(profile_data['date_of_birth'], "%Y-%m-%d"),
                    location=Location(
                        name=profile_data['place_of_birth'],
                        city=city,
                        country=country,
                        description="Geburtsort" if language == "de" else "Place of birth"
                    )
                )

                await MemoryService.create_memory(birth_memory, profile_id, session_id)
                logger.info("Birth memory created successfully")

            except Exception as e:
                logger.error(f"Error creating birth memory: {str(e)}")

            # Get narrator settings from user profile
            user_result = self.supabase.table("users").select("profile").eq("id", str(profile_id)).execute()
            user_profile = user_result.data[0].get("profile", {}) if user_result.data else {}

            # Get narrative settings with defaults
            narrator_perspective = user_profile.get("narrator_perspective", "ego")
            narrator_style = user_profile.get("narrator_style", "neutral")
            narrator_verbosity = user_profile.get("narrator_verbosity", "normal")

            # Convert perspective setting to prompt text
            perspective_text = "in first person view" if narrator_perspective == "ego" else "in third person view"

            # Convert style setting to prompt text
            style_text = {
                "professional": "using a clear and professional tone",
                "romantic": "using a warm and emotional tone",
                "optimistic": "using a positive and uplifting tone",
                "neutral": "using a balanced and neutral tone"
            }.get(narrator_style, "using a neutral tone")

            # Convert verbosity setting to prompt text
            verbosity_text = {
                "verbose": "more detailed and elaborate",
                "normal": "similar in length",
                "brief": "more concise and focused"
            }.get(narrator_verbosity, "similar in length")

            # Set temperature based on style
            temperature = {
                "professional": 0.1,
                "neutral": 0.3
            }.get(narrator_style, 0.7)

            logger.debug(f"Using narrative settings - perspective: {perspective_text}, style: {style_text}, verbosity: {verbosity_text}, temperature: {temperature}")

            # Parse and create additional memories using the SAME session_id
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": f"""Extract distinct memories from the backstory and format them as a JSON object.
                            The date is a single string in the format "YYYY-MM-DD". If it is a timespan always use the start date.
                            Write all text content in {language} language.

                            Format each memory {perspective_text}, {style_text}. 
                            Compared to the source text, your description should be {verbosity_text}.

                            For each memory in the "memories" array, provide:
                            {{
                                "description": "Full description of the memory in {language}",
                                "category": "One of: childhood/career/relationships/travel/hobbies/pets",
                                "date": "YYYY-MM-DD (approximate if not specified)",
                                "location": {{
                                    "name": "Location name",
                                    "city": "City if mentioned",
                                    "country": "Country if mentioned",
                                    "description": "Brief description of the location in {language}"
                                }}
                            }}"""
                        },
                        {
                            "role": "user",
                            "content": f"Please analyze this text and return the memories as JSON: {backstory}"
                        }
                    ],
                    response_format={ "type": "json_object" },
                    temperature=temperature
                )

                try:
                    parsed_memories = json.loads(response.choices[0].message.content)
                    logger.info(f"Parsed memories: {parsed_memories}")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {str(e)}")
                    logger.error(f"Raw response: {response.choices[0].message.content}")
                    raise Exception("Failed to parse OpenAI response")

                # Create all memories using the same session_id
                for memory_data in parsed_memories.get('memories', []):
                    try:
                        category_str = memory_data.get('category', 'childhood').upper()
                        category = getattr(Category, category_str, Category.CHILDHOOD)

                        logger.info("------------------- parsed memory -----------")
                        logger.info(category)
                        logger.info(memory_data.get('description'))
                        logger.info(memory_data.get('date'))

                        memory = MemoryCreate(
                            category=category,
                            description=memory_data['description'],
                            time_period=memory_data.get('date'),
                            location=Location(**memory_data['location']) if memory_data.get('location') else None
                        )

                        # Use the same session_id for all memories
                        await MemoryService.create_memory(memory, profile_id, session_id)
                        logger.debug(f"Created memory: {memory.description}")

                    except Exception as e:
                        logger.error(f"Error creating individual memory: {str(e)}")
                        continue

            except Exception as e:
                logger.error(f"Error parsing memories from backstory: {str(e)}")
                raise

        except Exception as e:
            logger.error(f"Error in parse_backstory: {str(e)}")
            raise Exception(f"Failed to parse backstory: {str(e)}")

    @classmethod
    async def get_all_profiles(cls) -> List[Profile]:
        """Get all profiles"""
        try:
            service = cls()

            # Direct SQL query to get profiles with their session counts
            query = """
                SELECT p.*,
                       (SELECT COUNT(*) 
                        FROM interview_sessions 
                        WHERE profile_id = p.id) as session_count
                FROM profiles p
                ORDER BY p.updated_at DESC
            """

            result = service.supabase.table('profiles').select("*").execute()

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

                    if isinstance(profile_data['subscribed_at'], str):
                        profile_data['subscribed_at'] = datetime.fromisoformat(profile_data['subscribed_at'])
                    else:
                        profile_data['subscribed_at'] = None

                    # Initialize metadata if it doesn't exist
                    if not profile_data.get('metadata'):
                        profile_data['metadata'] = {}

                    # Add session count to metadata
                    session_count_result = service.supabase.table('interview_sessions')\
                        .select('id', count='exact')\
                        .eq('profile_id', profile_data['id'])\
                        .execute()

                    profile_data['metadata']['session_count'] = session_count_result.count

                    profiles.append(Profile(**profile_data))
                except Exception as e:
                    logger.error(f"Error converting profile data: {str(e)}")
                    logger.error(f"Problematic profile data: {profile_data}")
                    continue

            return profiles

        except Exception as e:
            logger.error(f"Error fetching all profiles: {str(e)}")
            raise

    @classmethod
    async def create_profile(cls, profile_data: ProfileCreate, language: str = "en") -> Profile:
        """Creates a new profile and initializes memories from backstory"""
        try:
            service = cls()  # Create instance

            # Extract backstory from metadata if present
            backstory = None
            metadata = profile_data.metadata if hasattr(profile_data, 'metadata') else {}
            if isinstance(metadata, dict):
                backstory = metadata.get('backstory')

            # Prepare profile data for database
            data = {
                "first_name": profile_data.first_name,
                "last_name": profile_data.last_name,
                "date_of_birth": profile_data.date_of_birth.isoformat(),
                "place_of_birth": profile_data.place_of_birth,
                "gender": profile_data.gender,
                "children": profile_data.children,
                "spoken_languages": profile_data.spoken_languages,
                "profile_image_url": profile_data.profile_image_url,
                "metadata": metadata,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            # Insert profile into database
            result = service.supabase.table(service.table_name).insert(data).execute()

            if not result.data:
                raise Exception("No data returned from profile creation")

            profile_id = result.data[0]['id']
            created_profile = Profile(**result.data[0])

            # Parse backstory and create initial memories if backstory exists
            if backstory:
                await service.parse_backstory(
                    profile_id=profile_id,
                    backstory=backstory,
                    profile_data=data,
                    language=language  # Pass the language parameter
                )

            return created_profile

        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
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
        Deletes a profile and all associated data by ID.
        """
        try:
            service = ProfileService()

            # First get the profile to check if it exists and get image URL
            result = service.supabase.table("profiles").select("*").eq("id", str(profile_id)).execute()

            if not result.data:
                return False

            profile = result.data[0]

            # Delete profile image from storage if it exists
            if profile.get('profile_image_url'):
                try:
                    # Extract filename from URL
                    filename = profile['profile_image_url'].split('/')[-1]
                    service.supabase.storage.from_("profile-images").remove([filename])
                    logger.debug(f"Deleted profile image: {filename}")
                except Exception as e:
                    logger.warning(f"Failed to delete profile image: {str(e)}")

            # Delete all related data
            # Note: Due to cascade delete in Supabase, we only need to delete the profile
            result = service.supabase.table("profiles").delete().eq("id", str(profile_id)).execute()

            if result.data:
                logger.info(f"Successfully deleted profile {profile_id} and all associated data")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to delete profile {profile_id}: {str(e)}")
            raise Exception(f"Failed to delete profile: {str(e)}")
```

### services/knowledgemanagement.py
```
# services/knowledgemanagement.py
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import logging
from uuid import UUID
from models.memory import (
    Category, 
    Memory, 
    Location, 
    MemoryCreate, 
    Person,
    Emotion
)
from services.memory import MemoryService
import neo4j
from neo4j_graphrag.llm import OpenAILLM as LLM
from neo4j_graphrag.embeddings.openai import OpenAIEmbeddings as Embeddings
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline
from neo4j_graphrag.retrievers import VectorRetriever
from neo4j_graphrag.generation.graphrag import GraphRAG
from neo4j_graphrag.experimental.components.text_splitters.fixed_size_splitter import FixedSizeSplitter
import os
import asyncio
import time

logger = logging.getLogger(__name__)

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

class MemoryClassification(BaseModel):
    """Model for classified memory information"""
    is_memory: bool
    rewritten_text: str
    category: Optional[str]
    location: Optional[str]
    timestamp: str  # ISO format date string

class KnowledgeManagement:
    """Class for managing knowledge management"""
    def __init__(self):
        self.memory_service = MemoryService()

    # In services/knowledgemanagement.py
    @staticmethod
    async def analyze_response(
        response_text: str, 
        client, 
        language: str = "en",
        narrator_perspective: str = "ego",
        narrator_style: str = "neutral",
        narrator_verbosity: str = "normal"
    ) -> MemoryClassification:
        """Analyze user response to classify and enhance memory content with profile settings"""
        try:
            # Convert perspective setting to prompt text
            perspective_text = "in first person view" if narrator_perspective == "ego" else "in third person view"

            # Convert style setting to prompt text
            style_text = {
                "professional": "using a clear and professional tone",
                "romantic": "using a warm and emotional tone",
                "optimistic": "using a positive and uplifting tone",
                "neutral": "using a balanced and neutral tone"
            }.get(narrator_style, "using a neutral tone")

            # Convert verbosity setting to prompt text
            verbosity_text = {
                "verbose": "more detailed and elaborate",
                "normal": "similar in length",
                "brief": "more concise and focused"
            }.get(narrator_verbosity, "similar in length")

            # Set temperature based on style
            temperature = {
                "professional": 0.1,
                "neutral": 0.3
            }.get(narrator_style, 0.7)

            # Build the prompt
            prompt = f"""Analyze the following text and classify it as a memory or not. 
            If it is a memory, rewrite it {perspective_text}, {style_text}. Also extract the category, location, and timestamp.
            Compared to the user's input, your rewritten text should be {verbosity_text}.
            If the exact date is unknown, please estimate the month and year based on context clues
            or use the current date if no time information is available.

            IMPORTANT: Keep the response in the original language ({language}).

            Text: {response_text}

            Return result as JSON with the following format:
            {{
                "is_memory": true/false,
                "rewritten_text": "rewritten memory in {language}",
                "category": "one of: childhood, career, travel, relationships, hobbies, pets",
                "location": "where it happened or 'Unknown' if not mentioned",
                "timestamp": "YYYY-MM-DD (if unknown, use current date)"
            }}
            """

            logger.debug(f"Using temperature {temperature} for style {narrator_style}")

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a memory analysis assistant that responds in {language}. Keep the rewritten text in the original language."
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=temperature
            )

            result = response.choices[0].message.content
            classification = MemoryClassification.parse_raw(result)

            # Set default current date if timestamp is invalid
            if classification.timestamp in ["unbekannt", "unknown", ""]:
                classification.timestamp = datetime.now().strftime("%Y-%m-%d")

            classification.timestamp = classification.timestamp.replace("-XX", "-01")

            logger.info(f"Memory classification complete: {classification}")
            return classification

        except Exception as e:
            logger.error(f"Error analyzing response: {str(e)}")
            raise

    async def store_memory(self, profile_id: UUID, session_id: UUID, classification: MemoryClassification) -> Optional[Memory]:
        """
        Store classified memory in both Supabase and Neo4j (future implementation)
        """
        try:
            if not classification.is_memory:
                logger.debug("Text classified as non-memory, skipping storage")
                return None

            # Parse timestamp or use current date if invalid
            try:
                timestamp = datetime.fromisoformat(classification.timestamp)
            except (ValueError, TypeError):
                logger.warning(f"Invalid timestamp '{classification.timestamp}', using current date")
                timestamp = datetime.now()

            # Prepare memory data
            memory_data = {
                "category": classification.category or Category.CHILDHOOD.value,
                "description": classification.rewritten_text,
                "time_period": datetime.fromisoformat(classification.timestamp),
                "location": {
                    "name": classification.location if classification.location != "unbekannt" else "Unknown",
                    "city": None,
                    "country": None,
                    "description": None
                } if classification.location else None,
                "people": [],
                "emotions": [],
                "image_urls": [],
                "audio_url": None
            }

            # Store in Supabase
            stored_memory = await MemoryService.create_memory(
                MemoryCreate(**memory_data),
                profile_id,
                session_id
            )

            # in the background: store in Neo4j knowledge graph (vector and graph search)
            asyncio.create_task(self.append_to_rag(classification.rewritten_text, classification.category, classification.location))

            logger.info(f"Memory stored successfully")
            return stored_memory

        except Exception as e:
            logger.error(f"Error storing memory: {str(e)}")
            raise

    async def append_to_rag(self, memory_text, category, location):

        neo4j_driver = neo4j.GraphDatabase.driver(NEO4J_URI,
            auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

        ex_llm=LLM(
        model_name="gpt-4o-mini",
        model_params={
        "response_format": {"type": "json_object"},
        "temperature": 0
        })

        embedder = Embeddings()

        prompt_for_noblivion = '''
        You are a knowledge manager and you task is extracting information from life memories of people 
        and structuring it in a property graph to inform further research and Q&A.

        Extract the entities (nodes) and specify their type from the following Input text.
        Also extract the relationships between these nodes. the relationship direction goes from the start node to the end node. 

        Return result as JSON using the following format:
        {{"nodes": [ {{"id": "0", "label": "the type of entity", "properties": {{"name": "name of entity" }} }}],
        "relationships": [{{"type": "TYPE_OF_RELATIONSHIP", "start_node_id": "0", "end_node_id": "1", "properties": {{"details": "Description of the relationship"}} }}] }}

        - Use only the information from the Input text. Do not add any additional information.  
        - If the input text is empty, return empty Json. 
        - Make sure to create as many nodes and relationships as needed to offer rich medical context for further research.
        - An AI knowledge assistant must be able to read this graph and immediately understand the context to inform detailed research questions. 
        - Multiple documents will be ingested from different sources and we are using this property graph to connect information, so make sure entity types are fairly general. 

        Use only fhe following nodes and relationships (if provided):
        --------------------

        --------------------

        Assign a unique ID (string) to each node, and reuse it to define relationships.
        Do respect the source and target node types for relationship and
        the relationship direction.

        Do not return any additional information other than the JSON in it.

        Examples:
        {examples}

        Input text:

        {text}
        '''

        """
        class SimpleKGPipelineConfig(BaseModel):
        llm: LLMInterface
        driver: neo4j.Driver
        from_pdf: bool
        embedder: Embedder
        entities: list[SchemaEntity] = Field(default_factory=list)
        relations: list[SchemaRelation] = Field(default_factory=list)
        potential_schema: list[tuple[str, str, str]] = Field(default_factory=list)
        pdf_loader: Any = None
        kg_writer: Any = None
        text_splitter: Any = None
        on_error: OnError = OnError.RAISE
        prompt_template: Union[ERExtractionTemplate, str] = ERExtractionTemplate()
        perform_entity_resolution: bool = True
        lexical_graph_config: Optional[LexicalGraphConfig] = None
        neo4j_database: Optional[str] = None

        model_config = ConfigDict(arbitrary_types_allowed=True)
        """

        entities_noblivion = [
        "Person",
        "City",
        "Country",
        "Job",
        "Organization",
        "Pet",
        "MedicalCondition",
        "MedicalProcedure",
        "Car",
        "House",
        "Book",
        "Movie",
        "Series"
        ]

        relations_noblivion = [
        "TRAVELED_TO",
        "FIRST_MET",
        "BOUGHT",
        "WATCHED",
        "HAS_READ",
        "IS_FRIEND_OF",
        "SOLD",
        "WORKED_AT",
        "LIKED",
        "HATED",
        "LIVED_IN",
        "HAPPENED_IN"
        ]

        # Build KG and Store in Neo4j Database
        kg_builder_txt = SimpleKGPipeline(
             llm=ex_llm,
             driver=neo4j_driver,
             embedder=embedder,
             relations=relations_noblivion,
             entities=entities_noblivion,
             text_splitter=FixedSizeSplitter(chunk_size=2000, chunk_overlap=500),
             prompt_template=prompt_for_noblivion,
             from_pdf=False
        )
        logger.info("...Executing RAG pipeline")
        start_time = time.time()
        await kg_builder_txt.run_async(text=f'{memory_text} category {category} location {location}') 
        end_time = time.time()
        execution_time = end_time - start_time
        logger.info(f"...> RAG pipeline execution time: {execution_time} seconds")

        return ""
```

### services/email.py
```
# services/email.py
import os
from mailersend import emails
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.api_key = os.getenv('MAILERSEND_API_KEY')
        self.sender_domain = os.getenv('MAILERSEND_SENDER_EMAIL')
        self.mailer = emails.NewEmail(self.api_key)

    def send_verification_email(self, to_email: str, verification_code: str):
        try:
            # Read template
            template_path = Path("templates/account-verification-en.html")
            with open(template_path, "r") as f:
                html_content = f.read()

            # Replace placeholder
            html_content = html_content.replace("{verification_code}", verification_code)

            # Prepare empty mail body
            mail_body = {}

            # Set sender
            mail_from = {
                "name": "Noblivion",
                "email": self.sender_domain
            }
            self.mailer.set_mail_from(mail_from, mail_body)

            # Set recipient
            recipients = [
                {
                    "name": to_email,
                    "email": to_email
                }
            ]
            self.mailer.set_mail_to(recipients, mail_body)

            # Set subject
            self.mailer.set_subject("Verify your Noblivion account", mail_body)

            # Set content
            self.mailer.set_html_content(html_content, mail_body)
            self.mailer.set_plaintext_content(
                f"Your verification code is: {verification_code}", 
                mail_body
            )

            # Send email synchronously
            return self.mailer.send(mail_body)

        except Exception as e:
            print(f"Failed to send verification email: {str(e)}")
            raise
```

### services/profile.py
```
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, UUID4
from supabase import create_client, Client
import os
import logging
import json
from models.profile import Profile, ProfileCreate
from models.memory import MemoryCreate, Category, Memory, Location
from services.memory import MemoryService
import openai
from uuid import UUID, uuid4

logger = logging.getLogger(__name__)

# Service Class
class ProfileService:
    table_name = "profiles"

    def __init__(self):
        self.supabase = create_client(
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY")
        )
        self.openai_client = openai.Client(
            api_key=os.getenv("OPENAI_API_KEY")
        )

    async def parse_backstory(self, profile_id: UUID, backstory: str, profile_data: Dict[str, Any], language: str = "de") -> None:
        """Parse memories from backstory and create initial memories in the specified language"""
        try:
            logger.info(f"Parsing backstory for profile {profile_id} in language {language}")

            # Create single session for all initial memories
            session_data = {
                "id": str(uuid4()),
                "profile_id": str(profile_id),
                "category": "initial",
                "started_at": datetime.utcnow().isoformat(),
                "emotional_state": {"initial": "neutral"},
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            # Create session
            try:
                session_result = self.supabase.table("interview_sessions").insert(session_data).execute()
                if not session_result.data:
                    raise Exception("Failed to create interview session")
                session_id = session_result.data[0]['id']
                logger.info(f"Created interview session: {session_id}")
            except Exception as e:
                logger.error(f"Failed to create interview session: {str(e)}")
                raise

            # Use the same session_id for all memories

            # Create birth memory
            try:
                city = profile_data['place_of_birth'].split(',')[0].strip()
                country = profile_data['place_of_birth'].split(',')[-1].strip()

                birth_description = {
                    "de": f"{profile_data['first_name']} {profile_data['last_name']} wurde in {profile_data['place_of_birth']} geboren",
                    "en": f"{profile_data['first_name']} {profile_data['last_name']} was born in {profile_data['place_of_birth']}"
                }.get(language, f"{profile_data['first_name']} {profile_data['last_name']} was born in {profile_data['place_of_birth']}")

                birth_memory = MemoryCreate(
                    category=Category.CHILDHOOD,
                    description=birth_description,
                    time_period=datetime.strptime(profile_data['date_of_birth'], "%Y-%m-%d"),
                    location=Location(
                        name=profile_data['place_of_birth'],
                        city=city,
                        country=country,
                        description="Geburtsort" if language == "de" else "Place of birth"
                    )
                )

                await MemoryService.create_memory(birth_memory, profile_id, session_id)
                logger.info("Birth memory created successfully")

            except Exception as e:
                logger.error(f"Error creating birth memory: {str(e)}")

            # Get narrator settings from user profile
            user_result = self.supabase.table("users").select("profile").eq("id", str(profile_id)).execute()
            user_profile = user_result.data[0].get("profile", {}) if user_result.data else {}

            # Get narrative settings with defaults
            narrator_perspective = user_profile.get("narrator_perspective", "ego")
            narrator_style = user_profile.get("narrator_style", "neutral")
            narrator_verbosity = user_profile.get("narrator_verbosity", "normal")

            # Convert perspective setting to prompt text
            perspective_text = "in first person view" if narrator_perspective == "ego" else "in third person view"

            # Convert style setting to prompt text
            style_text = {
                "professional": "using a clear and professional tone",
                "romantic": "using a warm and emotional tone",
                "optimistic": "using a positive and uplifting tone",
                "neutral": "using a balanced and neutral tone"
            }.get(narrator_style, "using a neutral tone")

            # Convert verbosity setting to prompt text
            verbosity_text = {
                "verbose": "more detailed and elaborate",
                "normal": "similar in length",
                "brief": "more concise and focused"
            }.get(narrator_verbosity, "similar in length")

            # Set temperature based on style
            temperature = {
                "professional": 0.1,
                "neutral": 0.3
            }.get(narrator_style, 0.7)

            logger.debug(f"Using narrative settings - perspective: {perspective_text}, style: {style_text}, verbosity: {verbosity_text}, temperature: {temperature}")

            # Parse and create additional memories using the SAME session_id
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": f"""Extract distinct memories from the backstory and format them as a JSON object.
                            The date is a single string in the format "YYYY-MM-DD". If it is a timespan always use the start date.
                            Write all text content in {language} language.

                            Format each memory {perspective_text}, {style_text}. 
                            Compared to the source text, your description should be {verbosity_text}.

                            For each memory in the "memories" array, provide:
                            {{
                                "description": "Full description of the memory in {language}",
                                "category": "One of: childhood/career/relationships/travel/hobbies/pets",
                                "date": "YYYY-MM-DD (approximate if not specified)",
                                "location": {{
                                    "name": "Location name",
                                    "city": "City if mentioned",
                                    "country": "Country if mentioned",
                                    "description": "Brief description of the location in {language}"
                                }}
                            }}"""
                        },
                        {
                            "role": "user",
                            "content": f"Please analyze this text and return the memories as JSON: {backstory}"
                        }
                    ],
                    response_format={ "type": "json_object" },
                    temperature=temperature
                )

                try:
                    parsed_memories = json.loads(response.choices[0].message.content)
                    logger.info(f"Parsed memories: {parsed_memories}")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {str(e)}")
                    logger.error(f"Raw response: {response.choices[0].message.content}")
                    raise Exception("Failed to parse OpenAI response")

                # Create all memories using the same session_id
                for memory_data in parsed_memories.get('memories', []):
                    try:
                        category_str = memory_data.get('category', 'childhood').upper()
                        category = getattr(Category, category_str, Category.CHILDHOOD)

                        logger.info("------------------- parsed memory -----------")
                        logger.info(category)
                        logger.info(memory_data.get('description'))
                        logger.info(memory_data.get('date'))

                        memory = MemoryCreate(
                            category=category,
                            description=memory_data['description'],
                            time_period=memory_data.get('date'),
                            location=Location(**memory_data['location']) if memory_data.get('location') else None
                        )

                        # Use the same session_id for all memories
                        await MemoryService.create_memory(memory, profile_id, session_id)
                        logger.debug(f"Created memory: {memory.description}")

                    except Exception as e:
                        logger.error(f"Error creating individual memory: {str(e)}")
                        continue

            except Exception as e:
                logger.error(f"Error parsing memories from backstory: {str(e)}")
                raise

        except Exception as e:
            logger.error(f"Error in parse_backstory: {str(e)}")
            raise Exception(f"Failed to parse backstory: {str(e)}")

    @classmethod
    async def get_all_profiles(cls) -> List[Profile]:
        """Get all profiles"""
        try:
            service = cls()

            # Direct SQL query to get profiles with their session counts
            query = """
                SELECT p.*,
                       (SELECT COUNT(*) 
                        FROM interview_sessions 
                        WHERE profile_id = p.id) as session_count
                FROM profiles p
                ORDER BY p.updated_at DESC
            """

            result = service.supabase.table('profiles').select("*").execute()

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

                    if isinstance(profile_data['subscribed_at'], str):
                        profile_data['subscribed_at'] = datetime.fromisoformat(profile_data['subscribed_at'])
                    else:
                        profile_data['subscribed_at'] = None

                    # Initialize metadata if it doesn't exist
                    if not profile_data.get('metadata'):
                        profile_data['metadata'] = {}

                    # Add session count to metadata
                    session_count_result = service.supabase.table('interview_sessions')\
                        .select('id', count='exact')\
                        .eq('profile_id', profile_data['id'])\
                        .execute()

                    profile_data['metadata']['session_count'] = session_count_result.count

                    profiles.append(Profile(**profile_data))
                except Exception as e:
                    logger.error(f"Error converting profile data: {str(e)}")
                    logger.error(f"Problematic profile data: {profile_data}")
                    continue

            return profiles

        except Exception as e:
            logger.error(f"Error fetching all profiles: {str(e)}")
            raise

    @classmethod
    async def create_profile(cls, profile_data: ProfileCreate, language: str = "en") -> Profile:
        """Creates a new profile and initializes memories from backstory"""
        try:
            service = cls()  # Create instance

            # Extract backstory from metadata if present
            backstory = None
            metadata = profile_data.metadata if hasattr(profile_data, 'metadata') else {}
            if isinstance(metadata, dict):
                backstory = metadata.get('backstory')

            # Prepare profile data for database
            data = {
                "first_name": profile_data.first_name,
                "last_name": profile_data.last_name,
                "date_of_birth": profile_data.date_of_birth.isoformat(),
                "place_of_birth": profile_data.place_of_birth,
                "gender": profile_data.gender,
                "children": profile_data.children,
                "spoken_languages": profile_data.spoken_languages,
                "profile_image_url": profile_data.profile_image_url,
                "metadata": metadata,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            # Insert profile into database
            result = service.supabase.table(service.table_name).insert(data).execute()

            if not result.data:
                raise Exception("No data returned from profile creation")

            profile_id = result.data[0]['id']
            created_profile = Profile(**result.data[0])

            # Parse backstory and create initial memories if backstory exists
            if backstory:
                await service.parse_backstory(
                    profile_id=profile_id,
                    backstory=backstory,
                    profile_data=data,
                    language=language  # Pass the language parameter
                )

            return created_profile

        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
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
        Deletes a profile and all associated data by ID.
        """
        try:
            service = ProfileService()

            # First get the profile to check if it exists and get image URL
            result = service.supabase.table("profiles").select("*").eq("id", str(profile_id)).execute()

            if not result.data:
                return False

            profile = result.data[0]

            # Delete profile image from storage if it exists
            if profile.get('profile_image_url'):
                try:
                    # Extract filename from URL
                    filename = profile['profile_image_url'].split('/')[-1]
                    service.supabase.storage.from_("profile-images").remove([filename])
                    logger.debug(f"Deleted profile image: {filename}")
                except Exception as e:
                    logger.warning(f"Failed to delete profile image: {str(e)}")

            # Delete all related data
            # Note: Due to cascade delete in Supabase, we only need to delete the profile
            result = service.supabase.table("profiles").delete().eq("id", str(profile_id)).execute()

            if result.data:
                logger.info(f"Successfully deleted profile {profile_id} and all associated data")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to delete profile {profile_id}: {str(e)}")
            raise Exception(f"Failed to delete profile: {str(e)}")
```

### dependencies/auth.py
```
# dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from config.jwt import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
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

app = FastAPI(title="Noblivion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://8ede5a9c-1536-4919-b14f-82f6fd92faca-00-bvc5u3f2ay1d.janeway.replit.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

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

CREATE TABLE public.users (
    instance_id uuid, 
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    id uuid NOT NULL, 
    first_name text NOT NULL, 
    aud character varying(255), 
    last_name text NOT NULL, 
    email text NOT NULL, role character varying(255), 
    email character varying(255), 
    password text NOT NULL, 
    encrypted_password character varying(255), 
    created_at timestamp with time zone DEFAULT now(), 
    updated_at timestamp with time zone DEFAULT now(), 
    email_confirmed_at timestamp with time zone, 
    invited_at timestamp with time zone, 
    profile jsonb DEFAULT '{"is_validated_by_email": false}'::jsonb, 
    confirmation_token character varying(255), 
    confirmation_sent_at timestamp with time zone, 
    recovery_token character varying(255), 
    recovery_sent_at timestamp with time zone, 
    email_change_token_new character varying(255), 
    email_change character varying(255), 
    email_change_sent_at timestamp with time zone, 
    last_sign_in_at timestamp with time zone, 
    raw_app_meta_data jsonb, 
    raw_user_meta_data jsonb, is_super_admin boolean, created_at timestamp with time zone, updated_at timestamp with time zone, phone text DEFAULT NULL::character varying, phone_confirmed_at timestamp with time zone, phone_change text DEFAULT ''::character varying, phone_change_token character varying(255) DEFAULT ''::character varying, phone_change_sent_at timestamp with time zone, confirmed_at timestamp with time zone, email_change_token_current character varying(255) DEFAULT ''::character varying, email_change_confirm_status smallint DEFAULT 0, banned_until timestamp with time zone, reauthentication_token character varying(255) DEFAULT ''::character varying, reauthentication_sent_at timestamp with time zone, is_sso_user boolean NOT NULL DEFAULT false, deleted_at timestamp with time zone, is_anonymous boolean NOT NULL DEFAULT false);
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