// src/components/ScratchpadBrowser.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Drawer,
  IconButton,
  CircularProgress,
  Paper,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import { 
  Description as DocumentIcon, 
  Close, 
  Image as ImageIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { ScratchpadService } from '../services/scratchpad';
import { AgentService } from '../services/agents';
import { ScratchpadFile } from '../types/scratchpad';
import { Agent } from '../types/agent';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AgentIcon from './agents/AgentIcon';

interface ScratchpadBrowserProps {
  runId: string;
}

interface AgentTab {
  id: string;
  title: string;
  files: ScratchpadFile[];
  agent?: Agent;
}

const ScratchpadBrowser: React.FC<ScratchpadBrowserProps> = ({ runId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [agentTabs, setAgentTabs] = useState<AgentTab[]>([]);
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<ScratchpadFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch scratchpad files using the authenticated endpoint
      const scratchpadData = await ScratchpadService.getScratchpadFiles(runId);

      if (!scratchpadData.files || Object.keys(scratchpadData.files).length === 0) {
        setAgentTabs([]);
        setLoading(false);
        return;
      }

      // Fetch agent details for each agent_id
      const agentIds = Object.keys(scratchpadData.files);
      const agentDetailsPromises = agentIds.map(id => AgentService.getAgent(id));

      try {
        const agentDetails = await Promise.all(agentDetailsPromises);

        // Create tabs with agent details
        const tabs: AgentTab[] = agentDetails.map((agent: Agent) => ({
          id: agent.id,
          title: agent.title.en || agent.id,
          files: scratchpadData.files[agent.id] || [],
          agent: agent
        }));

        setAgentTabs(tabs);

        // Set first tab as selected if available
        if (tabs.length > 0 && selectedTabIndex >= tabs.length) {
          setSelectedTabIndex(0);
        }
      } catch (agentError) {
        // If agent details fail, use agent IDs as fallback
        const tabs: AgentTab[] = agentIds.map(id => ({
          id,
          title: `Agent ${id.substring(0, 8)}`,
          files: scratchpadData.files[id] || []
        }));

        setAgentTabs(tabs);
        console.error('Error fetching agent details:', agentError);
      }
    } catch (err) {
      setError('Failed to load scratchpad files. Please try again.');
      console.error('Error fetching scratchpad data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runId) {
      fetchData();
    }
  }, [runId]);

  const handleTabChange = (index: number) => {
    setSelectedTabIndex(index);
  };

  const handleFileClick = async (file: ScratchpadFile) => {
    const fileExtension = getFileExtension(file.filename).toLowerCase();

    if (isImageFile(fileExtension)) {
      // Open image in new tab
      window.open(file.metadata.url, '_blank');
    } else if (isCodeFile(fileExtension)) {
      // Open in drawer with Monaco editor or Markdown renderer
      setSelectedFile(file);
      setDrawerOpen(true);
      setLoadingContent(true);

      try {
        const content = await ScratchpadService.fetchFileContent(file.metadata.url);
        setFileContent(content);
      } catch (err) {
        console.error('Error fetching file content:', err);
        setFileContent('Error loading file content');
      } finally {
        setLoadingContent(false);
      }
    } else {
      // For any other file type, open in new tab
      window.open(file.metadata.url, '_blank');
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedFile(null);
    setFileContent('');
  };

  const getFileExtension = (filename: string): string => {
    return filename.substring(filename.lastIndexOf('.') + 1) || '';
  };

  const isImageFile = (extension: string): boolean => {
    return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
  };

  const isCodeFile = (extension: string): boolean => {
    return ['yaml', 'yml', 'json', 'md', 'txt'].includes(extension);
  };

  const isMarkdownFile = (extension: string): boolean => {
    return extension === 'md';
  };

  const getFileIcon = (file: ScratchpadFile) => {
    const fileExtension = getFileExtension(file.filename).toLowerCase();

    if (isImageFile(fileExtension)) {
      return (
        <Box 
          component="img"
          src={file.metadata.url}
          alt={file.filename}
          sx={{
            width: 80,
            height: 80,
            objectFit: 'cover',
            borderRadius: 1,
            cursor: 'pointer'
          }}
        />
      );
    }

    // For files that will open in a new tab (not code or images)
    if (!isCodeFile(fileExtension)) {
      return (
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: 40,
            height: 40,
            cursor: 'pointer'
          }}
        >
          <DocumentIcon fontSize="large" />
          <OpenInNewIcon sx={{ fontSize: 14, mt: 0.5 }} />
        </Box>
      );
    }

    // For code files that will open in the editor
    return (
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 40,
          height: 40,
          cursor: 'pointer'
        }}
      >
        <DocumentIcon fontSize="large" />
      </Box>
    );
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = getFileExtension(filename).toLowerCase();
    const languageMap: Record<string, string> = {
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'txt': 'plaintext'
    };

    return languageMap[ext] || 'plaintext';
  };

  // Show just the filename without the path
  const getDisplayFilename = (filename: string): string => {
    return filename.split('/').pop() || filename;
  };

  // Render markdown content with marked and DOMPurify
  const renderMarkdown = (content: string): string => {
    const rawHtml = marked(content);
    return DOMPurify.sanitize(rawHtml);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (agentTabs.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No files found for this run.
      </Alert>
    );
  }

  const currentAgentFiles = agentTabs[selectedTabIndex]?.files || [];

  return (
    <Box sx={{ width: '100%', display: 'flex' }}>
      {/* Vertical agent sidebar */}
      <Box sx={{ 
        width: '80px', 
        borderLeft: 1, 
        borderColor: 'divider',
        bgcolor: '#f5f5f5'
      }}>
        <List>
          {agentTabs.map((tab, index) => (
            <ListItem key={tab.id} disablePadding>
              <Tooltip title={tab.title} placement="right">
                <ListItemButton 
                  selected={selectedTabIndex === index}
                  onClick={() => handleTabChange(index)}
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    py: 2,
                    px: 1,
                    bgcolor: selectedTabIndex === index ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                  }}
                >
                  {tab.agent ? (
                    <AgentIcon 
                      agent={tab.agent} 
                      isActive={selectedTabIndex === index}
                      size={40}
                    />
                  ) : (
                    <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
                      <ImageIcon />
                    </ListItemIcon>
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Content area */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Grid container spacing={2}>
          {currentAgentFiles.map((file) => (
            <Grid item key={file.id} xs={6} sm={4} md={3} lg={2}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: 140,
                  cursor: 'pointer'
                }}
                onClick={() => handleFileClick(file)}
              >
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  {getFileIcon(file)}
                </Box>
                <Typography 
                  variant="caption" 
                  align="center"
                  noWrap
                  sx={{ 
                    width: '100%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {getDisplayFilename(file.filename)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* File content drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '70%', md: '50%' },
            boxSizing: 'border-box',
          },
          // Increased z-index to appear above modal backdrop
          zIndex: (theme) => theme.zIndex.modal + 1
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" noWrap>
              {selectedFile ? getDisplayFilename(selectedFile.filename) : 'File Preview'}
            </Typography>
            <IconButton onClick={closeDrawer} aria-label="close">
              <Close />
            </IconButton>
          </Stack>

          {loadingContent ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {/* Conditional rendering based on file type */}
              {selectedFile && isMarkdownFile(getFileExtension(selectedFile.filename)) ? (
                // Markdown renderer using marked and DOMPurify
                <Box 
                  sx={{ 
                    p: 2, 
                    height: '70vh', 
                    overflow: 'auto',
                    '& img': { maxWidth: '100%' },
                    '& pre': { 
                      backgroundColor: '#f5f5f5',
                      padding: '1rem',
                      borderRadius: '4px',
                      overflow: 'auto'
                    },
                    '& code': { 
                      backgroundColor: '#f5f5f5',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    },
                    '& table': {
                      borderCollapse: 'collapse',
                      width: '100%',
                      marginBottom: '1rem'
                    },
                    '& th, & td': {
                      border: '1px solid #ddd',
                      padding: '8px'
                    },
                    '& th': {
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      textAlign: 'left',
                      backgroundColor: '#f2f2f2'
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(fileContent) }}
                />
              ) : (
                // Monaco editor for other code files
                <Editor
                  height="70vh"
                  defaultLanguage={selectedFile ? getLanguageFromExtension(selectedFile.filename) : 'plaintext'}
                  value={fileContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default ScratchpadBrowser;