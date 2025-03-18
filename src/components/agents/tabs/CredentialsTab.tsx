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
  Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
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
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  // Filter credentials for current agent
  const filteredCredentials = credentials.filter(
    cred => cred.service_name === agent.id
  );

  useEffect(() => {
    fetchCredentials();
    // Initialize new credential with agent.id
    setNewCredential(prev => ({
      ...prev,
      service_name: agent.id
    }));
  }, [agent.id]);

  const isDateOld = (date: string) => {
    const timestamp = new Date(date).getTime();
    const now = new Date().getTime();
    const thirtyDaysSecondsInMs =  2592000 * 1000;
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
      setSuccess('Credential added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add credential');
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
        setSuccess('Authentication updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }

      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update authentication');
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

  // Determine if authentication editing should be enabled
  const authEditingDisabled = filteredCredentials.length === 0;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Authentication section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Authentication Settings</Typography>
            {!isEditing ? (
              <Button 
                startIcon={<EditIcon />} 
                onClick={() => setIsEditing(true)}
                variant="outlined"
                size="small"
                disabled={authEditingDisabled}
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

          {authEditingDisabled && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Add at least one credential to enable authentication settings.
            </Alert>
          )}

          {!isEditing ? (
            <AuthenticationDisplay authType={agent.authentication || 'none'} />
          ) : (
            <Box sx={{ mt: 2 }}>
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
                    {filteredCredentials.map((credential) => (
                      <MenuItem key={credential.id} value={credential.key_name}>
                        {credential.key_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

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
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Credentials Table section */}
      <Typography variant="h6" sx={{ mb: 2 }}>API Credentials</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>{t('agents.credentials.modal.key_name')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCredentials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No credentials found. Add new credentials using the button below.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCredentials.map((credential) => (
                <TableRow
                  key={credential.id}
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCredentials.has(credential.id!)}
                      onChange={() => handleCheckboxChange(credential.id!)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography>{credential.key_name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="caption" 
                        color={isDateOld(credential.created_at!) ? 'warning.main' : 'text.secondary'}
                      >
                        {new Date(credential.created_at!).toLocaleString()}
                      </Typography>
                      {isDateOld(credential.created_at!) && (
                        <Chip
                          icon={<WarningAmberIcon sx={{ marginLeft: '12px !important', color: 'white !important' }} />}
                          label="Possibly outdated"
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        {selectedCredentials.size > 0 && (
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            {t('agents.credentials.delete_count', { count: selectedCredentials.size })}
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsAddDialogOpen(true)}
          startIcon={<AddIcon />}
          sx={{ ml: 'auto' }}
        >
          {t('agents.credentials.add_new')}
        </Button>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'start', 
          gap: 1,
          backgroundColor: '#f5f4ee',
          borderRadius: 1,
          p: 2,
          mt: 2
        }}
      >
        <InfoOutlinedIcon color="warning" fontSize="small" />
        <Typography color="warning.dark" sx={{ flex: 1 }}>
          {t('agents.credentials.note')}
        </Typography>
      </Box>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>{t('agents.credentials.modal.title')}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label={t('agents.credentials.modal.service_name')}
            fullWidth
            value={newCredential.service_name}
            InputProps={{
              readOnly: true,
            }}
            disabled
          />
          <TextField
            margin="dense"
            label={t('agents.credentials.modal.key_name')}
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
          />
          <TextField
            margin="dense"
            label={t('agents.credentials.modal.secret')}
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
            {t('agents.credentials.modal.cancel')}
          </Button>
          <Button onClick={handleAddCredential} variant="contained">
            {t('agents.credentials.modal.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};