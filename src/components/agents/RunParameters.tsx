// src/components/agents/RunParameters.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  TextField,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { Agent } from '../../types/agent';
import SchemaForm from './tabs/InputFormForSchema';
import { OperationService } from '../../services/operations';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`run-parameters-tabpanel-${index}`}
      aria-labelledby={`run-parameters-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `run-parameters-tab-${index}`,
    'aria-controls': `run-parameters-tabpanel-${index}`,
  };
}

interface CommChannel {
  type: 'email' | 'teams' | 'whatsapp';
  recipients: { address: string }[];
}

interface RunParametersProps {
  open: boolean;
  onClose: () => void;
  agent: Agent | null;
  onRunCreated: () => void;
}

const RunParameters: React.FC<RunParametersProps> = ({ open, onClose, agent, onRunCreated }) => {
  const { t } = useTranslation(['agents']);
  const [activeTab, setActiveTab] = useState(0);
  const [inputFormValid, setInputFormValid] = useState(false);
  const [inputFormData, setInputFormData] = useState<any>({});
  const [acceptLanguage, setAcceptLanguage] = useState('en');
  const [commChannels, setCommChannels] = useState<CommChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  // Reset form state when dialog opens with a new agent
  useEffect(() => {
    if (open && agent) {
      setActiveTab(0);
      setInputFormValid(!agent.input || Object.keys(agent.input).length === 0);
      setInputFormData({});
      setAcceptLanguage('en');
      setCommChannels([]);
    }
  }, [open, agent]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputFormChange = (valid: boolean, data: any) => {
    setInputFormValid(valid);
    setInputFormData(data);
  };

  const handleAddCommChannel = () => {
    setCommChannels([
      ...commChannels,
      {
        type: 'email',
        recipients: [{ address: '' }]
      }
    ]);
  };

  const handleRemoveCommChannel = (index: number) => {
    const updatedChannels = [...commChannels];
    updatedChannels.splice(index, 1);
    setCommChannels(updatedChannels);
  };

  const handleChangeChannelType = (index: number, value: 'email' | 'teams' | 'whatsapp') => {
    const updatedChannels = [...commChannels];
    updatedChannels[index].type = value;
    setCommChannels(updatedChannels);
  };

  const handleAddRecipient = (channelIndex: number) => {
    const updatedChannels = [...commChannels];
    updatedChannels[channelIndex].recipients.push({ address: '' });
    setCommChannels(updatedChannels);
  };

  const handleRemoveRecipient = (channelIndex: number, recipientIndex: number) => {
    const updatedChannels = [...commChannels];
    updatedChannels[channelIndex].recipients.splice(recipientIndex, 1);
    setCommChannels(updatedChannels);
  };

  const handleChangeRecipientAddress = (channelIndex: number, recipientIndex: number, value: string) => {
    const updatedChannels = [...commChannels];
    updatedChannels[channelIndex].recipients[recipientIndex].address = value;
    setCommChannels(updatedChannels);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleErrorDialogClose = () => {
    setErrorDialogOpen(false);
  };

  // Pre-flight check to verify agent endpoint is available
  const preFlightCheck = async (): Promise<boolean> => {
    if (!agent || !agent.agent_endpoint) {
      showErrorDialog(
        'Agent Endpoint Not Configured', 
        'The agent endpoint URL is missing. Please check agent configuration.'
      );
      return false;
    }

    try {
      // Send a HEAD request to the agent endpoint
      const response = await axios.head(agent.agent_endpoint, {
        timeout: 5000 // 5 second timeout
      });

      // Check if the response status is 200
      if (response.status === 200) {
        setSnackbarMessage('Agent is online');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return true;
      } else {
        showErrorDialog(
          'Agent Endpoint Error', 
          `The agent endpoint returned an unexpected status: ${response.status}. Please verify the agent is running correctly.`
        );
        return false;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      showErrorDialog(
        'Agent Connection Failed', 
        `Failed to connect to the agent endpoint. The service may be down or unreachable.\n\nError details: ${errorMsg}`
      );
      console.error('Pre-flight check failed:', error);
      return false;
    }
  };

  const showErrorDialog = (title: string, details: string) => {
    setErrorMessage(title);
    setErrorDetails(details);
    setErrorDialogOpen(true);
  };

  const handleCreateRun = async () => {
    if (!agent) return;

    try {
      setIsLoading(true);

      // Perform pre-flight check
      const isAgentAvailable = await preFlightCheck();

      // Only proceed if the agent is available
      if (isAgentAvailable) {
        // Prepare the run parameters
        const runParams = {
          ...inputFormData,
          'Accept-Language': acceptLanguage
        };

        // Only add commChannels if there are any defined
        if (commChannels.length > 0) {
          runParams.commChannels = commChannels;
        }

        try {
          // Call the API to start a new run
          await OperationService.startRun(agent.id, runParams);

          // Close the dialog first to prevent UI freezing
          onClose();

          // Then notify parent component to refresh data
          onRunCreated();
        } catch (error) {
          // Handle API errors
          const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
          const errorDetails = error.response?.data?.details || 
                              error.response?.data?.error || 
                              JSON.stringify(error.response?.data || {}, null, 2);

          showErrorDialog(
            'Failed to Create Run', 
            `The server encountered an error while creating the run.\n\nError: ${errorMsg}\n\n${errorDetails}`
          );
        }
      }
    } catch (error) {
      showErrorDialog(
        'Unexpected Error', 
        `An unexpected error occurred: ${error.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Run parameters for agent <b>{agent?.title.en}</b>
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {agent ? (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="run parameters tabs">
                  <Tab label="Input" {...a11yProps(0)} />
                  <Tab label="Content" {...a11yProps(1)} />
                  <Tab label="Human Feedback" {...a11yProps(2)} />
                </Tabs>
              </Box>

              {/* Input Tab */}
              <TabPanel value={activeTab} index={0}>
                {agent.input ? (
                  <SchemaForm
                    schema={agent.input}
                    onSubmit={() => {}}
                    onChange={handleInputFormChange}
                    isLoading={false}
                    hideSubmit={true}
                  />
                ) : (
                  <Typography color="text.secondary">
                    This agent doesn't require any input parameters.
                  </Typography>
                )}
              </TabPanel>

              {/* Content Tab */}
              <TabPanel value={activeTab} index={1}>
                <TextField
                  label="Accept-Language"
                  fullWidth
                  value={acceptLanguage}
                  onChange={(e) => setAcceptLanguage(e.target.value)}
                  margin="normal"
                />
                <FormHelperText>
                  The agent should produce new content in this language and indicate it by returning a corresponding 'Content-Language' parameter.
                </FormHelperText>
              </TabPanel>

              {/* Human Feedback Tab */}
              <TabPanel value={activeTab} index={2}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Communication Channels</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure how the agent will communicate with humans during execution.
                  </Typography>

                  {commChannels.length > 0 ? (
                    <List>
                      {commChannels.map((channel, channelIndex) => (
                        <Paper key={channelIndex} sx={{ mb: 2, p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <FormControl sx={{ width: '60%' }}>
                              <InputLabel id={`channel-type-label-${channelIndex}`}>Channel Type</InputLabel>
                              <Select
                                labelId={`channel-type-label-${channelIndex}`}
                                value={channel.type}
                                label="Channel Type"
                                onChange={(e) => handleChangeChannelType(channelIndex, e.target.value as 'email' | 'teams' | 'whatsapp')}
                              >
                                <MenuItem value="email">Email</MenuItem>
                                <MenuItem value="teams">Teams</MenuItem>
                                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                              </Select>
                            </FormControl>
                            <IconButton 
                              edge="end" 
                              aria-label="delete channel" 
                              onClick={() => handleRemoveCommChannel(channelIndex)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Recipients</Typography>
                          {channel.recipients.map((recipient, recipientIndex) => (
                            <Box key={recipientIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <TextField
                                label={`${channel.type === 'email' ? 'Email Address' : channel.type === 'teams' ? 'Teams ID' : 'WhatsApp Number'}`}
                                value={recipient.address}
                                onChange={(e) => handleChangeRecipientAddress(channelIndex, recipientIndex, e.target.value)}
                                sx={{ flex: 1, mr: 1 }}
                              />
                              <IconButton 
                                edge="end" 
                                aria-label="delete recipient" 
                                onClick={() => handleRemoveRecipient(channelIndex, recipientIndex)}
                                disabled={channel.recipients.length <= 1}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          ))}
                          <Button 
                            startIcon={<AddIcon />} 
                            onClick={() => handleAddRecipient(channelIndex)}
                            sx={{ mt: 1 }}
                          >
                            Add Recipient
                          </Button>
                        </Paper>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{ my: 2 }}>
                      No communication channels configured.
                    </Typography>
                  )}

                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddCommChannel}
                  >
                    Add Communication Channel
                  </Button>
                </Box>
              </TabPanel>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="contained"
                  onClick={handleCreateRun}
                  disabled={!inputFormValid || isLoading}
                  sx={{
                    backgroundColor: 'gold',
                    '&:hover': {
                      backgroundColor: '#DAA520',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#f9f0c8',
                    }
                  }}
                >
                  Create Run
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography color="error">
              No agent selected. Please try again.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog 
        open={errorDialogOpen} 
        onClose={handleErrorDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: '#FEE2E2', 
          color: '#B91C1C'
        }}>
          <ErrorIcon sx={{ mr: 1 }} />
          {errorMessage}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            {errorDetails}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleErrorDialogClose} color="primary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for non-error notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RunParameters;