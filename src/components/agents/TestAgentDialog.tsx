// components/agents/TestAgentDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  IconButton,
  Typography
} from '@mui/material';
import { Agent } from '../../types/agent';
import { AgentService } from '../../services/agents';
import ResponseEditor from './ResponseEditor';
import SchemaForm from './tabs/InputFormForSchema';
import { Close as CloseIcon } from '@mui/icons-material';
import InputIcon from '@mui/icons-material/Input';
import OutputIcon from '@mui/icons-material/Output';

interface TestAgentDialogProps {
  open: boolean;
  onClose: () => void;
  agent: Agent;
}

export const TestAgentDialog: React.FC<TestAgentDialogProps> = ({
  open,
  onClose,
  agent
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const handleReset = () => {
    setResponse(null);
    setError(null);
  };

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await AgentService.testAgent(agent.agent_endpoint, formData);
      setResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>Test Agent</div>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mb: 0 }}>
        <Typography variant="h6">
          <InputIcon /> Input parameters
        </Typography>
        <SchemaForm 
          schema={ agent.input || {} }
          onSubmit={handleSubmit}
        />

        {response && (
        <Box sx={{ mt: 2, borderRadius: '8px' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            <OutputIcon /> Response from agent
          </Typography>
          <ResponseEditor 
            response={response}
            onReset={handleReset}
          />
        </Box>
        )}

        {error && (
          <div style={{ color: 'red', marginTop: '16px' }}>
            {error}
          </div>
        )}
      </DialogContent>
      <DialogActions sx={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '24px 24px',
        flex: 1
      }}>
       
        <span></span>
        {loading && (
          <CircularProgress 
            size={24}
            thickness={6}
            sx={{
              color: 'primary',
              marginRight: 2
            }} 
          />
        )}
      </DialogActions>
    </Dialog>
  );
};