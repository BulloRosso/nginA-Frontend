// src/components/dashboards/ComponentLoader.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { ConfigurationComponent } from '../../types/dashboard';

// Import all tile components
import TileAgentLauncher from './TileAgentLauncher';
import TileScratchpadBrowser from './TileScratchpadBrowser';
import TileChatbot from './TileChatbot';
import TileKPI from './TileKPI';
import TileDisplayMarkdown from './TileDisplayMarkdown';

interface ComponentLoaderProps {
  component: ConfigurationComponent;
  dashboardId: string;
  fullHeight?: boolean;
}

const ComponentLoader: React.FC<ComponentLoaderProps> = ({ component, dashboardId, fullHeight = false }) => {
  // Component mapping
  const componentMap: { [key: string]: React.ComponentType<any> } = {
    'TileAgentLauncher': TileAgentLauncher,
    'TileScratchpadBrowser': TileScratchpadBrowser,
    'TileChatbot': TileChatbot,
    'TileKPI': TileKPI,
    'TileDisplayMarkdown': TileDisplayMarkdown,
  };

  // Get the component class from the mapping
  const ComponentClass = component.react_component_name 
    ? componentMap[component.react_component_name] 
    : null;

  if (!ComponentClass) {
    return (
      <Box sx={{ p: 2, height: '100%' }}>
        <Typography color="error">
          Component not found: {component.react_component_name || 'undefined'}
        </Typography>
      </Box>
    );
  }

  // Prepare props for the component
  const componentProps = {
    settings: {
      ...component.settings,  // Make sure settings is passed as an object
      agentId: component.settings?.agentId || component.agentId, // Support both formats for agentId
      title: component.settings?.title || component.name // Support both formats for title
    },
    id: component.id,
    dashboardId: dashboardId,
    fullHeight: fullHeight,
  };

  console.log('Component props for', component.react_component_name, ':', componentProps);

  // Render the component with the props
  return <ComponentClass {...componentProps} />;
};

export default ComponentLoader;