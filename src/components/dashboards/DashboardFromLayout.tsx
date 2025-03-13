// src/components/dashboards/DashboardFromLayout.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Paper
} from '@mui/material';
import DashboardService from '../../services/dashboards';
import { Dashboard, DashboardComponent } from '../../types/dashboard';
import DashboardRenderer from './DashboardRenderer';

interface DashboardFromLayoutProps {
  dashboardId: string;
  isDeveloper?: boolean;
  onTitleChange?: (title: string) => void;
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
        const dashboardData = await DashboardService.getDashboard(dashboardId, false);

        console.log('Dashboard data received:', dashboardData);

        setDashboard(dashboardData);

        // Also fetch component definitions
        const componentDefinitions = await DashboardService.getDashboardComponents(false);
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

  // Enrich components with their definitions
  const enrichComponentsWithDefinitions = () => {
    if (!dashboard?.configuration?.components || !components.length) {
      return dashboard?.configuration?.components || [];
    }

    return dashboard.configuration.components.map(component => {
      // Find matching component definition
      const componentDef = components.find(
        c => c.react_component_name === component.react_component_name || c.id === component.id
      );

      if (!componentDef) {
        return component;
      }

      // Return merged component data
      return {
        ...componentDef,
        ...component,
        // Ensure layout information is preserved
        layout_cols: component.layout_cols || componentDef.layout_cols || 3,
        layout_rows: component.layout_rows || componentDef.layout_rows || 2,
      };
    });
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
        {dashboard && (
          <DashboardRenderer
            dashboardId={dashboardId}
            configuration={{
              components: enrichComponentsWithDefinitions()
            }}
            isLoading={loading}
            error={error}
          />
        )}
      </Box>
    </Box>
  );
};

export default DashboardFromLayout;