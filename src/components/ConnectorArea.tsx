import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import Editor from '@monaco-editor/react';
import ContextService from '../services/contexts';

interface ConnectorAreaProps {
  connectorType: 'magic' | 'code';
  connectorJsCode: string;
  agentId: string;
  previousAgentIds: string[];
  promptText: string; // Add this prop to receive the prompt text
  onTypeChange: (type: 'magic' | 'code') => void;
  onCodeChange: (code: string) => void;
  onClose: () => void;
  onRemoveAgent: () => void;
}

const ConnectorArea: React.FC<ConnectorAreaProps> = ({
  connectorType,
  connectorJsCode,
  agentId,
  previousAgentIds,
  promptText, // Receive the prompt text from ChainEditor
  onTypeChange,
  onCodeChange,
  onClose,
  onRemoveAgent
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);
  const [testSucceeded, setTestSucceeded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Log to verify we're receiving the correct data
    console.log("ConnectorArea props:", {
      agentId,
      previousAgentIds,
      promptText
    });
  }, [agentId, previousAgentIds, promptText]);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Handler for Show Environment button
  const handleShowEnvironment = async () => {
    setIsLoading(true);
    try {
      // Use the actual prompt text and previousAgentIds from props
      const environmentData = await ContextService.simulateChainEnvironment(
        agentId,
        promptText || "Sample prompt for simulation", // Use the prompt text or a fallback
        previousAgentIds // This should contain all previous agent IDs in the chain
      );

      setModalTitle('Environment Variables');
      setModalContent(environmentData);
      setModalSuccess(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error showing environment:', error);
      setModalTitle('Error Fetching Environment');
      setModalContent({
        error: 'Failed to fetch environment data. Please try again.',
        details: error instanceof Error ? error.message : String(error)
      });
      setModalSuccess(false);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestChain = async () => {
    setIsLoading(true);
    try {
      const response = await ContextService.getAgentInputFromEnv(agentId, null);

      // For demonstration purposes, we're checking if we got a successful response by seeing 
      // if we received an object rather than an error message
      const isSuccess = response && typeof response === 'object' && !response.error;

      setModalTitle(isSuccess ? 'Parameters Found' : 'Parameters Incomplete');
      setModalContent(response);
      setModalSuccess(isSuccess);
      setTestSucceeded(isSuccess);
      setIsModalOpen(true);
    } catch (error) {
      setModalTitle('Error Testing Chain');
      setModalContent({ error: 'Failed to test chain parameters. Please try again.' });
      setModalSuccess(false);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsLoading(true);
    try {
      const code = await ContextService.getAgentInputTransformerFromEnv(agentId, null);

      // Check if we got a string (successful response) or an error object
      if (typeof code === 'string') {
        onCodeChange(code);
      } else {
        setModalTitle('Code Generation Failed');
        setModalContent(code);
        setModalSuccess(false);
        setIsModalOpen(true);
      }
    } catch (error) {
      setModalTitle('Error Generating Code');
      setModalContent({ error: 'Failed to generate transformer code. Please try again.' });
      setModalSuccess(false);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Default transformer code for Monaco editor
  const defaultTransformerCode = `// will be called in a code node in the n8n agent flow
function transform(env) {
      // transform variables in the environment
      // ...
      // return a valid input JSON for this agent
      return {} 
}`;

  // Initialize editor with default code if empty
  useEffect(() => {
    if (connectorType === 'code' && !connectorJsCode) {
      onCodeChange(defaultTransformerCode);
    }
  }, [connectorType, connectorJsCode, onCodeChange]);

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        background: '#efefef',
        borderRadius: 1,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleShowEnvironment}
            disabled={isLoading}
          >
            Show Environment
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleTestChain}
            disabled={isLoading}
          >
            Test Chain
          </Button>
          <Button
            variant="contained"
            color="secondary"
            sx={{ }}
            onClick={handleGenerateCode}
            disabled={!testSucceeded || isLoading}
          >
            Generate Code
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onRemoveAgent}
            disabled={isLoading}
          >
            Remove Agent
          </Button>
        </Stack>
        <IconButton
          onClick={onClose}
          sx={{ color: 'black' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
        <InputLabel id="connector-type-label" sx={{  }}>Input pre-processing</InputLabel>
        <Select
          labelId="connector-type-label"
          value={connectorType}
          onChange={(e) => onTypeChange(e.target.value as 'magic' | 'code')}
          label="Connector Type"
          sx={{
          
           
          }}
        >
          <MenuItem value="magic">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AutoFixHighIcon sx={{ mr: 1 }} />
              Magic (Auto-Transform)
            </Box>
          </MenuItem>
          <MenuItem value="code">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CodeIcon sx={{ mr: 1 }} />
              Code (JavaScript)
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {connectorType === 'code' && (
        <Box sx={{ height: 400, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Editor
            height="400px"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={connectorJsCode || defaultTransformerCode}
            onChange={(value) => onCodeChange(value || defaultTransformerCode)}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: 'on'
            }}
          />
        </Box>
      )}

      {connectorType === 'magic' && (
        <Box sx={{ p: 2, backgroundColor: '#f7f0dd', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Magic connector will automatically transform the output of the previous agent to match the input requirements of the next agent.
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            The connector will analyze the complete environment and the input schema of this agent to determine how to transform the data.
          </Typography>
        </Box>
      )}

      {/* Modal Dialog for Test Results */}
      <Dialog 
        open={isModalOpen} 
        onClose={closeModal}
        maxWidth="md"
        fullWidth
      >
        <Paper 
          sx={{ 
            border: modalSuccess ? '2px solid green' : '2px solid red',
            
            color: 'white'
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            color: modalSuccess ? 'green' : 'red'
          }}>
            {modalTitle}
            <IconButton 
              onClick={closeModal}
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                background: '#2d2d2d',
                p: 2,
                borderRadius: 1,
                overflowX: 'auto',
                '& pre': {
                  margin: 0,
                  fontFamily: 'monospace'
                }
              }}
            >
              <pre>{JSON.stringify(modalContent, null, 2)}</pre>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal} variant="outlined" sx={{  }}>
              Close
            </Button>
          </DialogActions>
        </Paper>
      </Dialog>
    </Box>
  );
};

export default ConnectorArea;