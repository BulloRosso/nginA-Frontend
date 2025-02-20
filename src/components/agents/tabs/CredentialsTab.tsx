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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import { Agent } from '../../../types/agent';
import { VaultService, Credential } from '../../../services/vault';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const CredentialsTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  const { t } = useTranslation(['agents']);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCredential, setNewCredential] = useState<Credential>({
    service_name: agent.id,
    key_name: '',
    secret_key: ''
  });

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
    } catch (err) {
      setError('Failed to add credential');
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>{t('agents.credentials.modal.key_name')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCredentials.map((credential) => (
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
                <TableCell>{credential.key_name}</TableCell>
              </TableRow>
            ))}
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