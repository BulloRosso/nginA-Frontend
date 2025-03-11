import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Button,
  Grid,
  Container
} from '@mui/material';
import dashboardApi from '../../services/dashboardApi';
import DashboardService from '../../services/dashboardService';
import { Dashboard, DashboardComponent } from '../../types/dashboard';

interface DashboardFromLayoutProps {
  dashboardId: string;
  isDeveloper?: boolean;
  onTitleChange?: (title: string) => void;
}

// Position and render a component within our grid system
interface PositionedComponent {
  component: any;
  gridPosition: {
    startCol: number;
    startRow: number;
    cols: number;
    rows: number;
  };
}

const DashboardFromLayout: React.FC<DashboardFromLayoutProps> = ({ 
  dashboardId, 
  isDeveloper = false,
  onTitleChange 
}) => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [components, setComponents] = useState<DashboardComponent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Get token from sessionStorage (specifically for dashboard access)
        const token = sessionStorage.getItem('dashboard_token');

        console.log('Dashboard token available:', !!token);

        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        console.log('Fetching dashboard with ID:', dashboardId);

        // Use the dashboard service to fetch dashboard data
        // For development, we can use mock data by passing true as the second parameter
        const dashboardData = await DashboardService.getDashboard(dashboardId, false); // Using mock data for now

        console.log('Dashboard data received:', dashboardData);

        setDashboard(dashboardData);

        // Also fetch component definitions
        const componentDefinitions = await DashboardService.getDashboardComponents(false); // Using mock data for now
        setComponents(componentDefinitions);

        // Update title in parent component
        if (onTitleChange && dashboardData?.description?.en?.title) {
          onTitleChange(dashboardData.description.en.title);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching dashboard:', err);

        // More detailed error logging
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', err.response.data);
        } else if (err.request) {
          console.error('No response received:', err.request);
        } else {
          console.error('Error message:', err.message);
        }

        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
        setLoading(false);
      }
    };

    if (dashboardId) {
      fetchDashboard();
    } else {
      console.error('No dashboard ID provided');
      setError('No dashboard ID provided');
      setLoading(false);
    }
  }, [dashboardId, onTitleChange]);

  // Function to merge dashboard component configuration with component definitions
  const mergeComponentData = (dashboardComponent: any): any => {
    if (!components || components.length === 0) return dashboardComponent;

    // Find the component definition by react_component_name or id
    const componentDef = components.find(
      c => c.react_component_name === dashboardComponent.react_component_name || 
           c.id === dashboardComponent.id
    );

    if (!componentDef) return dashboardComponent;

    // Merge the dashboard component with its definition
    // Priority: dashboard component props override component definition
    return {
      ...componentDef,
      ...dashboardComponent,
      // Ensure we have layout information
      layout_cols: dashboardComponent.layout_cols || componentDef.layout_cols || 3,
      layout_rows: dashboardComponent.layout_rows || componentDef.layout_rows || 2,
    };
  };

  // Function to render a component in the grid
  const renderGridComponent = (component: any) => {
    const mergedComponent = mergeComponentData(component);
    const cols = mergedComponent.layout_cols || 3;
    const rows = mergedComponent.layout_rows || 2;

    // Calculate height based on rows (approximate)
    const height = rows * 90; // 90px per row as a baseline

    return (
      <Grid 
        item 
        xs={12} 
        sm={cols <= 4 ? 6 : 12} 
        md={cols} 
        key={mergedComponent.id}
        sx={{
          height: `${height}px`,
          position: 'relative',
          marginBottom: 2
        }}
      >
        <Paper
          sx={{
            p: 2,
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
          elevation={2}
        >
          <Typography variant="h6">{mergedComponent.name}</Typography>

          {/* Component type indicator */}
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {mergedComponent.type || 'Unknown type'}
          </Typography>

          {/* Here you would render the actual component based on its type */}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Component: {mergedComponent.react_component_name || 'Unknown'}
          </Typography>

          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Size: {cols}x{rows}
          </Typography>

        </Paper>
      </Grid>
    );
  };

  // Function to render dashboard components by row using MUI Grid
  const renderDashboardComponents = () => {
    if (!dashboard?.configuration?.components || dashboard.configuration.components.length === 0) {
      return (
        <Box sx={{ p: 3, width: '100%' }}>
          <Typography variant="body1">No components configured for this dashboard.</Typography>
        </Box>
      );
    }

    // Group components by row
    const componentsByRow: { [key: number]: any[] } = {};

    dashboard.configuration.components.forEach(component => {
      const rowIndex = component.startRow || 1;
      if (!componentsByRow[rowIndex]) {
        componentsByRow[rowIndex] = [];
      }
      componentsByRow[rowIndex].push(component);
    });

    // Sort rows by index
    const rows = Object.keys(componentsByRow)
      .map(Number)
      .sort((a, b) => a - b);

    return (
      <Box sx={{ p: 3, width: '100%' }}>
        {rows.map(rowIndex => (
          <Grid container spacing={2} key={`row-${rowIndex}`}>
            {/* Sort components within row by column */}
            {componentsByRow[rowIndex]
              .sort((a, b) => (a.startCol || 1) - (b.startCol || 1))
              .map(component => renderGridComponent(component))}
          </Grid>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Dashboard description */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #eaeaea',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}>
        <Box>
          <Typography variant="body1">
            {dashboard?.description?.en?.description || 'No description available'}
          </Typography>
        </Box>
      </Box>

      {/* Dashboard Content */}
      <Box sx={{ 
        flexGrow: 1, 
        width: '100%', 
        overflow: 'auto'
      }}>
        {renderDashboardComponents()}
      </Box>
    </Box>
  );
};

export default DashboardFromLayout;