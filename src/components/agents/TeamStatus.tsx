// src/components/agents/TeamStatus.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  Pagination,
  Tabs,
  Tab
} from '@mui/material';
import { 
  FilePresent as FileIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Launch as LaunchIcon,
  Close as CloseIcon,
  PlayArrow as RunIcon,
  Pause as PauseIcon,
  BackHand as BackHandIcon
} from '@mui/icons-material';

import { OperationService } from '../../services/operations';
import { TeamStatus as TeamStatusType } from '../../types/operation';
import { AgentService } from '../../services/agents';
import { TeamService } from '../../services/teams';
import { Agent } from '../../types/agent';
import AgentIcon from './AgentIcon';
import RunParameters from './RunParameters';
import RunButton from './RunButton';
import MonacoEditor from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ScratchpadBrowser from '../ScratchpadBrowser';
import { supabase, subscribeToAgentRuns, initSupabaseAuth } from '../../services/supabase-client';
import { useAuth } from '../../hooks/useAuth';

const getStatusColor = (status: string | null) => {
  switch (status) {
    case 'success':
      return 'darkgreen';
    case 'failure':
      return 'darkred';
    case 'pending':
      return 'darkorange'; // Changed from 'warning' to 'success' for dark green
    case null:
      return '#ccc';
    default:
      return 'info';
  }
};

