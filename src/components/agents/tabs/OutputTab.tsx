// components/agents/tabs/OutputTab.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  ToggleButton, 
  ToggleButtonGroup, 
  Button, 
  Snackbar, 
  Alert,
  Typography,
  Chip,
  TextField,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save'
import SchemaTable from '../SchemaTable';
import { Agent } from '../../../types/agent';
import MonacoEditor from '@monaco-editor/react';
import { AgentService } from '../../../services/agents';

enum DisplayMode {
  VISUALIZER = 'Visualizer',
  JSON_SCHEMA = 'JSON Schema',
  SAMPLE_DATA = 'Sample Data'
}

// New component for file extensions as chips
const FileExtensionsChips: React.FC<{
  extensions: string;
  onChange: (newExtensions: string) => void;
}> = ({ extensions, onChange }) => {
  const [extensionList, setExtensionList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isModified, setIsModified] = useState(false);

  // Quick access extensions
  const quickExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.csv'];

  useEffect(() => {
    if (extensions) {
      setExtensionList(extensions.split(',').map(ext => ext.trim()).filter(ext => ext));
    } else {
      setExtensionList([]);
    }
  }, [extensions]);

  const handleDelete = (extToDelete: string) => {
    const newList = extensionList.filter(ext => ext !== extToDelete);
    setExtensionList(newList);
    setIsModified(true);
  };

  const handleAdd = () => {
    if (inputValue && !extensionList.includes(inputValue)) {
      // Ensure extension starts with a dot
      const formattedExt = inputValue.startsWith('.') ? inputValue : `.${inputValue}`;
      const newList = [...extensionList, formattedExt];
      setExtensionList(newList);
      setInputValue('');
      setIsModified(true);
    }
  };

  const handleQuickAdd = (ext: string) => {
    if (!extensionList.includes(ext)) {
      const newList = [...extensionList, ext];
      setExtensionList(newList);
      setIsModified(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      handleAdd();
      e.preventDefault();
    }
  };

  const handleSave = () => {
    onChange(extensionList.join(','));
    setIsModified(false);
  };

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">
          Download these file types if the JSON response contains fields ending with '_url':
        </Typography>
        <Tooltip title="Save changes">
          <span>
            <IconButton 
              color="primary" 
              onClick={handleSave}
              disabled={!isModified}
              size="small"
            >
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {extensionList.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Currently no content will be extracted to the scratchpad after the agent finished.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {extensionList.map(ext => (
          <Chip 
            key={ext} 
            label={ext} 
            color="success"
            onDelete={() => handleDelete(ext)}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          size="small"
          label="Add file extension"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder=".docx"
          sx={{ width: '200px' }}
        />
        <Button 
          variant="outlined" 
          onClick={handleAdd}
          startIcon={<AddIcon />}
          size="small"
          
        >
          Add
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Quick add:
          </Typography>
          {quickExtensions.map(ext => (
            <Chip
              key={ext}
              label={ext}
              onClick={() => handleQuickAdd(ext)}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 1, mr: 0.5 }}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export const OutputTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [fileExtensions, setFileExtensions] = useState(agent.content_extraction_file_extensions || '');
  const [currentSchema, setCurrentSchema] = useState(agent.output || {});
  const [currentExample, setCurrentExample] = useState(agent.output_example || {});
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.VISUALIZER);
  const [jsonSchema, setJsonSchema] = useState<string>(
    JSON.stringify(agent.output || {}, null, 2)
  );
  const [sampleData, setSampleData] = useState<string>(
    JSON.stringify(agent.output_example || {}, null, 2)
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

  const handleFileExtensionsChange = async (newExtensions: string) => {
    try {
      setNotification({
        open: true,
        message: 'Saving file extensions...',
        severity: 'info'
      });

      // First get the current agent data
      const currentAgent = await AgentService.getAgent(agent.id, false);
      if (!currentAgent) {
        console.error('Agent not found for update');
        setNotification({
          open: true,
          message: 'Failed to update file extensions: Agent not found',
          severity: 'error'
        });
        return;
      }

      // Create an update payload that only changes the content_extraction_file_extensions field
      const updatePayload = {
        title: currentAgent.title,
        description: currentAgent.description,
        input: currentAgent.input,
        input_example: currentAgent.input_example,
        output: currentAgent.output,
        output_example: currentAgent.output_example,
        credits_per_run: currentAgent.credits_per_run,
        workflow_id: currentAgent.workflow_id,
        stars: currentAgent.stars,
        authentication: currentAgent.authentication, 
        content_extraction_file_extensions: newExtensions,
        type: currentAgent.type || 'atom',
        icon_svg: currentAgent.icon_svg,
        max_execution_time_secs: currentAgent.max_execution_time_secs,
        agent_endpoint: currentAgent.agent_endpoint
      };

      // Use PUT to update the agent
      const result = await AgentService.updateAgent(agent.id, updatePayload, false);

      if (result) {
        setFileExtensions(newExtensions);
        setNotification({
          open: true,
          message: 'Successfully updated file extensions',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Failed to update file extensions',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving file extensions:', error);
      setNotification({
        open: true,
        message: `Error: ${error.message || 'Unknown error occurred'}`,
        severity: 'error'
      });
    }
  };
  
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

      console.log('Attempting to save output changes for agent:', agent.id);

      // Add a loading notification
      setNotification({
        open: true,
        message: 'Saving changes...',
        severity: 'info'
      });

      // Call the AgentService update method
      const result = await AgentService.updateAgentOutput(
        agent.id, 
        { 
          output: parsedSchema,
          output_example: parsedExample 
        },
        false // Never use mock data as requested
      );

      console.log('Backend update result:', result);

      if (result) {
        setCurrentSchema(parsedSchema);
        setCurrentExample(parsedExample);
        
        console.log('✅ Successfully updated agent output');
        setNotification({
          open: true,
          message: 'Successfully updated output schema and example data',
          severity: 'success'
        });
        setIsModified(false);
      } else {
        console.error('❌ Failed to update agent output - no result returned');
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

  useEffect(() => {
    setCurrentSchema(agent.output || {});
    setCurrentExample(agent.output_example || {});
    setJsonSchema(JSON.stringify(agent.output || {}, null, 2));
    setSampleData(JSON.stringify(agent.output_example || {}, null, 2));
    setFileExtensions(agent.content_extraction_file_extensions || '');
  }, [agent]);

  const renderContent = () => {
    switch (displayMode) {
      case DisplayMode.VISUALIZER:
        return <SchemaTable schema={currentSchema} />;

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
        return <SchemaTable schema={agent.output || {}} />;
    }
  };

  return (
    <Box>

      <FileExtensionsChips 
        extensions={fileExtensions} 
        onChange={handleFileExtensionsChange}
      />
      
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