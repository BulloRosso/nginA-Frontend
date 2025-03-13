// src/components/dashboards/DashboardRenderer.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// Import all tile components
import TileDisplayMarkdown from './TileDisplayMarkdown';
import TileChatbot from './TileChatbot';
import TileKPI from './TileKPI';
import TileScratchpadBrowser from './TileScratchpadBrowser';
import TileAgentLauncher from './TileAgentLauncher';

// Import event bus
import eventBus from './DashboardEventBus';

interface DashboardComponentConfig {
  id: string;
  name: string;
  startCol: number;
  startRow: number;
  settings?: any;
  react_component_name?: string;
}

interface DashboardRendererProps {
  dashboardId: string;
  configuration: {
    components: DashboardComponentConfig[];
  };
  isLoading?: boolean;
  error?: string | null;
}

const DashboardRenderer: React.FC<DashboardRendererProps> = ({
  dashboardId,
  configuration,
  isLoading = false,
  error = null
}) => {
  // State for component mapping
  const [componentsMap, setComponentsMap] = useState<Record<string, React.ComponentType<any>>>({});

  // State for settings dialog
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<DashboardComponentConfig | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<React.ComponentType<any> | null>(null);

  // State for global variables
  const [sessionId] = useState<string>(uuidv4());
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedAgentRunId, setSelectedAgentRunId] = useState<string | null>(null);

  // Initialize component map
  useEffect(() => {
    setComponentsMap({
      'TileDisplayMarkdown': TileDisplayMarkdown,
      'DisplayMarkdown': TileDisplayMarkdown,
      'TileChatbot': TileChatbot,
      'Chatbot': TileChatbot,
      'TileKPI': TileKPI,
      'KPI': TileKPI,
      'TileScratchpadBrowser': TileScratchpadBrowser,
      'ScratchpadBrowser': TileScratchpadBrowser,
      'TileAgentLauncher': TileAgentLauncher,
      'AgentLauncher': TileAgentLauncher
    });

    // Get user ID from local storage/session
    const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    setUserId(storedUserId);

    // Listen for agent run selection events
    const handleAgentRunSelected = (data: { runId: string }) => {
      setSelectedAgentRunId(data.runId);
    };

    eventBus.on('agentRunSelected', handleAgentRunSelected);

    return () => {
      eventBus.off('agentRunSelected', handleAgentRunSelected);
    };
  }, []);

  // Process settings templates
  const processSettingsTemplate = (component: DashboardComponentConfig): any => {
    if (!component.settings) {
      return {};
    }

    // Deep copy settings to avoid mutating original
    const processedSettings = JSON.parse(JSON.stringify(component.settings));

    // Substitute template variables
    Object.keys(processedSettings).forEach(key => {
      const value = processedSettings[key];
      if (typeof value === 'string' && value.startsWith('${{') && value.endsWith('}}')) {
        const varName = value.substring(3, value.length - 2).trim();

        // Replace with global variables
        if (varName === 'sessionId') {
          processedSettings[key] = sessionId;
        } else if (varName === 'userId') {
          processedSettings[key] = userId;
        } else if (varName === 'selectedAgentRunId') {
          processedSettings[key] = selectedAgentRunId;
        }
      }
    });

    return processedSettings;
  };

  // Handle double click on a component to open settings
  const handleComponentDoubleClick = (component: DashboardComponentConfig) => {
    const componentType = getComponentType(component);
    if (componentType) {
      setSelectedComponent(component);
      setSelectedComponentType(componentType);
      setSettingsDialogOpen(true);
    }
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real application, you would save settings to backend
    console.log('Saving settings for component:', selectedComponent);
    setSettingsDialogOpen(false);
  };

  // Get component type from registry
  const getComponentType = (component: DashboardComponentConfig): React.ComponentType<any> | null => {
    // First try react_component_name
    if (component.react_component_name && componentsMap[component.react_component_name]) {
      return componentsMap[component.react_component_name];
    }

    // Then try name
    if (component.name && componentsMap[component.name]) {
      return componentsMap[component.name];
    }

    // Try with Tile prefix
    if (component.name && componentsMap['Tile' + component.name]) {
      return componentsMap['Tile' + component.name];
    }

    console.warn(`Component not found: ${component.react_component_name || component.name}`);
    return null;
  };

  // Render the grid
  const renderGrid = () => {
    // Use 12 column grid
    const MAX_COLS = 12;

    if (!configuration || !configuration.components || configuration.components.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          No components configured for this dashboard.
        </Alert>
      );
    }

    return (
      <Box sx={{ flexGrow: 1, width: '100%', p: 2 }}>
        <Grid container spacing={2}>
          {configuration.components.map((component) => {
            const ComponentType = getComponentType(component);

            if (!ComponentType) {
              return (
                <Grid
                  item
                  key={component.id}
                  xs={12}
                  md={Math.min(component.startCol + 2, MAX_COLS)}
                  sx={{
                    gridColumnStart: component.startCol + 1,
                    gridRowStart: component.startRow + 1,
                  }}
                >
                  <Paper sx={{ p: 2, height: '100%', minHeight: '100px' }}>
                    <Typography color="error">
                      Component not found: {component.name || component.react_component_name}
                    </Typography>
                  </Paper>
                </Grid>
              );
            }

            const processedSettings = processSettingsTemplate(component);

            return (
              <Grid
                item
                key={component.id}
                xs={12}
                md={Math.min(component.startCol + 2, MAX_COLS)}
                sx={{
                  gridColumnStart: component.startCol + 1,
                  gridRowStart: component.startRow + 1,
                }}
              >
                <Paper 
                  sx={{ 
                    p: 0, 
                    height: '100%', 
                    minHeight: '100px',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                  onDoubleClick={() => handleComponentDoubleClick(component)}
                >
                  <ComponentType
                    settings={processedSettings}
                    renderMode="dashboard"
                  />
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
        {renderGrid()}
      </Box>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Component Settings: {selectedComponent?.name}
            </Typography>
            <IconButton onClick={() => setSettingsDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedComponentType && selectedComponent && (
            <selectedComponentType
              settings={processSettingsTemplate(selectedComponent)}
              renderMode="settings"
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DashboardRenderer;