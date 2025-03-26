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
  connectorPrompt: string; // New prop for storing the prompt
  agentId: string;
  previousAgentIds: string[];
  promptText: string;
  onTypeChange: (type: 'magic' | 'code') => void;
  onCodeChange: (code: string) => void;
  onPromptChange: (prompt: string) => void; // New prop for handling prompt changes
  onClose: () => void;
  onRemoveAgent: () => void;
}

const ConnectorArea: React.FC<ConnectorAreaProps> = ({
  connectorType,
  connectorJsCode,
  connectorPrompt, // Add the new prop
  agentId,
  previousAgentIds,
  promptText,
  onTypeChange,
  onCodeChange,
  onPromptChange, // Add the new handler
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
      promptText,
      connectorPrompt
    });
  }, [agentId, previousAgentIds, promptText, connectorPrompt]);

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

  // Updated handleTestChain method for ConnectorArea.tsx

  const handleTestChain = async () => {
    setIsLoading(true);
    try {
      let response;

      // Use different methods based on connector type
      if (connectorType === 'magic') {
        console.log("Testing magic connector for agent:", agentId);
        console.log("Previous agents:", previousAgentIds);

        // For magic connectors, use the simulateChainMagic method
        response = await ContextService.simulateChainMagic(
          agentId, 
          promptText || "Sample prompt for simulation", 
          previousAgentIds,
          connectorPrompt || "" // Pass the connector prompt as transformation hints
        );
      } else {
        // For code connectors, use the existing method
        response = await ContextService.getAgentInputFromEnv(agentId, null);
      }

      // For demonstration purposes, we're checking if we got a successful response
      const isSuccess = response && typeof response === 'object' && !response.error;

      setModalTitle(isSuccess ? 'Parameters Found' : 'Parameters Incomplete');
      setModalContent(response);
      setModalSuccess(isSuccess);
      setTestSucceeded(isSuccess);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error testing chain:', error);

      // Handle different error types
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      setModalTitle('Error Testing Chain');
      setModalContent({ error: errorMessage });
      setModalSuccess(false);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsLoading(true);
    try {
      let generatedCode;

      // Base on connector type, choose the code generation approach
      if (connectorType === 'magic') {
        console.log("Generating code from magic connector prompt");

        // Call the new endpoint to generate code from the magic prompt
        const response = await ContextService.generateChainCode(
          agentId,
          promptText || "Sample prompt for simulation",
          previousAgentIds,
          connectorPrompt || ""
        );

        if (response && response.code) {
          generatedCode = response.code;
        } else if (response && response.error) {
          setModalTitle('Code Generation Failed');
          setModalContent(response);
          setModalSuccess(false);
          setIsModalOpen(true);
          setIsLoading(false);
          return;
        }
      } else {
        // For existing code connector type, use the existing method
        const code = await ContextService.getAgentInputTransformerFromEnv(agentId, null);

        // Check if we got a string (successful response) or an error object
        if (typeof code === 'string') {
          generatedCode = code;
        } else {
          setModalTitle('Code Generation Failed');
          setModalContent(code);
          setModalSuccess(false);
          setIsModalOpen(true);
          setIsLoading(false);
          return;
        }
      }

      // If we got code, update the connector properties
      if (generatedCode) {
        // Update the code
        onCodeChange(generatedCode);

        // Switch to code connector type
        onTypeChange('code');

        // Mark connector as valid
        // Note: This might need to be done in the parent component depending on your architecture
        // If onTypeChange doesn't handle this, you might need to emit another event

        // Show success message
        setModalTitle('Code Generated Successfully');
        setModalContent({
          message: "Code has been generated and the connector has been switched to 'code' mode.",
          preview: generatedCode.substring(0, 200) + (generatedCode.length > 200 ? '...' : '')
        });
        setModalSuccess(true);
        setTestSucceeded(true);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setModalTitle('Error Generating Code');
      setModalContent({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: "See the browser console for more details."
      });
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

  // Default prompt text if empty
  const defaultConnectorPrompt = `# Connector Prompt
Describe how to transform the output from the previous agent to match the input requirements of this agent.

For example:
- Extract specific fields from the previous agent's output
- Format data in a specific way
- Apply business logic to the data
`;

  // Initialize editor with default code if empty
  useEffect(() => {
    if (connectorType === 'code' && !connectorJsCode) {
      onCodeChange(defaultTransformerCode);
    }

    // Initialize the prompt with default if empty
    if (connectorType === 'magic' && !connectorPrompt) {
      onPromptChange(defaultConnectorPrompt);
    }
  }, [connectorType, connectorJsCode, connectorPrompt, onCodeChange, onPromptChange]);

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
        <>
          <Box sx={{ p: 2, backgroundColor: '#f7f0dd', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Magic connector will call a LLM to transform the output of the previous agent to match the input requirements for the selected agent.
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Please provide specific instructions below to guide the transformation process. The data is based on the current environment (button above).
            </Typography>
          </Box>

          <Box sx={{ height: 400, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Editor
              height="400px"
              defaultLanguage="markdown"
              theme="vs-dark"
              value={connectorPrompt || defaultConnectorPrompt}
              onChange={(value) => onPromptChange(value || defaultConnectorPrompt)}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: 'on'
              }}
            />
          </Box>
        </>
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