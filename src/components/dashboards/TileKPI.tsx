// src/components/dashboards/TileKPI.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  FormControl,
  FormLabel,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import api from '../../services/api';
import TileHeader from './TileHeader';

interface KPISettings {
  agentId?: string;
  kpiName?: string;
  label?: string;
  color?: string;
  icon?: string;
  showHeader?: boolean;
}

interface TileKPIProps {
  settings?: KPISettings;
  renderMode?: 'dashboard' | 'settings';
  fullHeight?: boolean;
}

const TileKPI: React.FC<TileKPIProps> = ({ 
  settings = {}, 
  renderMode = 'dashboard',
  fullHeight = false
}) => {
  const [localSettings, setLocalSettings] = useState<KPISettings>({
    agentId: settings.agentId || '',
    kpiName: settings.kpiName || 'total_sales',
    label: settings.label || 'Total Sales',
    color: settings.color || '#2196f3',
    icon: settings.icon || 'money',
    showHeader: settings.showHeader !== undefined ? settings.showHeader : false
  });

  const [kpiValue, setKpiValue] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableAgents, setAvailableAgents] = useState<Array<{id: string, name: string}>>([]);
  const [availableKPIs, setAvailableKPIs] = useState<Array<{name: string, label: string}>>([]);

  // Icons mapping
  const icons = {
    money: <MoneyIcon fontSize="inherit" />,
    chart: <ChartIcon fontSize="inherit" />,
    time: <TimeIcon fontSize="inherit" />,
    person: <PersonIcon fontSize="inherit" />,
    check: <CheckIcon fontSize="inherit" />,
    error: <ErrorIcon fontSize="inherit" />,
    warning: <WarningIcon fontSize="inherit" />,
    storage: <StorageIcon fontSize="inherit" />
  };

  // Format KPI value
  const formatKPIValue = (value: number | null): string => {
    if (value === null) return '0';

    // Format based on magnitude
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else {
      return value.toString();
    }
  };

  // Fetch available agents for the settings form
  useEffect(() => {
    if (renderMode === 'settings') {
      const fetchAgents = async () => {
        try {
          // In a real implementation, you would fetch from your API
          const response = await api.get('/api/v1/agents');
          setAvailableAgents(response.data.map((agent: any) => ({
            id: agent.id,
            name: agent.title.en || agent.id
          })));
        } catch (error) {
          console.error('Error fetching agents:', error);
          // Mock data for demo
          setAvailableAgents([
            { id: 'agent-1', name: 'Sales Agent' },
            { id: 'agent-2', name: 'Support Agent' },
            { id: 'agent-3', name: 'Operations Agent' }
          ]);
        }
      };

      // Mock KPIs for the demo
      setAvailableKPIs([
        { name: 'total_sales', label: 'Total Sales' },
        { name: 'active_users', label: 'Active Users' },
        { name: 'support_tickets', label: 'Support Tickets' },
        { name: 'response_time', label: 'Avg. Response Time' }
      ]);

      fetchAgents();
    }
  }, [renderMode]);

  // Fetch KPI data
  useEffect(() => {
    if (renderMode === 'dashboard' && localSettings.kpiName) {
      const fetchKPI = async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await api.get(`/api/v1/dashboards/kpi/${localSettings.kpiName}`);
          setKpiValue(response.data.value || 0);

          // If the API returns a label, use it to override the local setting
          if (response.data.label && !settings.label) {
            setLocalSettings(prev => ({
              ...prev,
              label: response.data.label
            }));
          }
        } catch (error) {
          console.error('Error fetching KPI data:', error);
          setError('Failed to load KPI data');

          // Mock value for demo
          setKpiValue(Math.floor(Math.random() * 10000));
        } finally {
          setLoading(false);
        }
      };

      fetchKPI();

      // Refresh every 5 minutes
      const intervalId = setInterval(fetchKPI, 5 * 60 * 1000);

      return () => clearInterval(intervalId);
    }
  }, [renderMode, localSettings.kpiName, settings.label]);

  const handleSettingChange = (field: keyof KPISettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Settings view
  if (renderMode === 'settings') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>KPI Settings</Typography>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel id="agent-select-label">Agent</InputLabel>
            <Select
              labelId="agent-select-label"
              value={localSettings.agentId}
              onChange={(e) => handleSettingChange('agentId', e.target.value)}
              label="Agent"
              size="small"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {availableAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="kpi-select-label">KPI</InputLabel>
            <Select
              labelId="kpi-select-label"
              value={localSettings.kpiName}
              onChange={(e) => handleSettingChange('kpiName', e.target.value)}
              label="KPI"
              size="small"
            >
              {availableKPIs.map((kpi) => (
                <MenuItem key={kpi.name} value={kpi.name}>
                  {kpi.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Label (Optional)</FormLabel>
            <TextField
              value={localSettings.label}
              onChange={(e) => handleSettingChange('label', e.target.value)}
              placeholder="Enter custom label"
              fullWidth
              margin="dense"
              size="small"
              helperText="If left empty, label from API will be used"
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Color</FormLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input 
                type="color" 
                value={localSettings.color}
                onChange={(e) => handleSettingChange('color', e.target.value)}
                style={{ width: '50px', height: '35px' }}
              />
              <TextField
                value={localSettings.color}
                onChange={(e) => handleSettingChange('color', e.target.value)}
                placeholder="#000000"
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="icon-select-label">Icon</InputLabel>
            <Select
              labelId="icon-select-label"
              value={localSettings.icon}
              onChange={(e) => handleSettingChange('icon', e.target.value)}
              label="Icon"
              size="small"
            >
              <MenuItem value="money">Money</MenuItem>
              <MenuItem value="chart">Chart</MenuItem>
              <MenuItem value="time">Time</MenuItem>
              <MenuItem value="person">Person</MenuItem>
              <MenuItem value="check">Check</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="storage">Storage</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Show Header</FormLabel>
            <Select
              value={localSettings.showHeader ? 'true' : 'false'}
              onChange={(e) => handleSettingChange('showHeader', e.target.value === 'true')}
              size="small"
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary">
              KPIs look best without headers, but you can enable one if needed
            </Typography>
          </FormControl>
        </Stack>
      </Box>
    );
  }
};

export default TileKPI;