const getStatusFontColor = (status: string | null) => {
  switch (status) {
    case 'success':
      return 'white';
    case 'failure':
      return 'white';
    case 'pending':
      return 'white'; // Changed from 'warning' to 'success' for dark green
    case null:
      return 'black';
    default:
      return 'info';
  }
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

// Number of items to display per page
const ITEMS_PER_PAGE = 3;

const TeamStatusComponent: React.FC = () => {
  const { t } = useTranslation(['agents']);
  const navigate = useNavigate();
  const { user } = useAuth();

  // All useState hooks need to be called in the same order every render
  const [teamStatus, setTeamStatus] = useState<TeamStatusType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [runParametersDialogOpen, setRunParametersDialogOpen] = useState(false);
  const [currentResults, setCurrentResults] = useState<any>(null);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isAddingOrRemoving, setIsAddingOrRemoving] = useState<string | null>(null);
  // Pagination state
  const [page, setPage] = useState(1);
  // New state for results dialog tabs
  const [activeResultsTab, setActiveResultsTab] = useState(0);

  // Always define these functions outside of conditional blocks
  const isAgentInTeam = (agentId: string): boolean => {
    return team?.agents?.members?.some(member => member.agentId === agentId) ?? false;
  };

  const handleAgentTeamToggle = async (agentId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (isAddingOrRemoving === agentId) {
      return;
    }

    try {
      setIsAddingOrRemoving(agentId);

      if (isAgentInTeam(agentId)) {
        // Remove agent from team
        const updatedTeam = await TeamService.removeAgent(agentId);
        setTeam(updatedTeam);
        // Refresh team status after removing an agent
        const statusData = await OperationService.getTeamStatus();
        setTeamStatus(statusData);
      } else {
        // Add agent to team
        const updatedTeam = await TeamService.addAgent(agentId);
        setTeam(updatedTeam);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setIsAddingOrRemoving(null);
    }
  };

  const getAgentForStatusItem = (title: string): Agent | undefined => {
    return agents.find(agent => agent.title.en === title || 
                               Object.values(agent.title).includes(title));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, agentId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveAgentId(agentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveAgentId(null);
  };

  const handleOpenWorkflow = (workflowId: string) => {
    const n8nUrl = import.meta.env.VITE_N8N_URL;
    window.open(`${n8nUrl}/workflow/${workflowId}`, '_blank');
    handleMenuClose();
  };

  const handleShowResults = (results: any, run_id?: string) => {
    // Ensure the run_id is included in the results object
    const resultsWithRunId = {
      ...results,
      run_id: run_id || results.run_id
    };

    setCurrentResults(resultsWithRunId);
    setActiveResultsTab(0);
    setResultsDialogOpen(true);
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

  const isActiveRun = (lastRun: any) => {
    return lastRun && lastRun.startedAt && !lastRun.finishedAt;
  };

  const hasValidResults = (lastRun: any) => {
    return lastRun && lastRun.results && Object.keys(lastRun.results).length > 0;
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Update a specific agent run in the team status
  const updateAgentRun = useCallback((payload: any) => {
    if (!teamStatus || !payload.new) return;

    setTeamStatus(prevStatus => {
      if (!prevStatus) return prevStatus;

      // Find the agent that corresponds to this run
      const updatedAgents = prevStatus.agents.map(agent => {
        // Check if this agent's lastRun should be updated (by matching agent_id)
        if (agent.lastRun && agent.lastRun.run_id === payload.new.id) {
          return {
            ...agent,
            lastRun: {
              ...agent.lastRun,
              status: payload.new.status,
              results: payload.new.results,
              finishedAt: payload.new.finished_at,
              duration: payload.new.finished_at 
                ? Math.round((new Date(payload.new.finished_at).getTime() - new Date(agent.lastRun.startedAt).getTime()) / 1000)
                : agent.lastRun.duration
            }
          };
        }
        return agent;
      });

      return {
        ...prevStatus,
        agents: updatedAgents
      };
    });
  }, [teamStatus]);

  // Set up Supabase real-time subscription
  useEffect(() => {
    if (!user || !user.id) return;

    // Get current JWT token
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found for real-time subscription');
      return;
    }

    // Initialize Supabase auth with our JWT token
    const authInitialized = initSupabaseAuth(token);
    if (!authInitialized) {
      console.error('Failed to initialize Supabase auth');
      return;
    }

    // Create handler for updates
    const handleAgentRunsUpdate = (payload: any) => {
      console.log('Supabase real-time update:', payload);
      updateAgentRun(payload);
    };

    // Subscribe to agent runs updates using the helper function
    const unsubscribe = subscribeToAgentRuns(user.id, handleAgentRunsUpdate);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [user, updateAgentRun]);

  // Initial data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusData, agentsData, teamData] = await Promise.all([
          OperationService.getTeamStatus(),
          AgentService.getAgents(),
          TeamService.getTeam()
        ]);
        setTeamStatus(statusData);
        setAgents(agentsData);
        setTeam(teamData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team status');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate pagination values
  const getPaginatedData = () => {
    if (!teamStatus || !teamStatus.agents) return [];

    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return teamStatus.agents.slice(startIndex, endIndex);
  };

  const totalPages = teamStatus?.agents ? Math.ceil(teamStatus.agents.length / ITEMS_PER_PAGE) : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!teamStatus || teamStatus.agents.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2, backgroundColor: '#d9f1f2' }}>
        { t('agents.no_agents_in_team') }
      </Alert>
    );
  }

  const paginatedAgents = getPaginatedData();

  const handleCreateNew = () => {
    navigate('/builder');
  };

  return (
    <Box sx={{ paddingBottom: '10px' }}>
      <Stack spacing={2}>
        {paginatedAgents.map((agentStatus) => {
          const agent = getAgentForStatusItem(agentStatus.title);
          const active = isActiveRun(agentStatus.lastRun);
          const hasResults = hasValidResults(agentStatus.lastRun);

          return (
            <Box 
              key={agentStatus.title} 
              sx={{ 
                position: 'relative', 
                pl: '40px',
                mb: 2
              }}
            >
              {agent && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    zIndex: 2
                  }}
                >
                  <AgentIcon 
                    agent={agent} 
                    isActive={false} 
                    size={60} 
                    onClick={(e) => handleAgentTeamToggle(agent.id, e)}
                    disabled={isAddingOrRemoving === agent.id}
                  />
                  {isAddingOrRemoving === agent.id && (
                    <CircularProgress 
                      size={60} 
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0 
                      }} 
                    />
                  )}
                </Box>
              )}
              <Card variant="outlined" sx={{ position: 'relative' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" sx={{ width: '50%' }}>
                      <Box sx={{ pl: '20px' }}>
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {agentStatus.title}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} ml={1}>
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
                          <Typography variant="div" color="text.secondary">
                            &#128336;{formatDuration(agentStatus.lastRun.duration)}
                          </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ width: '50%' }}>
                      <Box sx={{ flex: 1 }}>
                        {agentStatus.lastRun && (
                          <Box display="flex" flexWrap="wrap" sx={{ gap: 0 }}>
                            <Typography variant="div" color="text.secondary">
                              Started: {formatDateTime(agentStatus.lastRun.startedAt)}
                            </Typography><br />
                            {agentStatus.lastRun.finishedAt && (
                              <Typography variant="div" color="text.secondary">
                                Finished: {formatDateTime(agentStatus.lastRun.finishedAt)}
                              </Typography>
                            )}
                            
                          </Box>
                        )}
                      </Box>

                      <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
                        <Box textAlign="center">
                          <RunButton 
                            agent={agent}
                            active={active}
                            status={agentStatus.lastRun?.status}
                            onStartRun={handleStartRun}
                          />
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FileIcon />}
                          disabled={!hasResults}
                          onClick={() => {
                            if (hasResults && agentStatus.lastRun) {
                              // Pass both the results and the run_id to handleShowResults
                              handleShowResults(
                                agentStatus.lastRun.results, 
                                agentStatus.lastRun.run_id
                              );
                            }
                          }}
                        >
                          Results
                        </Button>

                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            if (agent) {
                              handleMenuOpen(e, agent.id);
                            }
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Stack>

      {/* Pagination Controls */}
      <Box 
        sx={{ 
          mt: 0, 
          mb: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            size="medium"
            showFirstButton
            showLastButton
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: '6px', ml: 2 }}>
            Showing {paginatedAgents.length} of {teamStatus.agents.length} agents
          </Typography>
        </Box>
        <Box sx={{
           display: 'flex',
           justifyContent: 'end',
           alignItems: 'center',
           flexDirection: 'row',
        }}>

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleCreateNew}
            sx={{ mb: 0, mr: 1, backgroundColor: 'gold', '&:hover': {
                  backgroundColor: '#e2bf02',
                  color: 'white'
                } }}
          >
            {t('agents.create_new')}
          </Button>

          <img onClick={handleCreateNew} src="/img/agent-profile.jpg" 
                style={{ cursor: 'pointer', marginTop: '10px',  width: '120px' }} alt="Noblivion Logo"></img>

        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            const agent = teamStatus.agents.find(a => 
              getAgentForStatusItem(a.title)?.id === activeAgentId
            );
            if (agent?.lastRun?.workflowId) {
              handleOpenWorkflow(agent.workflowId);
            } else {
              // For testing purposes, assume a test ID if none exists
              handleOpenWorkflow('test-workflow-id');
            }
          }}
        >
          <LaunchIcon fontSize="small" sx={{ mr: 1 }} />
          Show n8n workflow
        </MenuItem>
      </Menu>

      {/* Results Dialog */}
      <Dialog
        open={resultsDialogOpen}
        onClose={() => setResultsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0 }}>
            <Typography variant="h6">Run Results</Typography>
            <IconButton onClick={() => setResultsDialogOpen(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ }}>
          <Box sx={{ height: '50vh', display: 'flex', flexDirection: 'column' }}>
            {/* Tab for switching between JSON results and Scratchpad Files */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
              <Tabs value={activeResultsTab} onChange={(_, newValue) => setActiveResultsTab(newValue)}>
                <Tab label="Results" />
                <Tab label="Scratchpad Files" />
              </Tabs>
            </Box>

            {/* Results content based on selected tab */}
            {activeResultsTab === 0 ? (
              // JSON Results tab
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                defaultValue={JSON.stringify(currentResults, null, 2)}
                options={{
                  readOnly: true,
                  minimap: { enabled: true }
                }}
              />
            ) : (
              // Scratchpad Files tab
              currentResults && (currentResults.run_id) ? (
                <ScratchpadBrowser runId={currentResults.run_id} />
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    No files available for this run. The run ID is missing from the results data.
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    To fix this issue, the backend API needs to include a run_id field in the lastRun object.
                  </Typography>
                </Alert>
              )
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Run Parameters Dialog - Now using the new RunParameters component */}
      <RunParameters
        open={runParametersDialogOpen}
        onClose={() => setRunParametersDialogOpen(false)}
        agent={currentAgent}
        onRunCreated={handleRunCreated}
      />
    </Box>
  );
};

export default TeamStatusComponent;