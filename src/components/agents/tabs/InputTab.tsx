// components/agents/tabs/InputTab.tsx
import React, { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Button, Snackbar, Alert } from '@mui/material';
import SchemaTable from '../SchemaTable';
import { Agent } from '../../../types/agent';
import MonacoEditor from '@monaco-editor/react';
import { AgentService } from '../../../services/agents';

enum DisplayMode {
  VISUALIZER = 'Visualizer',
  JSON_SCHEMA = 'JSON Schema',
  SAMPLE_DATA = 'Sample Data'
}

export const InputTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.VISUALIZER);
  const [jsonSchema, setJsonSchema] = useState<string>(
    JSON.stringify(agent.input || {}, null, 2)
  );
  const [sampleData, setSampleData] = useState<string>(
    JSON.stringify(agent.input_example || {}, null, 2)
  );
  const [isModified, setIsModified] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleDisplayModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: DisplayMode | null
  ) => {
    if (newMode !== null) {
      setDisplayMode(newMode);
    }
  };

  const handleSchemaChange = (value: string | undefined) => {
    if (value) {
      setJsonSchema(value);
      setIsModified(true);
    }
  };

  const handleSampleDataChange = (value: string | undefined) => {
    if (value) {
      setSampleData(value);
      setIsModified(true);
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Parse JSON to validate correct format
      const parsedSchema = JSON.parse(jsonSchema);
      const parsedExample = JSON.parse(sampleData);

      console.log('Attempting to save input changes for agent:', agent.id);

      // Add a loading notification
      setNotification({
        open: true,
        message: 'Saving changes...',
        severity: 'info'
      });

      // Call the AgentService update method
      const result = await AgentService.updateAgentInput(
        agent.id, 
        { 
          input: parsedSchema,
          input_example: parsedExample 
        },
        false // Never use mock data as requested
      );

      console.log('Backend update result:', result);

      if (result) {
        console.log('✅ Successfully updated agent input');
        setNotification({
          open: true,
          message: 'Successfully updated input schema and example data',
          severity: 'success'
        });
        setIsModified(false);
      } else {
        console.error('❌ Failed to update agent input - no result returned');
        setNotification({
          open: true,
          message: 'Failed to update. No response from server.',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setNotification({
        open: true,
        message: `Error: ${error.message || 'Unknown error occurred'}`,
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const renderContent = () => {
    switch (displayMode) {
      case DisplayMode.VISUALIZER:
        return <SchemaTable schema={agent.input || {}} />;

      case DisplayMode.JSON_SCHEMA:
        return (
          <MonacoEditor
            height="400px"
            language="json"
            theme="vs-dark"
            value={jsonSchema}
            onChange={handleSchemaChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              folding: true,
              lineNumbers: 'on',
              wordWrap: 'on',
              formatOnPaste: true,
              automaticLayout: true
            }}
          />
        );

      case DisplayMode.SAMPLE_DATA:
        return (
          <MonacoEditor
            height="400px"
            language="json"
            theme="vs-dark"
            value={sampleData}
            onChange={handleSampleDataChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              folding: true,
              lineNumbers: 'on',
              wordWrap: 'on',
              formatOnPaste: true,
              automaticLayout: true
            }}
          />
        );

      default:
        return <SchemaTable schema={agent.input || {}} />;
    }
  };

  return (
    <Box>
      {renderContent()}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {isModified && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        )}

        <ToggleButtonGroup
          value={displayMode}
          exclusive
          onChange={handleDisplayModeChange}
          aria-label="display mode"
        >
          <ToggleButton value={DisplayMode.VISUALIZER} aria-label="visualizer">
            Visualizer
          </ToggleButton>
          <ToggleButton value={DisplayMode.JSON_SCHEMA} aria-label="json schema">
            JSON Schema
          </ToggleButton>
          <ToggleButton value={DisplayMode.SAMPLE_DATA} aria-label="sample data">
            Sample Data
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};