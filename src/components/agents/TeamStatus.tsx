// src/components/agents/TeamStatus.tsx
import React, { useEffect, useState } from 'react';
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
  Fab,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Pagination
} from '@mui/material';
import { 
  DirectionsRun as RunIcon,
  Pause as PauseIcon,
  BackHand as BackHandIcon,
  FilePresent as FileIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

import { OperationService } from '../../services/operations';
import { TeamStatus as TeamStatusType } from '../../types/operation';
import { AgentService } from '../../services/agents';
import { TeamService } from '../../services/teams';
import { Agent } from '../../types/agent';
import AgentIcon from './AgentIcon';
import SchemaForm from './tabs/InputFormForSchema';
import MonacoEditor from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const getStatusColor = (status: string | null): "default" | "success" | "error" | "warning" | "info" => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'running':
      return 'warning';
    case null:
      return 'default';
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

export const TeamStatus: React.FC = () => {

  const { t, i18n } = useTranslation(['agents']);
  const navigate = useNavigate();
  
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
    console.log("n8nURL", `${n8nUrl}/workflow/${workflowId}`)
    window.open(`${n8nUrl}/workflow/${workflowId}`, '_blank');
    handleMenuClose();
  };

  const handleShowResults = (results: any) => {
    setCurrentResults(results);
    setResultsDialogOpen(true);
  };

  const handleStartRun = async (agent: Agent) => {
    
    try {
      setLoading(true);

      // Fetch complete agent details including input schema
      const completeAgent = await AgentService.getAgent(agent.id);

      setCurrentAgent(completeAgent);
      setRunParametersDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent details');
    } finally {
      setLoading(false);
    }
  }

  const handleRunParametersSubmit = async (formData: any) => {
    if (!currentAgent) return;

    try {
      // Implement the API call to start a new run with the parameters
      await OperationService.startRun(currentAgent.id, formData);

      // Refresh the team status to show the new run
      const statusData = await OperationService.getTeamStatus();
      setTeamStatus(statusData);

      setRunParametersDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start run');
    }
  };

  const getFabIcon = (status: string | null) => {
    switch (status) {
      case 'running':
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

  // Single useEffect for data fetching
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
    // Refresh every minute
    // const interval = setInterval(fetchData, 60000);
    // return () => clearInterval(interval);
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
                    isActive={isAgentInTeam(agent.id)} 
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
                          <Typography variant="body2" color="text.secondary">
                            Status:
                          </Typography>
                          <Chip 
                            size="small"
                            label={agentStatus.lastRun?.status || 'Never run'}
                            sx={{ 
                              backgroundColor: '#ccc',
                              color: 'rgba(0, 0, 0, 0.87)'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ width: '50%' }}>
                      <Box sx={{ flex: 1 }}>
                        {agentStatus.lastRun && (
                          <Box display="flex" flexWrap="wrap" sx={{ gap: 0 }}>
                            <Typography variant="body2" color="text.secondary">
                              Started: {formatDateTime(agentStatus.lastRun.startedAt)}
                            </Typography>
                            {agentStatus.lastRun.finishedAt && (
                              <Typography variant="body2" color="text.secondary">
                                Finished: {formatDateTime(agentStatus.lastRun.finishedAt)}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Duration: {formatDuration(agentStatus.lastRun.duration)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
                        <Box textAlign="center">
                          <Tooltip title={active ? "Manage Run" : "Start Run"}>
                            <IconButton
                              aria-label="run"
                              type="button"
                              size="small"
                              sx={{
                                backgroundColor: '#ccc',
                                padding: '8px',
                                '&:hover': {
                                  backgroundColor: 'gold',
                                },
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (agent) {
                                  handleStartRun(agent);
                                }
                              }}
                            >
                              {getFabIcon(agentStatus.lastRun?.status)}
                            </IconButton>
                          </Tooltip>

                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FileIcon />}
                          disabled={!active || !hasResults}
                          onClick={() => hasResults && handleShowResults(agentStatus.lastRun.results)}
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
          mb: 2 , 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{
        display:'flex',
        aligntItems:'center',
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

          <img  onClick={handleCreateNew} src="/img/agent-profile.jpg" 
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
        <DialogTitle>Run Results</DialogTitle>
        <DialogContent>
          <Box sx={{ height: '60vh' }}>
            <MonacoEditor
              height="100%"
              defaultLanguage="json"
              defaultValue={JSON.stringify(currentResults, null, 2)}
              options={{
                readOnly: true,
                minimap: { enabled: true }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Run Parameters Dialog */}
      <Dialog
        open={runParametersDialogOpen}
        onClose={() => setRunParametersDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Start Run</DialogTitle>
        <DialogContent>
          {currentAgent ? (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Configure run parameters for {currentAgent.title.en}
              </Typography>

              {currentAgent.input ? (
                <SchemaForm
                  schema={currentAgent.input}
                  onSubmit={handleRunParametersSubmit}
                  isLoading={false}
                />
              ) : (
                <>
                  <Typography color="text.secondary">
                    This agent doesn't require any input parameters.
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained"
                      onClick={() => handleRunParametersSubmit({})}
                      sx={{
                        backgroundColor: 'gold',
                        '&:hover': {
                          backgroundColor: '#DAA520',
                        }
                      }}
                    >
                      Start Run
                    </Button>
                  </Box>
                </>
              )}
            </>
          ) : (
            <Typography color="error">
              No agent selected. Please try again.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRunParametersDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamStatus;