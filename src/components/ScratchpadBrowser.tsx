// src/components/ScratchpadBrowser.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  LinearProgress,
  Divider
} from '@mui/material';
import { 
  Description as DocumentIcon, 
  Close, 
  Image as ImageIcon,
  OpenInNew as OpenInNewIcon,
  CloudUpload as CloudUploadIcon,
  Inbox as InboxIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { ScratchpadService } from '../services/scratchpad';
import { AgentService } from '../services/agents';
import { ScratchpadFile } from '../types/scratchpad';
import { Agent } from '../types/agent';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AgentIcon from './agents/AgentIcon';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

interface ScratchpadBrowserProps {
  runId: string;
}

interface AgentTab {
  id: string;
  title: string;
  files: ScratchpadFile[];
  agent?: Agent;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  size: number;
  error?: string;
}

const ScratchpadBrowser: React.FC<ScratchpadBrowserProps> = ({ runId }) => {
  // Define special IDs
  const INPUT_ID = 'input';
  const { t, i18n } = useTranslation(['agents', 'common'])
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [agentTabs, setAgentTabs] = useState<AgentTab[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<ScratchpadFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(false);

  // State for file uploads
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [inputFiles, setInputFiles] = useState<ScratchpadFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch scratchpad files using the authenticated endpoint
      const scratchpadData = await ScratchpadService.getScratchpadFiles(runId);

      if (!scratchpadData.files || Object.keys(scratchpadData.files).length === 0) {
        setAgentTabs([]);
        // Don't return yet - we still need to check for input files
      }

      // Fetch agent details for each agent_id if we have agent files
      if (scratchpadData.files && Object.keys(scratchpadData.files).length > 0) {
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

          // Set the first agent as active by default if we don't have input files
          if (tabs.length > 0 && activeAgentId === null) {
            setActiveAgentId(tabs[0].id);
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
      }

      // Fetch input files if they exist
      try {
        // The "input" is represented as a special path in the ScratchpadService
        // We need to fetch these files separately
        const inputData = await ScratchpadService.getInputFiles(runId);
        console.log('Fetched input files:', inputData);

        if (inputData && inputData.length > 0) {
          setInputFiles(inputData);

          // If we have input files and no active agent is set, default to input view
          if (activeAgentId === null) {
            setActiveAgentId(INPUT_ID);
          }
        } else {
          console.log('No input files found');
          setInputFiles([]);
        }
      } catch (inputError) {
        console.error('Error fetching input files:', inputError);
        setInputFiles([]);
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

  // Ensure activeAgentId is set after data is loaded
  useEffect(() => {
    // If we have input files but no activeAgentId, set it to input
    if (activeAgentId === null) {
      if (inputFiles.length > 0) {
        setActiveAgentId(INPUT_ID);
      } else if (agentTabs.length > 0) {
        // Otherwise set to first agent if available
        setActiveAgentId(agentTabs[0].id);
      }
    }
  }, [agentTabs, inputFiles, activeAgentId]);

  const handleTabChange = (agentId: string) => {
    setActiveAgentId(agentId);
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

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadError(null);

    // Create tracking objects for each file
    const newUploadingFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      name: file.name,
      progress: 0,
      size: file.size
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload each file and track progress
    acceptedFiles.forEach((file, index) => {
      const uploadId = newUploadingFiles[index].id;

      // Start upload
      ScratchpadService.uploadInputFile(runId, file, (progress) => {
        // Update progress for this specific file
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadId ? {...f, progress} : f
          )
        );
      })
      .then(() => {
        // Mark as complete
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadId ? {...f, progress: 100} : f
          )
        );

        // After a successful upload, refresh the input files list
        setTimeout(() => {
          // Remove completed file from upload list
          setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));

          // Refresh input files
          ScratchpadService.getInputFiles(runId)
            .then(inputData => {
              setInputFiles(inputData);
            })
            .catch(err => {
              console.error('Error refreshing input files:', err);
            });
        }, 1000); // Allow time to see 100% before removing
      })
      .catch(err => {
        console.error('Error uploading file:', err);
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadId ? {...f, progress: 0, error: 'Upload failed'} : f
          )
        );
        setUploadError(`Failed to upload ${file.name}: ${err.message}`);
      });
    });
  }, [runId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    // Prevent the browser from opening the file
    noClick: uploadingFiles.length > 0
  });

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
          sx={{
            width: 80,
            height: 60, // 4:3 aspect ratio for the container
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: '#f0f0f0', // Light background for image container
          }}
        >
          <Box 
            component="img"
            src={file.metadata.url}
            alt={file.filename}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover', // This maintains aspect ratio and crops if needed
              cursor: 'pointer'
            }}
          />
        </Box>
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

  if (agentTabs.length === 0 && inputFiles.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No files found for this run.
      </Alert>
    );
  }

  // Get files for the current active agent
  const currentAgentFiles = 
    activeAgentId === INPUT_ID 
      ? inputFiles 
      : agentTabs.find(tab => tab.id === activeAgentId)?.files || [];

 
  return (
    <Box sx={{ width: '100%', display: 'flex' }}>
      {/* Vertical agent sidebar with input icon at the top */}
      <Box sx={{ 
        width: '80px', 
        borderLeft: 1, 
        borderColor: 'divider',
        bgcolor: '#f5f5f5'
      }}>
        <List>
          {/* Input files icon at the top */}
          <ListItem key="input-files" disablePadding>
            <Tooltip title="Input Files" placement="right">
              <ListItemButton 
                selected={activeAgentId === INPUT_ID}
                onClick={() => handleTabChange(INPUT_ID)}
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  py: 2,
                  px: 1,
                  bgcolor: activeAgentId === INPUT_ID ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                }}
              >
                <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
                  <CloudUploadIcon color={activeAgentId === INPUT_ID ? "primary" : "inherit"} />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>

          {/* Divider between input icon and agent icons */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 2, my: 1 }} />

          {/* Agent icons */}
          {agentTabs.map((tab) => (
            <ListItem key={tab.id} disablePadding>
              <Tooltip title={tab.title} placement="right">
                <ListItemButton 
                  selected={activeAgentId === tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    py: 2,
                    px: 1,
                    bgcolor: activeAgentId === tab.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                  }}
                >
                  {tab.agent ? (
                    <AgentIcon 
                      agent={tab.agent} 
                      isActive={activeAgentId === tab.id}
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
        {/* Title based on current view */}
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {activeAgentId === INPUT_ID 
            ? 'Input Files' 
            : `${agentTabs.find(tab => tab.id === activeAgentId)?.title || 'Agent'} ${t('agents.output')}`}
        </Typography>

        {/* Show uploaded input files first when on input view */}
        {activeAgentId === INPUT_ID && inputFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" component="h3" sx={{ mb: 1 }}>
              Uploaded Files
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {inputFiles.map((file) => (
                <Grid item key={file.id} xs={6} sm={4} md={3} lg={2}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: 140,
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover .delete-icon': {
                        display: 'flex'
                      }
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
                    {/* Delete icon overlay - can be implemented in the future */}
                    {/* <Box 
                      className="delete-icon"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        display: 'none',
                        p: 0.5,
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '0 0 0 4px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle delete functionality here
                      }}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </Box> */}
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ mb: 3 }} />
          </Box>
        )}

        {/* Show upload area only for input files */}
        {activeAgentId === INPUT_ID && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" component="h3" sx={{ mb: 1 }}>
              Upload New Files
            </Typography>
            {/* File drop zone */}
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.400',
                borderRadius: 2,
                p: 3,
                mb: 3,
                textAlign: 'center',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                minHeight: '150px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: uploadingFiles.length > 0 ? 'default' : 'pointer'
              }}
            >
              <input {...getInputProps()} />

              {uploadingFiles.length > 0 ? (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Uploading {uploadingFiles.length} {uploadingFiles.length === 1 ? 'file' : 'files'}
                  </Typography>

                  {uploadingFiles.map(file => (
                    <Box key={file.id} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{file.name}</span>
                        <span>{Math.round(file.progress)}%</span>
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={file.progress} 
                        sx={{ 
                          mt: 0.5,
                          height: 8,
                          borderRadius: 1,
                          bgcolor: file.error ? 'error.light' : undefined 
                        }} 
                      />
                      {file.error && (
                        <Typography variant="caption" color="error">
                          {file.error}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <>
                  <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" component="p">
                    Drop files here, or click to select
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload files to be processed by the agents
                  </Typography>
                </>
              )}
            </Box>

            {uploadError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {uploadError}
              </Alert>
            )}
          </Box>
        )}

        {/* File grid for agent files */}
        {activeAgentId !== INPUT_ID && (
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
        )}
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