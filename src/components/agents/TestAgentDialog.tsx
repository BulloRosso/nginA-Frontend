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
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  const handleReset = () => {
    setResponseTime(null);
    setResponse(null);
    setError(null);
  };

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      setError(null);

      const startTime = Date.now();
      const response = await AgentService.testAgent(agent.agent_endpoint, formData);
      const endTime = Date.now();
      setResponseTime((endTime - startTime) / 1000); // Convert to seconds
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
          isLoading={loading}
        />

        {response && (
        <Box sx={{ mt: 2, borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ mr: 2 }}>
              <OutputIcon /> Response from agent
            </Typography>
            {responseTime !== null && (
              <Typography variant="body2" color="text.secondary">
                Response time: {responseTime.toFixed(2)}s
              </Typography>
            )}
          </Box>
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
    </Dialog>
  );
};