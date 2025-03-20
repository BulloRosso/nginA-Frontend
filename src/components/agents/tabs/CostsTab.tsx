import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Autocomplete, 
  TextField, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  DialogContentText
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import PolylineIcon from '@mui/icons-material/Polyline';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import DescriptionIcon from '@mui/icons-material/Description';
import ChatIcon from '@mui/icons-material/Chat';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import TimerIcon from '@mui/icons-material/Timer';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WorkflowIcon from '@mui/icons-material/AccountTree';
import { Agent } from '../../../types/agent';
import { TagService } from '../../../services/tags';
import { AgentService } from '../../../services/agents';
import { TagNode } from '../../../types/tag';
import { useTranslation } from 'react-i18next';

export const CostsTab: React.FC<{ agent: Agent; onAgentUpdated?: (agent: Agent) => void }> = ({ agent, onAgentUpdated }) => {
  const { t, i18n } = useTranslation(['tagging', 'agents']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [tagTree, setTagTree] = useState<TagNode[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({});

  // New state for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Form state
  const [formState, setFormState] = useState({
    description: agent.description.en,
    type: agent.type || 'atom',
    output_type: agent.output_type || 'other',
    credits_per_run: agent.credits_per_run,
    max_execution_time_secs: agent.max_execution_time_secs || 30,
    workflow_id: agent.workflow_id || '',
    agent_endpoint: agent.agent_endpoint || ''
  });

  // Helper function to translate tag display
  const translateTag = (fullTag: string): string => {
    const [category, name] = fullTag.split(':');
    if (!name) return t(`tagging.categories.${category}`);
    return t(`tagging.tags.${category}.${name}`);
  };

  useEffect(() => {
    fetchTags();
  }, [agent.id]);

  useEffect(() => {
    // Update form state when agent changes
    setFormState({
      description: agent.description.en,
      type: agent.type || 'atom',
      output_type: agent.output_type || 'other',
      credits_per_run: agent.credits_per_run,
      max_execution_time_secs: agent.max_execution_time_secs || 30,
      workflow_id: agent.workflow_id || '',
      agent_endpoint: agent.agent_endpoint || ''
    });
  }, [agent]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const agentTags = await TagService.getAgentTags(agent.id);
      setTags(agentTags);
      setSelectedTags(agentTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = async (newValue: string[]) => {
    try {
      setLoading(true);
      await TagService.setAgentTags(agent.id, newValue);
      setTags(newValue);
    } catch (error) {
      console.error('Error updating tags:', error);
      setError('Failed to update tags');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setInputValue(value);
    if (value.length > 1) {
      try {
        const suggestions = await TagService.getTagSuggestions(value);
        setTagSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }
  };

  const openTagDialog = async () => {
    try {
      setLoading(true);
      const tree = await TagService.getTagTree();
      setTagTree(tree);
      setSelectedTags([...tags]);

      // Initialize all categories as closed
      const initialOpenState = tree.reduce((acc, node) => {
        acc[node.id] = false;
        return acc;
      }, {} as { [key: string]: boolean });
      setOpenCategories(initialOpenState);

      setIsTagDialogOpen(true);
    } catch (error) {
      console.error('Error fetching tag tree:', error);
      setError('Failed to load tag tree');
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleDialogClose = () => {
    setIsTagDialogOpen(false);
  };

  const handleDialogConfirm = async () => {
    await handleTagChange(selectedTags);
    setIsTagDialogOpen(false);
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      // If we're exiting edit mode, show confirmation dialog
      setIsSaveDialogOpen(true);
    } else {
      // If we're entering edit mode, just set the state
      setIsEditMode(true);
    }
  };

  // Reset form to original values
  const resetForm = () => {
    setFormState({
      description: agent.description.en,
      type: agent.type || 'atom',
      output_type: agent.output_type || 'other',
      credits_per_run: agent.credits_per_run,
      max_execution_time_secs: agent.max_execution_time_secs || 30,
      workflow_id: agent.workflow_id || '',
      agent_endpoint: agent.agent_endpoint || ''
    });
    setIsEditMode(false);
  };

  // Save changes
  const saveChanges = async () => {
    try {
      setLoading(true);

              // Create updated agent object
      const updatedAgent = {
        ...agent,
        description: {
          ...agent.description,
          en: formState.description
        },
        type: formState.type,
        output_type: formState.output_type,
        credits_per_run: formState.credits_per_run,
        max_execution_time_secs: formState.max_execution_time_secs,
        workflow_id: formState.workflow_id || undefined,
        agent_endpoint: formState.agent_endpoint
      };

      // Update agent through service
      const result = await AgentService.updateAgent(agent.id, updatedAgent);

      if (result) {
        if (onAgentUpdated) {
          onAgentUpdated(result);
        }
        setError(null);
      } else {
        setError('Failed to update agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      setError('Failed to update agent');
    } finally {
      setLoading(false);
      setIsEditMode(false);
      setIsSaveDialogOpen(false);
    }
  };

  // Handle save dialog close
  const handleSaveDialogClose = (shouldSave: boolean) => {
    setIsSaveDialogOpen(false);
    if (shouldSave) {
      saveChanges();
    } else {
      resetForm();
    }
  };

  return (
    <Box p={0}>
      <Paper sx={{ p: 3, mb: 4, position: 'relative' }}>

        <Button 
          startIcon={<EditIcon />} 
          sx={{ position: 'absolute', top: 8, right: 8 }}
          onClick={toggleEditMode}
          variant="outlined"
          size="small"
        >
          {isEditMode ? <span>Save</span> : <span>Edit</span>}
        </Button>

        <Typography variant="h6"   sx={{ borderBottom: 'solid 1px #ccc'}}>
          Agent Classification
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Description */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
           
              {isEditMode ? (
                <TextField
                  fullWidth
                  label="Description (EN)"
                  multiline
                  rows={2}
                  value={formState.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  variant="outlined"
                />
              ) : (
                <Typography>
                  <strong>Description:</strong> {formState.description}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Type */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {formState.type === 'atom' && <ViewStreamIcon color="action" />}
              {formState.type === 'chain' && <PolylineIcon color="action" />}
              {formState.type === 'dynamic' && <AutoGraphIcon color="action" />}

              {isEditMode ? (
                <FormControl fullWidth>
                  <InputLabel>Agent Type</InputLabel>
                  <Select
                    value={formState.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    label="Agent Type"
                  >
                    <MenuItem value="atom">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ViewStreamIcon sx={{ mr: 1 }} /> Atom
                      </Box>
                    </MenuItem>
                    <MenuItem value="chain">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PolylineIcon sx={{ mr: 1 }} /> Chain
                      </Box>
                    </MenuItem>
                    <MenuItem value="dynamic">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AutoGraphIcon sx={{ mr: 1 }} /> Dynamic
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Typography>
                  <strong>Type:</strong> {formState.type.charAt(0).toUpperCase() + formState.type.slice(1)}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Output Type */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {formState.output_type === 'content-creation' && <DescriptionIcon color="action" />}
              {formState.output_type === 'conversational' && <ChatIcon color="action" />}
              {formState.output_type === 'other' && <MiscellaneousServicesIcon color="action" />}

              {isEditMode ? (
                <FormControl fullWidth>
                  <InputLabel>Output Type</InputLabel>
                  <Select
                    value={formState.output_type}
                    onChange={(e) => handleFormChange('output_type', e.target.value)}
                    label="Output Type"
                  >
                    <MenuItem value="content-creation">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon sx={{ mr: 1 }} /> Content Creation
                      </Box>
                    </MenuItem>
                    <MenuItem value="conversational">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ChatIcon sx={{ mr: 1 }} /> Conversational
                      </Box>
                    </MenuItem>
                    <MenuItem value="other">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MiscellaneousServicesIcon sx={{ mr: 1 }} /> Other
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Typography>
                  <strong>Output Type:</strong> {
                    formState.output_type === 'content-creation' ? 'Content Creation' : 
                    formState.output_type === 'conversational' ? 'Conversational' : 'Other'
                  }
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Credits Per Run */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCardIcon color="action" />

              {isEditMode ? (
                <TextField
                  fullWidth
                  label="Credits Per Run"
                  type="number"
                  InputProps={{
                    inputProps: { min: 0, max: 1000 },
                    endAdornment: <InputAdornment position="end">Cred.</InputAdornment>,
                  }}
                  value={formState.credits_per_run}
                  onChange={(e) => handleFormChange('credits_per_run', parseInt(e.target.value, 10) || 0)}
                  variant="outlined"
                />
              ) : (
                <Typography>
                  <strong>Credits Per Run:</strong> {formState.credits_per_run} Cred.
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Max Execution Time */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimerIcon color="action" />

              {isEditMode ? (
                <TextField
                  fullWidth
                  label="Max Execution Time"
                  type="number"
                  InputProps={{
                    inputProps: { min: 0, max: 60 },
                    endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                  }}
                  value={formState.max_execution_time_secs}
                  onChange={(e) => handleFormChange('max_execution_time_secs', parseInt(e.target.value, 10) || 0)}
                  variant="outlined"
                />
              ) : (
                <Typography>
                  <strong>Max Execution Time:</strong> {formState.max_execution_time_secs} sec
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} >
          <Typography variant="h6" gutterBottom sx={{ borderBottom: 'solid 1px #ccc'}}>
            External connections
          </Typography>
          </Grid>
          
          {/* Workflow ID */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkflowIcon color="action" />

              {isEditMode ? (
                <TextField
                  fullWidth
                  label="Workflow ID"
                  value={formState.workflow_id}
                  onChange={(e) => handleFormChange('workflow_id', e.target.value)}
                  variant="outlined"
                />
              ) : (
                <Typography>
                  <strong>Workflow ID:</strong> {formState.workflow_id || 'Not set'}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Agent Endpoint */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
             {isEditMode ? (
                <TextField
                  fullWidth
                  label="Agent Endpoint"
                  value={formState.agent_endpoint}
                  onChange={(e) => handleFormChange('agent_endpoint', e.target.value)}
                  variant="outlined"
                  placeholder="https://example.com/api/agent"
                />
              ) : (
                <Typography>
                  <strong>Endpoint:</strong> {formState.agent_endpoint || 'Not set'}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tags section remains mostly unchanged */}
      <Box sx={{ mt: 0 }}>
        <Paper sx={{ p: 3, mt: 0, mb: 0, position: 'relative' }}>
        <Typography variant="h6" sx={{ mt: 0, pt: 0 }} gutterBottom>
          Agent Tags
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 1 }}>
          <Autocomplete
            multiple
            value={tags}
            onChange={(_, newValue) => handleTagChange(newValue)}
            inputValue={inputValue}
            onInputChange={(_, value) => handleInputChange(value)}
            options={tagSuggestions}
            filterOptions={(x) => x}
            freeSolo
            getOptionLabel={(option) => translateTag(option)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option}
                  label={translateTag(option)}
                  {...getTagProps({ index })}
                  color="primary"
                  variant="outlined"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={t('tagging.input.label')}
                placeholder={t('tagging.input.placeholder')}
                fullWidth
                disabled={loading}
              />
            )}
            sx={{ flexGrow: 1 }}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={openTagDialog}
            sx={{ alignSelf: 'center' }}
            disabled={loading}
          >
            {t('tagging.input.select_button')}
          </Button>
        </Box>
        </Paper>
      </Box>

      {/* Tag selection dialog */}
      <Dialog
        open={isTagDialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('tagging.dialog.title')}</DialogTitle>
        <DialogContent>
          {tagTree.length > 0 ? (
            <List sx={{ width: '100%' }}>
              {tagTree.map((category) => (
                <React.Fragment key={category.id}>
                  <ListItem 
                    button 
                    onClick={() => toggleCategory(category.id)}
                    sx={{ 
                      bgcolor: '#f5f5f5',
                      '&:hover': {
                        bgcolor: '#eeeeee'
                      }
                    }}
                  >
                    <ListItemText 
                      primary={t(`tagging.categories.${category.name}`)}
                      primaryTypographyProps={{
                        fontWeight: 'bold'
                      }}
                    />
                    {openCategories[category.id] ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>
                  <Collapse in={openCategories[category.id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {category.children.map((tag) => (
                        <ListItem 
                          key={tag.id} 
                          sx={{ pl: 4 }}
                          button
                          onClick={() => handleTagSelect(tag.full_tag)}
                        >
                          <ListItemText
                            primary={
                              <Chip
                                label={t(`tagging.tags.${tag.category}.${tag.name}`)}
                                color={selectedTags.includes(tag.full_tag) ? "primary" : "default"}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagSelect(tag.full_tag);
                                }}
                              />
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography>{t('tagging.dialog.no_tags')}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>{t('tagging.dialog.cancel')}</Button>
          <Button onClick={handleDialogConfirm} variant="contained" disabled={loading}>
            {t('tagging.dialog.assign')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save confirmation dialog */}
      <Dialog
        open={isSaveDialogOpen}
        onClose={() => handleSaveDialogClose(false)}
      >
        <DialogTitle>Save Changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to save your changes to this agent?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleSaveDialogClose(false)}>Cancel</Button>
          <Button 
            onClick={() => handleSaveDialogClose(true)} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};