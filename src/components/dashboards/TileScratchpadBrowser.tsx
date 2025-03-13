// src/components/dashboards/TileScratchpadBrowser.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress,
  FormControl,
  FormLabel,
  TextField,
  Stack
} from '@mui/material';
import { 
  Description as FileIcon
} from '@mui/icons-material';
import ScratchpadBrowser from '../ScratchpadBrowser';
import eventBus from './DashboardEventBus';
import TileHeader from './TileHeader';

interface ScratchpadBrowserSettings {
  title?: string;
}

interface TileScratchpadBrowserProps {
  settings?: ScratchpadBrowserSettings;
  renderMode?: 'dashboard' | 'settings';
  fullHeight?: boolean;
}

const TileScratchpadBrowser: React.FC<TileScratchpadBrowserProps> = ({ 
  settings = {}, 
  renderMode = 'dashboard',
  fullHeight = false
}) => {
  const [localSettings, setLocalSettings] = useState<ScratchpadBrowserSettings>({
    title: settings.title || 'Scratchpad Browser'
  });

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Listen for agentRunSelected events
  useEffect(() => {
    const handleAgentRunSelected = (data: { runId: string, agentId: string }) => {
      console.log('Agent run selected:', data);
      setSelectedRunId(data.runId);
    };

    // Subscribe to the event
    eventBus.on('agentRunSelected', handleAgentRunSelected);

    // Cleanup subscription
    return () => {
      eventBus.off('agentRunSelected', handleAgentRunSelected);
    };
  }, []);

  const handleSettingChange = (field: keyof ScratchpadBrowserSettings, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Settings form
  if (renderMode === 'settings') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Scratchpad Browser Settings</Typography>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <FormLabel>Title</FormLabel>
            <TextField
              value={localSettings.title}
              onChange={(e) => handleSettingChange('title', e.target.value)}
              placeholder="Enter title"
              fullWidth
              margin="dense"
              size="small"
            />
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            This component displays the scratchpad files for the selected agent run.
            It will show files when an agent run is selected via the "agentRunSelected" event.
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Dashboard view
  return (
    <Box 
      sx={{ 
        height: fullHeight ? '100%' : 'auto', 
        display: 'flex', 
        flexDirection: 'column' 
      }}
      className="scratchpad-browser-tile"
    >
      {/* Using the common TileHeader component */}
      <TileHeader 
        title={localSettings.title || 'Scratchpad Browser'}
        
        showInfo={true}
        infoText="Browse files created during agent runs"
       
      />

      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
        className="scratchpad-content"
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : selectedRunId ? (
          <ScratchpadBrowser runId={selectedRunId} />
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select an agent run first to view scratchpad files.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default TileScratchpadBrowser;