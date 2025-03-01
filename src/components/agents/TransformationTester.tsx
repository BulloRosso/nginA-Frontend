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
import { ArrowForward, Code as CodeIcon } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import useAgentStore from '../../../stores/agentStore';
import AgentIcon from './AgentIcon';
import { Agent } from '../../types/agent';
import SchemaForm from './tabs/InputFormForSchema';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transformationCode, setTransformationCode] = useState('');
  const [draftTransformationCode, setDraftTransformationCode] = useState('');

  const inputEditorRef = useRef(null);
  const outputEditorRef = useRef(null);
  const codeEditorRef = useRef(null);

  // Get agents with transformations
  const agentsWithTransformations = agents.filter(agent => 
    currentAgentTransformations.some(transform => transform.agent_id === agent.id)
  );

  // Find current selected agent
  const selectedAgent = agents.find(agent => agent.id === selectedTransformationAgentId);

  // Find transformation function code for selected agent
  const selectedTransformation = currentAgentTransformations.find(
    transform => transform.agent_id === selectedTransformationAgentId
  );

  useEffect(() => {
    // Initialize the first agent as selected if none is selected and there are transformations
    if (!selectedTransformationAgentId && agentsWithTransformations.length > 0) {
      setSelectedTransformationAgentId(agentsWithTransformations[0].id);
    }

    // Update transformation code when selectedTransformation changes
    if (selectedTransformation) {
      setTransformationCode(selectedTransformation.post_process_transformations);
      setDraftTransformationCode(selectedTransformation.post_process_transformations);
    }
  }, [agentsWithTransformations, selectedTransformationAgentId, setSelectedTransformationAgentId, selectedTransformation]);
  
  const handleAgentSelect = (agentId: string) => {
    setSelectedTransformationAgentId(agentId);
    setInputData('{}');
    setTransformedData('{}');
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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Monaco editor updates
  const handleInputChange = (value: string = '{}') => {
    setInputData(value);
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
          {agentsWithTransformations.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              {t('agents.no_transformations')}
            </Typography>
          ) : (
            agentsWithTransformations.map(agent => (
              <Box key={agent.id} sx={{ textAlign: 'center' }}>
                <AgentIcon 
                  agent={agent}
                  isActive={agent.id === selectedTransformationAgentId}
                  onClick={() => handleAgentSelect(agent.id)}
                  size={36}
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
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {t('agents.input_data')}
                  </Typography>
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
                    <Button
                      variant="contained"
                      onClick={handleTestTransformation}
                      disabled={inputData === '{}' || isLoading}
                      sx={{
                        backgroundColor: 'gold',
                        color: 'black',
                        '&:hover': {
                          backgroundColor: '#DAA520',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(218, 165, 32, 0.5)',
                        }
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} sx={{ color: 'black' }} />
                      ) : (
                        t('agents.test_transformation')
                      )}
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* Output Editor Column */}
              <Grid item xs={6}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {t('agents.transformed_data')}
                  </Typography>
                  <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      theme="vs-dark"
                      value={transformedData}
                      options={{ 
                        readOnly: true, 
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
          {selectedAgent?.input ? (
            <SchemaForm 
              schema={selectedAgent.input} 
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