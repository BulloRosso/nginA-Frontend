// src/components/dashboards/TileAgentLauncher.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Pagination,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import { 
  FilePresent as FileIcon,
  PlayArrow as RunIcon,
  Pause as PauseIcon,
  BackHand as BackHandIcon,
  SmartToy as RobotIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AgentService } from '../../services/agents';
import { OperationService } from '../../services/operations';
import RunParameters from '../agents/RunParameters';
import AgentIcon from '../agents/AgentIcon';
import { Agent } from '../../types/agent';
import eventBus from './DashboardEventBus';
import TileHeader from './TileHeader';

interface AgentLauncherSettings {
  title?: string;
  itemsPerPage?: number;
}

interface TileAgentLauncherProps {
  settings?: AgentLauncherSettings;
  renderMode?: 'dashboard' | 'settings';
  fullHeight?: boolean;
}

// Number of items to display per page (default)
const DEFAULT_ITEMS_PER_PAGE = 3;

const TileAgentLauncher: React.FC<TileAgentLauncherProps> = ({ 
  settings = {}, 
  renderMode = 'dashboard',
  fullHeight = false
}) => {
  const { t, i18n } = useTranslation(['agents', 'common']);

  const [localSettings, setLocalSettings] = useState<AgentLauncherSettings>({
    title: settings.title || 'Agent Launcher',
    itemsPerPage: settings.itemsPerPage || DEFAULT_ITEMS_PER_PAGE
  });

  const [teamStatus, setTeamStatus] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [page, setPage] = useState(1);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [runParametersDialogOpen, setRunParametersDialogOpen] = useState(false);

  // Helper functions from TeamStatus.tsx
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'success':
        return 'darkgreen';
      case 'failure':
        return 'darkred';
      case 'pending':
        return 'darkorange';
      case null:
        return '#ccc';
      default:
        return 'info';
    }
  };

  const getStatusFontColor = (status: string | null) => {
    switch (status) {
      case 'success':
      case 'failure':
      case 'pending':
        return 'white';
      default:
        return 'black';
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t('agents.time.just_now');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('agents.time.minutes_ago', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('agents.time.hours_ago', { count: hours });
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return t('agents.time.days_ago', { count: days });
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return t('agents.time.weeks_ago', { count: weeks });
    } else {
      return date.toLocaleDateString(i18n.language);
    }
  };

  const getAgentForStatusItem = (title: string): Agent | undefined => {
    return agents.find(agent => agent.title.en === title || 
                             Object.values(agent.title).includes(title));
  };

  const isActiveRun = (lastRun: any) => {
    return lastRun && lastRun.startedAt && !lastRun.finishedAt;
  };

  const hasValidResults = (lastRun: any) => {
    return lastRun && lastRun.results && Object.keys(lastRun.results).length > 0;
  };

  const getFabIcon = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <PauseIcon />;
      case 'human-in-the-loop':
        return <BackHandIcon />;
      default:
        return <RunIcon />;
    }
  };

  // Use useCallback to create stable function references
  const handleStartRun = useCallback(async (agent: Agent) => {
    try {
      // Fetch complete agent details including input schema
      const completeAgent = await AgentService.getAgent(agent.id);

      // Update state
      setCurrentAgent(completeAgent);
      setRunParametersDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent details');
    }
  }, []);

  const handleRunCreated = useCallback(async () => {
    try {
      // Refresh the team status data
      const statusData = await OperationService.getTeamStatus();
      setTeamStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh team status');
    }
  }, []);

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Handle agent selection (emit event)
  const handleAgentSelect = (agentStatus: any) => {
    if (agentStatus.lastRun) {
      eventBus.emit('agentRunSelected', {
        runId: agentStatus.lastRun.run_id,
        agentId: getAgentForStatusItem(agentStatus.title)?.id
      });
    }
  };

  // Initial data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statusData, agentsData] = await Promise.all([
          OperationService.getTeamStatus(),
          AgentService.getAgents()
        ]);
        setTeamStatus(statusData);
        setAgents(agentsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team status');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update settings handler
  const handleSettingChange = (field: keyof AgentLauncherSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate pagination values
  const getPaginatedData = () => {
    if (!teamStatus || !teamStatus.agents) return [];

    const startIndex = (page - 1) * localSettings.itemsPerPage!;
    const endIndex = startIndex + localSettings.itemsPerPage!;

    return teamStatus.agents.slice(startIndex, endIndex);
  };

  const totalPages = teamStatus?.agents 
    ? Math.ceil(teamStatus.agents.length / localSettings.itemsPerPage!)
    : 0;

  // Settings view
  if (renderMode === 'settings') {
    return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>Title</Typography>
            <input
              type="text"
              value={localSettings.title}
              onChange={(e) => handleSettingChange('title', e.target.value)}
              placeholder="Enter component title"
              style={{ width: '100%', padding: '8px' }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>Items Per Page</Typography>
            <input
              type="number"
              value={localSettings.itemsPerPage}
              onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value) || DEFAULT_ITEMS_PER_PAGE)}
              min={1}
              max={10}
              style={{ width: '100%', padding: '8px' }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            This component displays agents from your team and allows launching them.
            When an agent with runs is clicked, it will broadcast an "agentRunSelected" event.
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Dashboard view
  if (loading) {
    return (
      <Box 
        sx={{ 
          height: fullHeight ? '100%' : 'auto', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        <TileHeader 
          title={localSettings.title}
         
        />
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          height: fullHeight ? '100%' : 'auto', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        <TileHeader 
          title={localSettings.title}
          
        />
        <Box sx={{ flex: 1, p: 2 }}>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </Box>
      </Box>
    );
  }

  if (!teamStatus || teamStatus.agents.length === 0) {
    return (
      <Box 
        sx={{ 
          height: fullHeight ? '100%' : 'auto', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        <TileHeader 
          title={localSettings.title}
          
        />
        <Box sx={{ flex: 1, p: 2 }}>
          <Alert severity="info" sx={{ mt: 2, backgroundColor: '#d9f1f2' }}>
            {t('agents.no_agents_in_team')}
          </Alert>
        </Box>
      </Box>
    );
  }

  const paginatedAgents = getPaginatedData();

  return (
    <Box 
      sx={{ 
        height: fullHeight ? '100%' : 'auto', 
        display: 'flex', 
        flexDirection: 'column'
      }}
      className="agent-launcher-tile"
    >
      <TileHeader 
        title={localSettings.title}
      
        showInfo={true}
        infoText="Launch AI agents and view their outputs"
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Stack spacing={2} sx={{ mb: 2, flex: 1, overflow: 'auto' }}>
          {paginatedAgents.map((agentStatus: any) => {
            const agent = getAgentForStatusItem(agentStatus.title);
            const active = isActiveRun(agentStatus.lastRun);
            const hasResults = hasValidResults(agentStatus.lastRun);

            return (
              <Card 
                key={agentStatus.title} 
                variant="outlined" 
                sx={{ 
                  cursor: hasResults ? 'pointer' : 'default',
                  transition: 'box-shadow 0.3s',
                  '&:hover': {
                    boxShadow: hasResults ? 3 : 0
                  }
                }}
                onClick={() => hasResults && handleAgentSelect(agentStatus)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    {agent && (
                      <AgentIcon 
                        agent={agent} 
                        isActive={false} 
                        size={40} 
                      />
                    )}

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{agentStatus.title}</Typography>

                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          size="small"
                          color={active ? 'success' : undefined}
                          label={agentStatus.lastRun?.status || 'Never run'}
                          sx={{ 
                            backgroundColor: getStatusColor(agentStatus.lastRun?.status),
                            color: getStatusFontColor(agentStatus.lastRun?.status)
                          }}
                        />

                        {agentStatus.lastRun && (
                          <Typography variant="body2" color="text.secondary">
                            &#128336;{formatDuration(agentStatus.lastRun.duration)}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                      {agentStatus.lastRun && (
                        <Typography variant="body2" color="text.secondary">
                          {t('agents.started')}: {getRelativeTime(agentStatus.lastRun.startedAt)}
                        </Typography>
                      )}

                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <Tooltip title={t('agents.results')}>
                          <span> {/* Wrapper needed for disabled buttons */}
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<FileIcon />}
                              disabled={!hasResults}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hasResults) {
                                  handleAgentSelect(agentStatus);
                                }
                              }}
                            >
                              {t('agents.results')}
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip title={active ? t('agents.running') : t('agents.run')}>
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ backgroundColor: active ? 'warning' : 'gold' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (agent) {
                                handleStartRun(agent);
                              }
                            }}
                          >
                            {getFabIcon(agentStatus.lastRun?.status)}
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
              size="small"
            />
          </Box>
        )}
      </Box>

      {/* Run Parameters Dialog */}
      {currentAgent && (
        <RunParameters
          open={runParametersDialogOpen}
          onClose={() => setRunParametersDialogOpen(false)}
          agent={currentAgent}
          onRunCreated={handleRunCreated}
        />
      )}
    </Box>
  );
};

export default TileAgentLauncher;