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
  Fab,
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
import { Agent } from '../../../types/agent';
import { VaultService, Credential } from '../../../services/vault';

export const CredentialsTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCredential, setNewCredential] = useState<Credential>({
    service_name: '',
    key_name: '',
    secret_key: ''
  });

  const fetchCredentials = async () => {
    try {
      const data = await VaultService.getCredentials();
      // Sort by service_name, then by key_name
      const sortedData = data.sort((a, b) => {
        const serviceCompare = a.service_name.localeCompare(b.service_name);
        return serviceCompare !== 0 ? serviceCompare : a.key_name.localeCompare(b.key_name);
      });
      setCredentials(sortedData);
    } catch (err) {
      setError('Failed to fetch credentials');
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

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
      setNewCredential({ service_name: '', key_name: '', secret_key: '' });
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
              <TableCell>Service Name</TableCell>
              <TableCell>Key Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {credentials.map((credential, index) => (
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
                <TableCell>{credential.service_name}</TableCell>
                <TableCell>{credential.key_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedCredentials.size > 0 && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            Delete Credentials ({selectedCredentials.size})
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsAddDialogOpen(true)}
          startIcon={<AddIcon />}
        >
          Add Credential
        </Button>
      </Box>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add Credential</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Service Name"
            fullWidth
            value={newCredential.service_name}
            onChange={(e) => setNewCredential({
              ...newCredential,
              service_name: e.target.value
            })}
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
          />
          <TextField
            margin="dense"
            label="Secret"
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
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCredential} variant="contained">
            Add Credential
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};