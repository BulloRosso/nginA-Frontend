import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import dashboardApi from '../../services/dashboardApi';
import { Dashboard } from '../../types/dashboard';

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

        // Use the specialized dashboard API service
        const response = await dashboardApi.get(`/api/v1/dashboards/${dashboardId}`);

        console.log('Dashboard data received:', response.data);

        setDashboard(response.data);

        // Update title in parent component
        if (onTitleChange && response.data?.description?.en?.title) {
          onTitleChange(response.data.description.en.title);
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

  // Function to render dashboard components based on configuration
  const renderDashboardComponents = () => {
    if (!dashboard?.configuration?.components || dashboard.configuration.components.length === 0) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="body1">No components configured for this dashboard.</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 2,
        p: 3
      }}>
        {dashboard.configuration.components.map((component) => (
          <Paper
            key={component.id}
            sx={{
              gridColumn: `${component.startCol} / span ${3}`, // Default span of 3 columns
              gridRow: `${component.startRow} / span ${2}`, // Default span of 2 rows
              p: 2,
              minHeight: '120px',
              position: 'relative'
            }}
            elevation={2}
          >
            <Typography variant="h6">{component.name}</Typography>
            {/* Here you would render the actual component based on its type */}
            <Typography variant="body2">Component ID: {component.id}</Typography>

            {/* Developer controls - only visible to developers */}
            {isDeveloper && (
              <Box sx={{ 
                position: 'absolute', 
                top: '5px', 
                right: '5px',
                display: 'flex',
                gap: 1
              }}>
                <Button size="small" variant="outlined" color="primary">Edit</Button>
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      {/* Dashboard description */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #eaeaea',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="body1">
            {dashboard?.description?.en?.description || 'No description available'}
          </Typography>
        </Box>

        {/* Only show developer actions to developers */}
        {isDeveloper && (
          <Box>
            <Button 
              variant="contained" 
              color="primary"
              sx={{ mr: 1 }}
            >
              Edit Layout
            </Button>
            <Button 
              variant="outlined"
            >
              Settings
            </Button>
          </Box>
        )}
      </Box>

      {/* Dashboard Content */}
      {renderDashboardComponents()}
    </Box>
  );
};

export default DashboardFromLayout;