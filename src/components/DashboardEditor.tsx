import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Grid, 
  Paper, 
  Container,
  Button,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Checkbox,
  Stack,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DashboardService } from '../services/dashboards';
import { AgentService } from '../services/agents';
import { TeamService } from '../services/teams';
import { Dashboard, DashboardComponent } from '../types/dashboard';
import { Agent } from '../types/agent';
import DashboardLayoutEditor, { PlacedComponent } from './DashboardLayoutEditor';
import { useNavigate, useParams } from 'react-router-dom';

// TabPanel component for handling tab content
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Helper function for tab props
function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

// Agent Selection Dialog component
interface AgentSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (selectedAgents: Agent[]) => void;
  initialSelectedAgents: Agent[];
}

const AgentSelectionDialog: React.FC<AgentSelectionDialogProps> = ({ 
  open, 
  onClose, 
  onSave,
  initialSelectedAgents 
}) => {
  // Implementation remains the same
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>(initialSelectedAgents || []);
  const [teamAgents, setTeamAgents] = useState<string[]>([]);

  // Load team and agents data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get team data to see which agents the user has access to
        const team = await TeamService.getTeam();
        const teamAgentIds = team.agents.members.map(member => member.agentId);
        setTeamAgents(teamAgentIds);

        // Get all agents
        const allAgents = await AgentService.getAgents();

        // Filter agents that are in the team
        const availableAgents = allAgents.filter(agent => 
          teamAgentIds.includes(agent.id)
        );

        setAgents(availableAgents);
        setLoading(false);
      } catch (error) {
        console.error("Error loading agents:", error);
        setLoading(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  const handleToggleAgent = (agent: Agent) => {
    const currentIndex = selectedAgents.findIndex(a => a.id === agent.id);
    const newSelectedAgents = [...selectedAgents];

    if (currentIndex === -1) {
      newSelectedAgents.push(agent);
    } else {
      newSelectedAgents.splice(currentIndex, 1);
    }

    setSelectedAgents(newSelectedAgents);
  };

  const handleSave = () => {
    onSave(selectedAgents);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Agents</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
            {agents.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                No agents available in your team.
              </Typography>
            ) : (
              agents.map(agent => (
                <ListItemButton 
                  key={agent.id} 
                  onClick={() => handleToggleAgent(agent)}
                >
                  <ListItemAvatar>
                    <Box
                      sx={{ 
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.paper',
                        borderRadius: '50%',
                        border: '1px solid #eee'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: agent.icon_svg || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ccc"/></svg>' 
                      }} 
                    />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={agent.title.en} 
                    secondary={agent.description.en} 
                  />
                  <Checkbox 
                    edge="end"
                    checked={selectedAgents.some(a => a.id === agent.id)}
                  />
                </ListItemButton>
              ))
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Interface for dashboard option items in the combobox
interface DashboardOption {
  id: string;
  label: string;
}

const DashboardEditor: React.FC<{
  onSave?: (dashboard: Dashboard) => void;
  onDashboardChange?: (dashboardId: string) => void;
}> = ({ onSave, onDashboardChange }) => {
  // Get dashboard ID from route params
  const { id: routeDashboardId } = useParams<{ id?: string }>();

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // State for dashboard details
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');

  // State for components
  const [availableComponents, setAvailableComponents] = useState<DashboardComponent[]>([]);
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // State for agents
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);

  // State for toast notification
  const [toastOpen, setToastOpen] = useState(false);

  // State for dashboard selector
  const [availableDashboards, setAvailableDashboards] = useState<DashboardOption[]>([]);
  const [loadingDashboards, setLoadingDashboards] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardOption | null>(null);

  // Initialize navigate
  const navigate = useNavigate();

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Load available dashboards for the combobox
  useEffect(() => {
    const loadDashboards = async () => {
      try {
        setLoadingDashboards(true);
        const dashboards = await DashboardService.list_dashboards();
        const options = dashboards.map(dashboard => ({
          id: dashboard.id,
          label: dashboard.description?.en.title || `Dashboard ${dashboard.id}`
        }));
        setAvailableDashboards(options);

        // Set selected dashboard if routeDashboardId is provided
        if (routeDashboardId) {
          const current = options.find(option => option.id === routeDashboardId);
          if (current) {
            setSelectedDashboard(current);
          }
        } else {
          // Reset selected dashboard if we're on the main dashboard page
          setSelectedDashboard(null);
        }

        setLoadingDashboards(false);
      } catch (error) {
        console.error("Error loading dashboards:", error);
        setLoadingDashboards(false);
      }
    };

    loadDashboards();
  }, [routeDashboardId]);

  // Handle dashboard selection change
  const handleDashboardChange = (_event: React.SyntheticEvent, value: DashboardOption | null) => {
    if (value && value.id !== routeDashboardId) {
      // Navigate to the selected dashboard
      navigate(`/dashboards/edit/${value.id}`);

      // Reset the selection to allow future selections of the same dashboard
      setTimeout(() => {
        setSelectedDashboard(null);
      }, 100);

      if (onDashboardChange) {
        onDashboardChange(value.id);
      }
    }
  };

  // Copy customer URL to clipboard
  const handleCopyCustomerUrl = () => {
    if (!routeDashboardId) return;

    // Construct the URL using current protocol and host
    const url = `${window.location.protocol}//${window.location.host}/dashboards/${routeDashboardId}`;

    // Copy to clipboard
    navigator.clipboard.writeText(url)
      .then(() => {
        // Show toast notification
        setToastOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy URL to clipboard:', err);
      });
  };

  // Close toast notification
  const handleToastClose = () => {
    setToastOpen(false);
  };

  // Load available components
  useEffect(() => {
    const loadComponents = async () => {
      try {
        // First try to load from the backend
        let components;
        try {
          components = await DashboardService.getDashboardComponents(false);
          console.log("Loaded components from backend:", components);
        } catch (error) {
          console.warn("Error loading components from backend, falling back to mock data:", error);
          // Fallback to mock data if backend fails
          components = await DashboardService.getDashboardComponents(true);
          console.log("Loaded mock components:", components);
        }

        setAvailableComponents(components);
      } catch (error) {
        console.error("Error loading components:", error);
        // Fallback to empty array if there's an error
        setAvailableComponents([]);
      }
    };

    loadComponents();
  }, []);

  // Load dashboard data if editing existing dashboard (using routeDashboardId)
  useEffect(() => {
    const loadDashboard = async () => {
      if (!routeDashboardId) {
        // Reset the form if no dashboard ID
        setTitle('');
        setDescription('');
        setLogoUrl('');
        setPlacedComponents([]);
        setSelectedAgents([]);
        return;
      }

      try {
        console.log(`Loading dashboard data for ID: ${routeDashboardId}`);
        // Use mockData=true while backend is being fixed
        const dashboard = await DashboardService.getDashboard(routeDashboardId, true);
        if (dashboard) {
          // Set basic details
          setTitle(dashboard.description?.en.title || '');
          setDescription(dashboard.description?.en.description || '');
          setLogoUrl(dashboard.style?.layout?.logoUrl || '');

          // Set placed components
          if (dashboard.style?.components) {
            const componentsPromises = dashboard.style.components.map(async (comp: any) => {
              try {
                // Use mockData=true while backend is being fixed
                const component = await DashboardService.getDashboardComponent(comp.id, true);
                if (component) {
                  return {
                    id: comp.id,
                    startRow: comp.startRow,
                    startCol: comp.startCol,
                    name: component.name || '',
                    type: component.type || '',
                    colSpan: component.layout_cols || 2,
                    rowSpan: component.layout_rows || 2
                  };
                }
              } catch (error) {
                console.error(`Error loading component ${comp.id}:`, error);
              }
              return null;
            });

            const loadedComponents = await Promise.all(componentsPromises);
            setPlacedComponents(loadedComponents.filter(c => c !== null) as PlacedComponent[]);
          }

          // Load assigned agents
          if (dashboard.agents) {
            try {
              const agentPromises = dashboard.agents.map(async (agentInfo: any) => {
                return await AgentService.getAgent(agentInfo.id, true);
              });

              const loadedAgents = await Promise.all(agentPromises);
              setSelectedAgents(loadedAgents.filter(a => a !== null) as Agent[]);
            } catch (error) {
              console.error("Error loading agents:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      }
    };

    loadDashboard();
  }, [routeDashboardId]);

  // Add component to the grid
  const handleAddComponent = (component: DashboardComponent, row: number, col: number) => {
    console.log("handleAddComponent called:", { component, row, col });

    const componentId = component.id;
    const colSpan = component.layout_cols || 2;
    const rowSpan = component.layout_rows || 2;

    const newComponent: PlacedComponent = {
      id: componentId,
      startRow: row,
      startCol: col,
      name: component.name || '',
      type: component.type || '',
      colSpan: colSpan,
      rowSpan: rowSpan
    };

    // Check for overlap with existing components
    const hasOverlap = placedComponents.some(existingComp => {
      const existingRight = existingComp.startCol + existingComp.colSpan - 1;
      const existingBottom = existingComp.startRow + existingComp.rowSpan - 1;
      const newRight = col + colSpan - 1;
      const newBottom = row + rowSpan - 1;

      const overlaps = (
        (col <= existingRight && newRight >= existingComp.startCol) &&
        (row <= existingBottom && newBottom >= existingComp.startRow)
      );

      if (overlaps) {
        console.warn("Placement rejected - would overlap with component:", existingComp);
      }

      return overlaps;
    });

    // Check if component would go outside grid bounds
    const exceedsGrid = 
      col + colSpan > 12 || 
      row + rowSpan > 8;

    if (exceedsGrid) {
      console.warn("Placement rejected - would exceed grid bounds:", { 
        col, row, colSpan, rowSpan, gridWidth: 12, gridHeight: 8 
      });
    }

    if (!hasOverlap && !exceedsGrid) {
      console.log("Adding new component to placedComponents:", newComponent);
      // Use concat instead of push to create a new array reference
      setPlacedComponents(prevComponents => [...prevComponents, newComponent]);
      setSelectedComponentId(componentId);
    }
  };

  // Move an existing component
  const handleMoveComponent = (id: string, newRow: number, newCol: number) => {
    console.log("handleMoveComponent called:", { id, newRow, newCol });
    console.log("Current placedComponents:", placedComponents);

    const componentToMove = placedComponents.find(comp => comp.id === id);
    if (!componentToMove) {
      console.error("Component not found for id:", id);
      return;
    }

    // Check for bounds
    if (newCol + componentToMove.colSpan > 12 || newRow + componentToMove.rowSpan > 8) {
      console.warn("Move rejected - would exceed grid bounds", { 
        newCol, 
        newRow, 
        colSpan: componentToMove.colSpan, 
        rowSpan: componentToMove.rowSpan 
      });
      return;
    }

    // Check for overlap with other components
    const hasOverlap = placedComponents.some(existingComp => {
      if (existingComp.id === id) return false; // Skip the component being moved

      const existingRight = existingComp.startCol + existingComp.colSpan - 1;
      const existingBottom = existingComp.startRow + existingComp.rowSpan - 1;
      const newRight = newCol + componentToMove.colSpan - 1;
      const newBottom = newRow + componentToMove.rowSpan - 1;

      const overlaps = (
        (newCol <= existingRight && newRight >= existingComp.startCol) &&
        (newRow <= existingBottom && newBottom >= existingComp.startRow)
      );

      if (overlaps) {
        console.warn("Move rejected - would overlap with component:", existingComp);
      }

      return overlaps;
    });

    if (!hasOverlap) {
      console.log("Updating component position:", { 
        id, 
        oldPos: { row: componentToMove.startRow, col: componentToMove.startCol },
        newPos: { row: newRow, col: newCol }
      });

      const updatedComponents = placedComponents.map(comp => 
        comp.id === id 
          ? { ...comp, startRow: newRow, startCol: newCol } 
          : comp
      );

      console.log("Updated placedComponents:", updatedComponents);
      setPlacedComponents(updatedComponents);
    }
  };

  // Remove a component from the grid
  const handleRemoveComponent = (id: string) => {
    setPlacedComponents(placedComponents.filter(comp => comp.id !== id));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  // Remove an agent from the selection
  const handleRemoveAgent = (agentId: string) => {
    setSelectedAgents(selectedAgents.filter(agent => agent.id !== agentId));
  };

  // Handle agent selection
  const handleAgentSelectionSave = (agents: Agent[]) => {
    setSelectedAgents(agents);
  };

  // Handle dashboard save
  const handleSave = async (): Promise<void> => {
    const dashboardData = {
      description: {
        en: {
          title,
          description
        }
      },
      style: {
        layout: {
          logoUrl,
          templateName: 'default'
        },
        components: placedComponents.map(comp => ({
          id: comp.id,
          startRow: comp.startRow,
          startCol: comp.startCol
        }))
      },
      // Include agents in the saved data
      agents: selectedAgents.map(agent => ({
        id: agent.id,
        title: agent.title.en
      })),
      is_anonymous: false
    };

    try {
      console.log("Saving dashboard with data:", dashboardData);

      let result;
      // Set mockData=false to use the real backend API
      if (routeDashboardId) {
        console.log(`Updating existing dashboard with ID: ${routeDashboardId}`);
        result = await DashboardService.updateDashboard(routeDashboardId, dashboardData, false);
      } else {
        console.log("Creating new dashboard");
        result = await DashboardService.createDashboard(dashboardData, false);

        // Navigate to the edit page for the new dashboard
        if (result && result.id) {
          navigate(`/dashboards/edit/${result.id}`);
        }
      }

      console.log("Dashboard saved successfully:", result);

      if (result && onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error("Error saving dashboard:", error);
      // Provide more detailed error information
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Status code:", error.response.status);
      }
      alert("There was an error saving the dashboard. Please check the console for details.");
    }
  };

  return (
    <Container maxWidth="lg">
      <Box 
        sx={{ 
          mt: 3, 
          mb: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h4">
          Dashboard Editor
        </Typography>

        <Autocomplete
          sx={{ width: 300 }}
          options={availableDashboards}
          loading={loadingDashboards}
          value={selectedDashboard}
          onChange={handleDashboardChange}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Load Dashboard"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingDashboards ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>

      {/* Dashboard Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="dashboard editor tabs"
          >
            <Tab label="Title & Description" {...a11yProps(0)} />
            <Tab label="Agents" {...a11yProps(1)} />
            <Tab label="Customer URL" {...a11yProps(2)} />
          </Tabs>
        </Box>

        {/* Title & Description Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title (English)"
                fullWidth
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Logo URL"
                fullWidth
                size="small"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description (English)"
                fullWidth
                multiline
                size="small"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Agents Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Assigned Agents</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAgentDialogOpen(true)}
            >
              Add Agents
            </Button>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {selectedAgents.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No agents assigned to this dashboard. Click "Add Agents" to select agents.
              </Typography>
            ) : (
              selectedAgents.map(agent => (
                <Chip
                  key={agent.id}
                  label={agent.title.en}
                  onDelete={() => handleRemoveAgent(agent.id)}
                  icon={
                    <Box
                      component="span"
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: agent.icon_svg || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ccc"/></svg>' 
                      }}
                    />
                  }
                  sx={{ m: 0.5 }}
                />
              ))
            )}
          </Stack>
        </TabPanel>

        {/* Customer URL Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Share this URL with your customers
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This URL provides direct access to this dashboard.
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Customer URL"
            variant="outlined"
            size="small"
            value={routeDashboardId ? `${window.location.protocol}//${window.location.host}/dashboards/${routeDashboardId}` : 'Save the dashboard first to get a shareable URL'}
            onClick={routeDashboardId ? handleCopyCustomerUrl : undefined}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={handleCopyCustomerUrl}
                    disabled={!routeDashboardId}
                    title="Copy URL"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              cursor: routeDashboardId ? 'pointer' : 'not-allowed',
              bgcolor: 'background.paper'
            }}
          />
        </TabPanel>
      </Paper>

      {/* Layout Editor */}
      {tabValue === 0 && (
        <DashboardLayoutEditor
          availableComponents={availableComponents}
          placedComponents={placedComponents}
          selectedComponentId={selectedComponentId}
          onAddComponent={handleAddComponent}
          onMoveComponent={handleMoveComponent}
          onSelectComponent={setSelectedComponentId}
          onRemoveComponent={handleRemoveComponent}
        />
      )}

      {/* Action Buttons */}
      <Box sx={{ mt: 3, mb: 5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSave}
          disabled={!title}
        >
          Save Dashboard
        </Button>
      </Box>

      {/* Agent Selection Dialog */}
      <AgentSelectionDialog
        open={agentDialogOpen}
        onClose={() => setAgentDialogOpen(false)}
        onSave={handleAgentSelectionSave}
        initialSelectedAgents={selectedAgents}
      />

      {/* Toast Notification */}
      <Snackbar 
        open={toastOpen} 
        autoHideDuration={4000} 
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleToastClose} severity="success" variant="filled">
          Customer URL copied to clipboard
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DashboardEditor;