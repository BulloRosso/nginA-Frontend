// components/agents/TestAgentDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TextField,
  styled,
  IconButton,
} from '@mui/material';
import { Agent } from '../../types/agent';
import { AgentService } from '../../services/agents';
import ResponseEditor from './ResponseEditor'; 
import { Close as CloseIcon } from '@mui/icons-material';

interface TestAgentDialogProps {
  open: boolean;
  onClose: () => void;
  agent: Agent;
}

interface InputValues {
  [key: string]: string;
}

const ResizableTextField = styled(TextField)({
  '& .MuiInputBase-inputMultiline': {
    resize: 'vertical',
    minHeight: '24px'
  },
  '& .MuiInputBase-root': {
    backgroundColor: 'white'
  }
});

const StyledTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    backgroundColor: 'white'
  }
});

const StyledTableCell = styled(TableCell)({
  verticalAlign: 'top',
  paddingTop: '16px'
});

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const TestAgentDialog: React.FC<TestAgentDialogProps> = ({
  open,
  onClose,
  agent
}) => {
  const [inputValues, setInputValues] = useState<InputValues>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null); 
  
  const handleInputChange = (propertyName: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [propertyName]: value
    }));
  };

  const handleReset = () => {
    setInputValues({});
    setResponse(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AgentService.testAgent(agent.agent_endpoint,  inputValues);

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
        <TableContainer component={Paper} sx={{ mt: 1, mb: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Property</StyledTableCell>
                <StyledTableCell>Description</StyledTableCell>
                <StyledTableCell>Value</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(agent.input || {}).map(([propertyName, schema]) => (
                <StyledTableRow key={propertyName}>
                  <StyledTableCell><b>{propertyName}</b> ({schema.type})</StyledTableCell>
                  <StyledTableCell>{schema.description || '-'}</StyledTableCell>
                  <StyledTableCell>
                    {schema.type === 'text' ? (
                      <ResizableTextField
                        fullWidth
                        multiline
                        minRows={1}
                        value={inputValues[propertyName] || ''}
                        onChange={(e) => handleInputChange(propertyName, e.target.value)}
                        size="small"
                        error={Boolean(error)}
                      />
                    ) : (
                      <StyledTextField
                        fullWidth
                        value={inputValues[propertyName] || ''}
                        onChange={(e) => handleInputChange(propertyName, e.target.value)}
                        size="small"
                        error={Boolean(error)}
                      />
                    )}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 0, borderRadius: '8px' }}>
          <ResponseEditor 
            response={response}
            onReset={handleReset}
          />
        </Box>
        
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
        {response && (
      <Button 
          variant="outlined"
          color="secondary"
          onClick={handleReset}
        >
          Reset
        </Button>
        )}
        <span></span>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          sx={{ backgroundColor: 'gold' }}
        >
          {loading ? 'Testing...' : 'Invoke Agent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};