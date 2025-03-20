// components/agents/tabs/CredentialsTab.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Collapse,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { useTranslation } from 'react-i18next';
import { Agent } from '../../../types/agent';
import { VaultService, Credential } from '../../../services/vault';
import { AgentService } from '../../../services/agents';
import AuthenticationDisplay from '../AuthenticationDisplay';

export const CredentialsTab: React.FC<{ agent: Agent, onAgentUpdated?: (agent: Agent) => void }> = ({ agent, onAgentUpdated }) => {
  const { t } = useTranslation(['agents', 'common']);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<Credential | null>(null);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Authentication state
  const [authentication, setAuthentication] = useState<string>(agent.authentication || 'none');
  const [headerName, setHeaderName] = useState<string>('');
  const [selectedKeyName, setSelectedKeyName] = useState<string>('');

  const [newCredential, setNewCredential] = useState<Credential>({
    service_name: agent.id,
    key_name: '',
    secret_key: ''
  });

  // Initialize authentication details
  useEffect(() => {
    if (agent.authentication?.startsWith('header:')) {
      const parts = agent.authentication.split(':');
      if (parts.length >= 2) {
        setAuthentication('header');
        const headerParts = parts[1].split(',');
        setHeaderName(headerParts[0]);
        if (headerParts.length >= 2) {
          setSelectedKeyName(headerParts[1]);
        }
      }
    } else if (agent.authentication?.startsWith('bearer-token:')) {
      setAuthentication('bearer-token');
      const keyName = agent.authentication.split(':')[1];
      setSelectedKeyName(keyName);
    } else if (agent.authentication?.startsWith('basic-auth:')) {
      setAuthentication('basic-auth');
      const keyName = agent.authentication.split(':')[1];
      setSelectedKeyName(keyName);
    } else {
      setAuthentication(agent.authentication || 'none');
      setSelectedKeyName('');
    }
  }, [agent.authentication]);

  // Get all credentials, not just for this agent
  useEffect(() => {
    fetchCredentials();
  }, []);

  const isDateOld = (date: string) => {
    const timestamp = new Date(date).getTime();
    const now = new Date().getTime();
    const thirtyDaysSecondsInMs = 2592000 * 1000;
    return (now - timestamp) > thirtyDaysSecondsInMs;
  };

  const fetchCredentials = async () => {
    try {
      const data = await VaultService.getCredentials();
      // Sort by key_name ascending
      const sortedData = data.sort((a, b) => a.key_name.localeCompare(b.key_name));
      setCredentials(sortedData);
    } catch (err) {
      setError('Failed to fetch credentials');
    }
  };

  const handleCheckboxChange = (id: string) => {
    const newSelected = new Set(selectedCredentials);
    if (selectedCredentials.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCredentials(newSelected);
  };

  const handleDelete = async () => {
    try {
      for (const id of selectedCredentials) {
        await VaultService.deleteCredential(id);
      }
      setSelectedCredentials(new Set());
      await fetchCredentials();
      setToastMessage('Credentials deleted successfully');
      setToastSeverity('success');
      setToastOpen(true);
    } catch (err) {
      setError('Failed to delete credentials');
    }
  };

  const handleAddCredential = async () => {
    try {
      if (!newCredential.service_name || !newCredential.key_name || !newCredential.secret_key) {
        setError('All fields are required');
        return;
      }
      await VaultService.createCredential(newCredential);
      setIsAddDialogOpen(false);
      setNewCredential({ service_name: agent.id, key_name: '', secret_key: '' });
      await fetchCredentials();
      setToastMessage('Credential added successfully');
      setToastSeverity('success');
      setToastOpen(true);
    } catch (err) {
      setError('Failed to add credential');
    }
  };

  const handleUpdateClick = (credential: Credential) => {
    setCurrentCredential(credential);
    setNewSecretKey('');
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateCredential = async () => {
    if (!currentCredential || !newSecretKey) {
      setError('New secret key is required');
      return;
    }

    try {
      // First delete the existing credential
      await VaultService.deleteCredential(currentCredential.id!);

      // Then create a new one with the same service_name and key_name but new secret_key
      await VaultService.createCredential({
        service_name: currentCredential.service_name,
        key_name: currentCredential.key_name,
        secret_key: newSecretKey
      });

      setIsUpdateDialogOpen(false);
      setCurrentCredential(null);
      setNewSecretKey('');
      await fetchCredentials();
      setToastMessage('Credential updated successfully');
      setToastSeverity('success');
      setToastOpen(true);
    } catch (err) {
      setError('Failed to update credential');
    }
  };

  const handleSaveAuthentication = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate key name is selected when authentication requires it
      if ((authentication === 'bearer-token' || authentication === 'basic-auth' || authentication === 'header') && !selectedKeyName) {
        setError('You must select a credential key name');
        setIsLoading(false);
        return;
      }

      // For header type, validate header name is provided
      if (authentication === 'header' && !headerName) {
        setError('Header name is required');
        setIsLoading(false);
        return;
      }

      // Prepare the authentication value based on the selected type
      let finalAuthentication = 'none';

      if (authentication === 'header') {
        finalAuthentication = `header:${headerName},${selectedKeyName}`;
      } else if (authentication === 'bearer-token') {
        finalAuthentication = `bearer-token:${selectedKeyName}`;
      } else if (authentication === 'basic-auth') {
        finalAuthentication = `basic-auth:${selectedKeyName}`;
      } else if (authentication === 'none') {
        finalAuthentication = 'none';
      }

      // Get the current agent data first to preserve all fields
      const currentAgent = await AgentService.getAgent(agent.id, false);
      if (!currentAgent) {
        throw new Error('Failed to retrieve current agent data');
      }

      // Create update object with all existing data plus updated authentication
      const updateData = {
        title: currentAgent.title,
        description: currentAgent.description,
        input: currentAgent.input,
        input_example: currentAgent.input_example,
        output: currentAgent.output,
        output_example: currentAgent.output_example,
        credits_per_run: currentAgent.credits_per_run,
        workflow_id: currentAgent.workflow_id,
        stars: currentAgent.stars,
        type: currentAgent.type || 'atom',
        authentication: finalAuthentication,
        icon_svg: currentAgent.icon_svg,
        max_execution_time_secs: currentAgent.max_execution_time_secs,
        agent_endpoint: currentAgent.agent_endpoint
      };

      // Call the API to update the agent
      const updatedAgent = await AgentService.updateAgent(agent.id, updateData, false);

      if (updatedAgent && onAgentUpdated) {
        onAgentUpdated(updatedAgent);
        setToastMessage('Authentication updated successfully');
        setToastSeverity('success');
        setToastOpen(true);
      }

      setIsEditing(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to update authentication';
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastSeverity('error');
      setToastOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (agent.authentication?.startsWith('header:')) {
      const parts = agent.authentication.split(':');
      if (parts.length >= 2) {
        setAuthentication('header');
        const headerParts = parts[1].split(',');
        setHeaderName(headerParts[0]);
        if (headerParts.length >= 2) {
          setSelectedKeyName(headerParts[1]);
        }
      }
    } else if (agent.authentication?.startsWith('bearer-token:')) {
      setAuthentication('bearer-token');
      const keyName = agent.authentication.split(':')[1];
      setSelectedKeyName(keyName);
    } else if (agent.authentication?.startsWith('basic-auth:')) {
      setAuthentication('basic-auth');
      const keyName = agent.authentication.split(':')[1];
      setSelectedKeyName(keyName);
    } else {
      setAuthentication(agent.authentication || 'none');
      setSelectedKeyName('');
      setHeaderName('');
    }

    setIsEditing(false);
    setError(null);
  };

  // Determine background color based on authentication type
  const getAuthBackgroundColor = () => {
    return authentication === 'none' ? '#ffebee' : '#f1f8e9';
  };

  // Handle toast close
  const handleToastClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setToastOpen(false);
  };

  // Custom Alert component for toasts
  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  return (
    <Box>

      <Typography variant="h6" sx={{ mb: 1 }}>Authentication</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        How is your agent core protected against public access?
      </Typography>

      {/* Side-by-side layout for Authentication and Credentials */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Authentication Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: getAuthBackgroundColor(),
            transition: 'background-color 0.3s ease'
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Authentication Type</Typography>
                {!isEditing ? (
                  <Button 
                    startIcon={<EditIcon />} 
                    onClick={() => setIsEditing(true)}
                    variant="outlined"
                    size="small"
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      startIcon={<CancelIcon />} 
                      onClick={handleCancel}
                      variant="outlined"
                      size="small"
                      color="error"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      startIcon={<SaveIcon />} 
                      onClick={handleSaveAuthentication}
                      variant="contained"
                      size="small"
                      color="primary"
                      disabled={isLoading}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {!isEditing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth variant="outlined" disabled>
                    <InputLabel>Authentication Type</InputLabel>
                    <Select
                      value={authentication}
                      label="Authentication Type"
                    >
                      <MenuItem value="none">{t('agents.auth_none')}</MenuItem>
                      <MenuItem value="bearer-token">{t('agents.auth_bearer')}</MenuItem>
                      <MenuItem value="header">{t('agents.auth_header')}</MenuItem>
                      <MenuItem value="basic-auth">{t('agents.auth_basic')}</MenuItem>
                    </Select>
                  </FormControl>

                  {authentication === 'header' && (
                    <TextField
                      fullWidth
                      label={t('agents.header_name')}
                      variant="outlined"
                      value={headerName}
                      disabled
                    />
                  )}

                  {authentication !== 'none' && (
                    <FormControl fullWidth variant="outlined" disabled>
                      <InputLabel>Credential Key</InputLabel>
                      <Select
                        value={selectedKeyName}
                        label="Credential Key"
                      >
                        <MenuItem value={selectedKeyName}>{selectedKeyName}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>
              ) : (
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="auth-type-label">Authentication Type</InputLabel>
                    <Select
                      labelId="auth-type-label"
                      value={authentication}
                      label="Authentication Type"
                      onChange={(e) => setAuthentication(e.target.value)}
                      disabled={isLoading}
                    >
                      <MenuItem value="none">{t('agents.auth_none')}</MenuItem>
                      <MenuItem value="bearer-token">{t('agents.auth_bearer')}</MenuItem>
                      <MenuItem value="header">{t('agents.auth_header')}</MenuItem>
                      <MenuItem value="basic-auth">{t('agents.auth_basic')}</MenuItem>
                    </Select>
                  </FormControl>

                  <Collapse in={authentication === 'header'}>
                    <TextField
                      fullWidth
                      label={t('agents.header_name')}
                      variant="outlined"
                      value={headerName}
                      onChange={(e) => setHeaderName(e.target.value)}
                      disabled={isLoading}
                      sx={{ mb: 2 }}
                    />
                  </Collapse>
                  
                  {authentication !== 'none' && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="credential-key-label">Credential Key</InputLabel>
                      <Select
                        labelId="credential-key-label"
                        value={selectedKeyName}
                        label="Credential Key"
                        onChange={(e) => setSelectedKeyName(e.target.value)}
                        disabled={isLoading}
                      >
                        {credentials.map((credential) => (
                          <MenuItem key={credential.id} value={credential.key_name}>
                            {credential.key_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                 
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Credentials Card - only show if authentication is not "none" */}
        {authentication !== 'none' && (
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Credentials</Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setIsAddDialogOpen(true)}
                    startIcon={<AddIcon />}
                    size="small"
                  >
                    Add New
                  </Button>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox"></TableCell>
                          <TableCell>Key Name (created at)</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {credentials.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No credentials found. Add new credentials using the button above.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          credentials.map((credential) => (
                            <TableRow
                              key={credential.id}
                              sx={{ 
                                backgroundColor: selectedKeyName === credential.key_name 
                                  ? 'rgba(255, 215, 0, 0.25)' 
                                  : '&:nth-of-type(odd)' ? 'action.hover' : 'transparent'
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedCredentials.has(credential.id!)}
                                  onChange={() => handleCheckboxChange(credential.id!)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  p: 0.5,
                                  borderRadius: 1
                                }}>
                                  <Typography variant="body2" 
                                    sx={{ 
                                      fontWeight: selectedKeyName === credential.key_name ? 'bold' : 'normal',
                                    }}
                                  >
                                    {credential.key_name}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color={isDateOld(credential.created_at!) ? 'warning.main' : 'text.secondary'}
                                  >
                                    ({new Date(credential.created_at!).toLocaleDateString()})
                                  </Typography>
                                  {isDateOld(credential.created_at!) && (
                                    <Chip
                                      icon={<WarningAmberIcon sx={{ marginLeft: '12px !important', color: 'white !important' }} />}
                                      label="Outdated"
                                      size="small"
                                      sx={{
                                        backgroundColor: 'warning.main',
                                        color: 'white',
                                        '& .MuiChip-icon': {
                                          color: 'white'
                                        }
                                      }}
                                    />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleUpdateClick(credential)}
                                  title="Update credential"
                                >
                                  <AutorenewIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {selectedCredentials.size > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDelete}
                      size="small"
                    >
                      Delete Selected ({selectedCredentials.size})
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add Credential Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add New Credential</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Service Name"
            fullWidth
            value={newCredential.service_name}
            onChange={(e) => setNewCredential({
              ...newCredential,
              service_name: e.target.value
            })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Key Name"
            fullWidth
            value={newCredential.key_name}
            onChange={(e) => setNewCredential({
              ...newCredential,
              key_name: e.target.value
            })}
            autoComplete="off"
            inputProps={{
              autoComplete: 'new-password',
              form: {
                autoComplete: 'off',
              },
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Secret Key"
            type={showSecret ? 'text' : 'password'}
            fullWidth
            value={newCredential.secret_key}
            onChange={(e) => setNewCredential({
              ...newCredential,
              secret_key: e.target.value
            })}
            autoComplete="off"
            inputProps={{
              autoComplete: 'new-password',
              form: {
                autoComplete: 'off',
              },
            }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowSecret(!showSecret)}
                  edge="end"
                >
                  {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddCredential} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Credential Dialog */}
      {/* Toast for success/error messages */}
      <Snackbar open={toastOpen} autoHideDuration={6000} onClose={handleToastClose}>
        <Alert onClose={handleToastClose} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>

      <Dialog open={isUpdateDialogOpen} onClose={() => setIsUpdateDialogOpen(false)}>
        <DialogTitle>Update Credential</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
            Updating credential: <strong>{currentCredential?.key_name}</strong>
          </Typography>
          <TextField
            margin="dense"
            label="New Secret Key"
            type={showSecret ? 'text' : 'password'}
            fullWidth
            value={newSecretKey}
            onChange={(e) => setNewSecretKey(e.target.value)}
            autoComplete="off"
            inputProps={{
              autoComplete: 'new-password',
              form: {
                autoComplete: 'off',
              },
            }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowSecret(!showSecret)}
                  edge="end"
                >
                  {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUpdateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateCredential} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};