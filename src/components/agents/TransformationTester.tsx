// src/components/agents/TransformationTester.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Paper,
  IconButton
} from '@mui/material';
import { 
  ArrowForward, 
  Code as CodeIcon, 
  Info as InfoIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import useAgentStore from '../../../stores/agentStore';
import AgentIcon from './AgentIcon';
import { Agent } from '../../types/agent';
import SchemaForm from './tabs/InputFormForSchema';
import SchemaTable from './SchemaTable';
import { useTranslation } from 'react-i18next';

interface TransformationTesterProps {
  agents: Agent[];
}

const TransformationTester: React.FC<TransformationTesterProps> = ({ agents }) => {
  const { t } = useTranslation(['agents', 'common']);
  const { 
    currentAgentTransformations, 
    selectedTransformationAgentId, 
    setSelectedTransformationAgentId,
    updateAgentTransformation
  } = useAgentStore();

  const [inputData, setInputData] = useState('{}');
  const [transformedData, setTransformedData] = useState('{}');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false);
  const [schemaDialogType, setSchemaDialogType] = useState<'input' | 'output'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transformationCode, setTransformationCode] = useState('');
  const [draftTransformationCode, setDraftTransformationCode] = useState('');
  const [isValidOutput, setIsValidOutput] = useState<boolean | null>(null);

  const inputEditorRef = useRef(null);
  const outputEditorRef = useRef(null);
  const codeEditorRef = useRef(null);

  // Get agents for the transformation chain
  // We need at least 2 agents for a transformation chain
  const agentsInChain = agents.length >= 2 ? agents : [];

  // Get the index of the selected agent
  const selectedAgentIndex = selectedTransformationAgentId 
    ? agents.findIndex(agent => agent.id === selectedTransformationAgentId)
    : 1; // Default to the second agent if none selected

  // The selected agent (destination of transformation)
  const selectedAgent = selectedAgentIndex >= 0 ? agents[selectedAgentIndex] : null;

  // The source agent (source of transformation, previous agent in chain)
  const sourceAgent = selectedAgentIndex > 0 ? agents[selectedAgentIndex - 1] : null;

  // Find transformation function code for selected agent
  const selectedTransformation = selectedAgent 
    ? currentAgentTransformations.find(transform => transform.agent_id === selectedAgent.id)
    : null;

  useEffect(() => {
    // Initialize the second agent as selected if none is selected and there are at least 2 agents
    if (!selectedTransformationAgentId && agents.length >= 2) {
      setSelectedTransformationAgentId(agents[1].id);
    }

    // Update transformation code when selectedTransformation changes
    if (selectedTransformation) {
      setTransformationCode(selectedTransformation.post_process_transformations);
      setDraftTransformationCode(selectedTransformation.post_process_transformations);
    }
  }, [agents, selectedTransformationAgentId, setSelectedTransformationAgentId, selectedTransformation]);

  useEffect(() => {
    // Validate transformed data whenever it changes
    if (transformedData && transformedData !== '{}') {
      validateTransformedData();
    } else {
      setIsValidOutput(null);
    }
  }, [transformedData]);

  const handleAgentSelect = (agentId: string) => {
    setSelectedTransformationAgentId(agentId);
    setInputData('{}');
    setTransformedData('{}');
    setIsValidOutput(null);
  };

  const handleShowInputForm = () => {
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    setInputData(JSON.stringify(formData, null, 2));
    setIsDialogOpen(false);
    setSuccessMessage(t('agents.input_data_updated'));
  };

  const handleTestTransformation = () => {
    if (!selectedTransformation || !inputData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Parse the input data
      const parsedInputData = JSON.parse(inputData);

      // Extract the transformation function
      const transformationCode = selectedTransformation.post_process_transformations;

      // Create a safe evaluation environment
      const evalFunction = new Function('input', `
        ${transformationCode}
        return transform_input(input);
      `);

      // Execute the transformation
      const result = evalFunction(parsedInputData);

      // Format and display the result
      setTransformedData(JSON.stringify(result, null, 2));
      setSuccessMessage(t('agents.transformation_success'));
    } catch (err) {
      console.error('Transformation error:', err);
      // Extract only the error message without the stack trace
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Monaco editor updates
  const handleInputChange = (value: string = '{}') => {
    setInputData(value);
  };

  const handleOutputChange = (value: string = '{}') => {
    setTransformedData(value);
  };

  const handleSaveCode = () => {
    if (selectedTransformationAgentId && codeEditorRef.current) {
      // Get the current value from the editor instance
      const currentCode = codeEditorRef.current.getValue();

      // Update the transformation
      updateAgentTransformation(selectedTransformationAgentId, currentCode);
      setTransformationCode(currentCode);
      setIsCodeDialogOpen(false);
      setSuccessMessage(t('agents.transformation_code_updated'));
    }
  };

  const handleShowSchemaDialog = (type: 'input' | 'output') => {
    setSchemaDialogType(type);
    setIsSchemaDialogOpen(true);
  };

  const validateTransformedData = () => {
    if (!selectedAgent?.input || !transformedData || transformedData === '{}') {
      setIsValidOutput(null);
      return;
    }

    try {
      const parsedData = JSON.parse(transformedData);
      const isValid = isValidInputForTarget(parsedData, selectedAgent.input);
      setIsValidOutput(isValid);
    } catch (err) {
      console.error('Validation error:', err);
      setIsValidOutput(false);
    }
  };

  // Function to validate if transformed data matches the target input schema
  const isValidInputForTarget = (data: any, schema: any): boolean => {
    // This is a simplified validation approach
    // In a real implementation, you might want to use a JSON Schema validator library

    // Check if required properties exist
    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredProp of schema.required) {
        if (data[requiredProp] === undefined) {
          return false;
        }
      }
    }

    // Check property types (basic validation)
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (data[propName] !== undefined) {
          const schemaType = (propSchema as any).type;

          // Skip validation if type is not specified
          if (!schemaType) continue;

          // Check if type matches
          if (typeof data[propName] === 'object' && data[propName] !== null && schemaType === 'object') {
            // Recursively validate nested objects
            if ((propSchema as any).properties && !isValidInputForTarget(data[propName], propSchema)) {
              return false;
            }
          } else if (Array.isArray(data[propName]) && schemaType === 'array') {
            // Basic array validation
            continue;
          } else if (typeof data[propName] !== schemaType && 
                    !(schemaType === 'number' && typeof data[propName] === 'number')) {
            return false;
          }
        }
      }
    }

    return true;
  };

  return (
    <Box sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      {/* Agent Selector Row */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 1, 
          mb: 1, 
          height: '60px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ecebe2'
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 1 }}>
          {agents.length < 2 ? (
            <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              {t('agents.need_two_agents')}
            </Typography>
          ) : (
            agents.map((agent, index) => (
              <Box key={agent.id} sx={{ textAlign: 'center' }}>
                <AgentIcon 
                  agent={agent}
                  isActive={agent.id === selectedTransformationAgentId}
                  onClick={() => index > 0 ? handleAgentSelect(agent.id) : null}
                  size={36}
                  disabled={index === 0}
                  backgroundColor={index === 0 ? 'transparent' : undefined}
                />
              </Box>
            ))
          )}
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<CodeIcon />}
          onClick={() => setIsCodeDialogOpen(true)}
          disabled={!selectedTransformationAgentId}
          sx={{ mr: 1 }}
        >
          Show Code
        </Button>
      </Paper>

      {/* Transformation Tester Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '440px' }}>
        {selectedAgent ? (
          <>
            <Grid container spacing={1} sx={{ flex: 1 }}>
              {/* Input Editor Column */}
              <Grid item xs={6}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">
                      Receives output of <b>{sourceAgent?.title?.en || ''}</b>
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleShowSchemaDialog('input')}
                      sx={{ ml: 1 }}
                      aria-label="Show source agent output schema"
                      title={`View output schema of ${sourceAgent?.title?.en || ''}`}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      theme="vs-dark"
                      value={inputData}
                      onChange={handleInputChange}
                      options={{ 
                        minimap: { enabled: false },
                        fontSize: 12
                      }}
                      onMount={(editor) => { inputEditorRef.current = editor; }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={handleShowInputForm}
                      disabled={!selectedAgent?.input}
                    >
                      {t('agents.enter_data_input')}
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {error && (
                        <Tooltip title={error} placement="left">
                          <WarningIcon 
                            sx={{ 
                              color: 'red', 
                              mr: 1,
                              animation: 'pulse 1.5s infinite',
                              '@keyframes pulse': {
                                '0%': { opacity: 0.7 },
                                '50%': { opacity: 1 },
                                '100%': { opacity: 0.7 }
                              }
                            }} 
                          />
                        </Tooltip>
                      )}
                      <Button
                        variant="contained"
                        onClick={handleTestTransformation}
                        disabled={inputData === '{}' || isLoading}
                        sx={{
                          backgroundColor: error ? 'red' : 'gold',
                          color: error ? 'white' : 'black',
                          '&:hover': {
                            backgroundColor: error ? '#b71c1c' : '#DAA520',
                          },
                          '&.Mui-disabled': {
                            backgroundColor: error 
                              ? 'rgba(183, 28, 28, 0.5)' 
                              : 'rgba(218, 165, 32, 0.5)',
                          }
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={24} sx={{ color: error ? 'white' : 'black' }} />
                        ) : (
                          t('agents.test_transformation')
                        )}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Output Editor Column */}
              <Grid item xs={6}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">
                      Transformed input for <b>{selectedAgent?.title?.en || ''}</b>
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleShowSchemaDialog('output')}
                      sx={{ ml: 1 }}
                      aria-label="Show target agent input schema"
                      title={`View input schema of ${selectedAgent?.title?.en || ''}`}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      theme="vs-dark"
                      value={transformedData}
                      onChange={handleOutputChange}
                      options={{ 
                        minimap: { enabled: false },
                        fontSize: 12
                      }}
                      onMount={(editor) => { outputEditorRef.current = editor; }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Arrow circle between editors */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: '45%',
                transform: 'translate(-50%, -50%)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                zIndex: 10
              }}
            >
              <ArrowForward color="primary" />
            </Box>

            {/* Validation circle for output data */}
            {isValidOutput !== null && (
              <Box
                sx={{
                  position: 'absolute',
                  right: '24px',
                  top: '43%',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: isValidOutput ? 'green' : 'red',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                  zIndex: 10
                }}
              >
                {isValidOutput ? (
                  <ThumbUpIcon sx={{ color: 'white' }} />
                ) : (
                  <ThumbDownIcon sx={{ color: 'white' }} />
                )}
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            backgroundColor: '#f5f5f5',
            borderRadius: 1 
          }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {t('agents.select_agent_or_no_transformations')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Input Form Dialog */}
      <Dialog 
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('agents.enter_input_data')}</DialogTitle>
        <DialogContent>
          {sourceAgent?.output ? (
            <SchemaForm 
              schema={sourceAgent.output} 
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
            />
          ) : (
            <Typography>{t('agents.no_input_schema')}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSchemaDialogOpen}
        onClose={() => setIsSchemaDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          {schemaDialogType === 'input' 
            ? `${t('agents.output_schema')} - ${sourceAgent?.title?.en || ''}` 
            : `${t('agents.input_schema')} - ${selectedAgent?.title?.en || ''}`}
        </DialogTitle>
        <DialogContent>
          {schemaDialogType === 'input' && sourceAgent?.output ? (
            <SchemaTable schema={sourceAgent.output} />
          ) : schemaDialogType === 'output' && selectedAgent?.input ? (
            <SchemaTable schema={selectedAgent.input} />
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>
              {t('agents.no_schema_available')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSchemaDialogOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transformation Code Dialog */}
      <Dialog
        open={isCodeDialogOpen}
        onClose={() => setIsCodeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>Transformation Code</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={transformationCode}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true
            }}
            onMount={(editor) => { codeEditorRef.current = editor; }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCodeDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSaveCode}
            variant="contained"
            sx={{
              backgroundColor: 'gold',
              color: 'black',
              '&:hover': {
                backgroundColor: '#DAA520',
              }
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransformationTester;