import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Collapse,
  Alert,
  Card,
  CardContent,
  CardHeader,
  FormHelperText,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  ExpandLess, 
  ExpandMore, 
  Refresh as RefreshIcon,
  Compare as CompareIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { marked } from 'marked';
import Editor from '@monaco-editor/react';
import { PromptService } from '../../services/prompts';
import { Prompt, PromptGrouped } from '../../types/prompts';
import MarkdownCSSEditor from './MarkdownCSSEditor';

const PromptEditor: React.FC = () => {
  // State for prompts and UI controls
  const [promptGroups, setPromptGroups] = useState<PromptGrouped[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // State for viewing and editing
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [editorContent, setEditorContent] = useState<string>('');

  // State for modals
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState<boolean>(false);
  const [cssDialogOpen, setCssDialogOpen] = useState<boolean>(false);
  const [newPromptName, setNewPromptName] = useState<string>('');
  const [newPromptNameError, setNewPromptNameError] = useState<string | null>(null);
  const [compareVersions, setCompareVersions] = useState<{older: Prompt | null, newer: Prompt | null}>({
    older: null,
    newer: null
  });

  // State for markdown styling
  const [markdownCSS, setMarkdownCSS] = useState<string>('');

  // Fetch prompts from API
  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompts = await PromptService.getPrompts();

      // Group prompts by name
      const groupedPrompts: Record<string, Prompt[]> = {};
      prompts.forEach(prompt => {
        if (!groupedPrompts[prompt.name]) {
          groupedPrompts[prompt.name] = [];
        }
        groupedPrompts[prompt.name].push(prompt);
      });

      // Create prompt groups with active prompt reference
      const groups: PromptGrouped[] = Object.entries(groupedPrompts).map(([name, prompts]) => {
        // Sort prompts by version in descending order (newest first)
        const sortedPrompts = [...prompts].sort((a, b) => b.version - a.version);
        const activePrompt = sortedPrompts.find(p => p.is_active) || sortedPrompts[0];

        return {
          name,
          prompts: sortedPrompts,
          activePrompt
        };
      });

      // Sort groups alphabetically by name
      const sortedGroups = groups.sort((a, b) => a.name.localeCompare(b.name));

      setPromptGroups(sortedGroups);

      // If we have a currently selected prompt, update it with the latest data
      if (selectedPrompt) {
        const updatedSelectedPrompt = prompts.find(p => p.id === selectedPrompt.id);
        if (updatedSelectedPrompt) {
          setSelectedPrompt(updatedSelectedPrompt);
          setEditorContent(updatedSelectedPrompt.prompt_text);
        }
      }
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Failed to load prompts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load saved CSS from localStorage
  useEffect(() => {
    const savedCSS = localStorage.getItem('markdownCSS');
    if (savedCSS) {
      setMarkdownCSS(savedCSS);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPrompts();
  }, []);

  // Get current prompt group
  const currentGroup = useMemo(() => {
    if (!selectedGroup) return null;
    return promptGroups.find(group => group.name === selectedGroup) || null;
  }, [selectedGroup, promptGroups]);

  // Handle prompt selection
  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setSelectedGroup(prompt.name);
    setEditorContent(prompt.prompt_text);
    setViewMode('preview');
  };

  // Toggle group expansion
  const toggleGroupExpand = (groupName: string) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupName]: !expandedGroups[groupName]
    });
  };

  // Handle view mode change
  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'preview' | 'edit' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Handle editor change
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
    }
  };

  // Save edited prompt (creates a new version since prompts are immutable)
  const savePrompt = async () => {
    if (!selectedPrompt || editorContent === selectedPrompt.prompt_text) return;

    try {
      setLoading(true);
      // Create a new prompt with the same name but updated content
      const newPrompt = await PromptService.createPrompt({
        name: selectedPrompt.name,
        prompt_text: editorContent,
        is_active: true // Make the new version active
      });

      await fetchPrompts();
      setSelectedPrompt(newPrompt);
      setViewMode('preview');
    } catch (err) {
      console.error('Error creating new version:', err);
      setError('Failed to create new version. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle saving CSS
  const handleSaveCSS = (css: string) => {
    setMarkdownCSS(css);
    localStorage.setItem('markdownCSS', css);
  };

  // Open CSS editor dialog
  const openCSSEditor = () => {
    setCssDialogOpen(true);
  };

  // Delete prompt
  const deletePrompt = async () => {
    if (!selectedPrompt) return;

    try {
      setLoading(true);
      await PromptService.deletePrompt(selectedPrompt.id);
      setSelectedPrompt(null);
      await fetchPrompts();
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError('Failed to delete prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete prompt group
  const deletePromptGroup = async () => {
    if (!selectedGroup) return;

    try {
      setLoading(true);
      await PromptService.deletePromptGroup(selectedGroup);
      setSelectedPrompt(null);
      setSelectedGroup(null);
      await fetchPrompts();
    } catch (err) {
      console.error('Error deleting prompt group:', err);
      setError('Failed to delete prompt group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open create dialog
  const openCreateDialog = () => {
    setNewPromptName('');
    setNewPromptNameError(null);
    setCreateDialogOpen(true);
  };

  // Validate prompt name
  const validatePromptName = (name: string): boolean => {
    if (!name) {
      setNewPromptNameError('Prompt name is required');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      setNewPromptNameError('Name can only contain letters, numbers, and underscores');
      return false;
    }

    setNewPromptNameError(null);
    return true;
  };

  // Create new prompt
  const createNewPrompt = async () => {
    if (!validatePromptName(newPromptName)) return;

    try {
      setLoading(true);
      const newPrompt = await PromptService.createPrompt({
        name: newPromptName,
        prompt_text: '# New Prompt\n\nEnter your prompt content here.'
      });

      setCreateDialogOpen(false);
      await fetchPrompts();
      setSelectedGroup(newPrompt.name);
      setSelectedPrompt(newPrompt);
      setEditorContent(newPrompt.prompt_text);
      setViewMode('edit');
    } catch (err) {
      console.error('Error creating prompt:', err);
      setError('Failed to create prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open compare dialog
  const openCompareDialog = async () => {
    if (!selectedPrompt || !currentGroup) return;

    // Find the current prompt's index in the list
    const currentIndex = currentGroup.prompts.findIndex(p => p.id === selectedPrompt.id);

    // Make sure we have a previous version to compare with
    if (currentIndex < 0 || currentIndex >= currentGroup.prompts.length - 1) return;

    // Get the current and previous prompt versions
    const newerPrompt = currentGroup.prompts[currentIndex];
    const olderPrompt = currentGroup.prompts[currentIndex + 1];

    console.log('Comparing prompts:', {
      newer: newerPrompt,
      older: olderPrompt
    });

    setCompareVersions({
      newer: newerPrompt,
      older: olderPrompt
    });

    setCompareDialogOpen(true);
  };

  // Handle version change
  const handleVersionChange = async (event: any) => {
    if (!currentGroup) return;

    const versionId = event.target.value;
    const selectedVersion = currentGroup.prompts.find(p => p.id === versionId);

    if (selectedVersion) {
      setSelectedPrompt(selectedVersion);
      setEditorContent(selectedVersion.prompt_text);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Prompt List Column */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={3} 
            sx={{ p: 0, height: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Fixed Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              height: '60px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6">Prompt Groups</Typography>
              <IconButton onClick={fetchPrompts} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>

            {/* Content Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {loading && promptGroups.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : promptGroups.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center">
                  No prompts found
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {promptGroups.map((group) => (
                    <React.Fragment key={group.name}>
                      <ListItemButton 
                        onClick={() => toggleGroupExpand(group.name)}
                        sx={{
                          bgcolor: selectedGroup === group.name ? 'action.selected' : 'inherit',
                          borderRadius: 1,
                          mb: 0.5
                        }}
                      >
                        <ListItemText 
                          primary={group.name} 
                          secondary={`${group.prompts.length} version${group.prompts.length !== 1 ? 's' : ''}`} 
                        />
                        {expandedGroups[group.name] ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                      <Collapse in={expandedGroups[group.name]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {group.prompts.map((prompt) => (
                            <ListItemButton 
                              key={prompt.id} 
                              sx={{ 
                                pl: 4,
                                bgcolor: selectedPrompt?.id === prompt.id ? 'action.selected' : 'inherit',
                                borderRadius: 1,
                                mb: 0.5
                              }}
                              onClick={() => handlePromptSelect(prompt)}
                            >
                              <ListItemText 
                                primary={`Version ${prompt.version}`} 
                                secondary={
                                  <>
                                    {prompt.is_active && (
                                      <Typography variant="caption" color="primary">
                                        Active
                                      </Typography>
                                    )}
                                    <Typography variant="caption" display="block">
                                      {new Date(prompt.created_at).toLocaleString()}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Prompt Preview/Editor Column */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 0, 
              height: '80vh', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            {/* Fixed Header */}
            <Box sx={{ 
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              height: '60px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Typography variant="h6">
                {selectedPrompt ? `${selectedPrompt.name} (v${selectedPrompt.version})` : 'Select a Prompt'}
              </Typography>
            </Box>

            {/* Content Area */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 2 }}>
              {loading && !selectedPrompt ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : !selectedPrompt ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    p: 3
                  }}
                >
                  <Typography variant="body1" color="textSecondary">
                    Select a prompt from the list to view or edit
                  </Typography>
                </Box>
              ) : viewMode === 'preview' ? (
                <Box 
                  sx={{ 
                    height: '100%', 
                    overflow: 'auto',
                    px: 2,
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }}
                >
                  <style>{markdownCSS}</style>
                  <div 
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{ 
                      __html: marked.parse(selectedPrompt.prompt_text) 
                    }} 
                  />
                </Box>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Editor
                    height="100%"
                    defaultLanguage="markdown"
                    theme="light"
                    value={editorContent}
                    onChange={handleEditorChange}
                    options={{
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={savePrompt}
                      disabled={loading || editorContent === selectedPrompt.prompt_text}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Footer with Toggle and Version Selector */}
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'background.paper'
            }}>
              {selectedPrompt && (
                <IconButton
                  color="primary"
                  onClick={openCSSEditor}
                  size="small"
                  title="Customize Markdown CSS"
                >
                  <SettingsIcon />
                </IconButton>
              )}

              {selectedPrompt && currentGroup && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    size="small"
                    sx={{ mr: 2 }}
                  >
                    <ToggleButton value="preview">
                      <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                      Preview
                    </ToggleButton>
                    <ToggleButton value="edit">
                      <EditIcon fontSize="small" sx={{ mr: 0.5 }} />
                      Editor
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="version-select-label">Version</InputLabel>
                    <Select
                      labelId="version-select-label"
                      id="version-select"
                      value={selectedPrompt.id}
                      label="Version"
                      onChange={handleVersionChange}
                    >
                      {currentGroup.prompts.map((prompt) => (
                        <MenuItem key={prompt.id} value={prompt.id}>
                          {`Version ${prompt.version}`}
                          {prompt.is_active ? ' (Active)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Prompt Actions Column */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 0, 
              height: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Fixed Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              height: '60px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Typography variant="h6">
                Actions
              </Typography>
            </Box>

            {/* Content Area */}
            <Box sx={{ 
              flexGrow: 1, 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2
            }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
                fullWidth
              >
                Create New
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                disabled={!selectedPrompt}
                onClick={deletePrompt}
                fullWidth
              >
                Delete Version
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                disabled={!selectedGroup}
                onClick={deletePromptGroup}
                fullWidth
              >
                Delete Group
              </Button>

              <Button
                variant="outlined"
                color="primary"
                startIcon={<CompareIcon />}
                disabled={
                  !selectedPrompt || 
                  !currentGroup || 
                  currentGroup.prompts.length <= 1 ||
                  currentGroup.prompts.findIndex(p => p.id === selectedPrompt.id) === currentGroup.prompts.length - 1
                }
                onClick={openCompareDialog}
                fullWidth
              >
                Compare Versions
              </Button>

              <Box sx={{ mt: 2, p: 2, bgcolor: '#fef6d5', borderRadius: 1, color: 'text.secondary' }}>
                <Typography variant="body2">
                  Prompts are immutable to create repeatable eval results! Remember you create a new version of the prompt every time you modify and save an existing prompt.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Create Prompt Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Prompt</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Prompt Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newPromptName}
            onChange={(e) => {
              setNewPromptName(e.target.value);
              validatePromptName(e.target.value);
            }}
            error={!!newPromptNameError}
            helperText={newPromptNameError || "Only letters, numbers, and underscores allowed"}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={createNewPrompt} 
            variant="contained"
            disabled={!newPromptName || !!newPromptNameError}
          >
            Create Prompt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Versions Dialog */}
      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { 
            height: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle>
          Compare Prompt Versions
          <Typography variant="subtitle1" color="textSecondary">
            {selectedGroup} - Version {compareVersions.newer?.version} vs. Version {compareVersions.older?.version}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {compareVersions.newer && compareVersions.older ? (
            <Editor
              height="100%"
              defaultLanguage="markdown"
              original={compareVersions.older.prompt_text}
              modified={compareVersions.newer.prompt_text}
              theme="light"
              options={{
                readOnly: true,
                renderSideBySide: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                hideUnchangedRegions: true
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS Customization Dialog */}
      <MarkdownCSSEditor
        open={cssDialogOpen}
        onClose={() => setCssDialogOpen(false)}
        initialCSS={markdownCSS}
        onSave={handleSaveCSS}
      />
    </Box>
  );
};

export default PromptEditor;