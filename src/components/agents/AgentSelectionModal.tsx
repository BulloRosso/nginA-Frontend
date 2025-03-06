// src/components/agents/AgentSelectionModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { TeamService } from '../../services/teams';
import { AgentService } from '../../services/agents';
import { Agent } from '../../types/agent';
import useAgentStore from '../../../stores/agentStore';
import { useTranslation } from 'react-i18next';

interface AgentSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const AgentSelectionModal: React.FC<AgentSelectionModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teamAgentIds, setTeamAgentIds] = useState<string[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [orderedAgents, setOrderedAgents] = useState<Agent[]>([]);
  const { addAgentToChain, setCurrentAgentChain } = useAgentStore();
  const { t } = useTranslation(['agents', 'common']);

  // Track component lifecycle
  useEffect(() => {
    console.log('AgentSelectionModal mounted');

    return () => {
      console.log('AgentSelectionModal unmounted');
    };
  }, []);

  // Add another effect to track ordered agents changes
  useEffect(() => {
    if (orderedAgents.length > 0) {
      console.log('orderedAgents changed:', orderedAgents.map(a => a.id));
    }
  }, [orderedAgents]);

  // Fetch team and agents data
  useEffect(() => {
    const fetchData = async () => {
      if (open) {
        setLoading(true);
        try {
          // Get team data to know which agents are in the team
          const team = await TeamService.getTeam();
          const teamAgentIds = team.agents.members.map(member => member.agentId);
          setTeamAgentIds(teamAgentIds);

          // Get all agents
          const allAgents = await AgentService.getAgents();

          // Filter agents to only include those in the team
          const teamAgents = allAgents.filter(agent => 
            teamAgentIds.includes(agent.id)
          );

          setAgents(teamAgents);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [open]);

  // Reset state when modal is opened
  useEffect(() => {
    if (open) {
      setSelectedAgentIds([]);
      setOrderedAgents([]);
      setActiveStep(0);
    }
  }, [open]);

  // Update orderedAgents when selection changes and moving to step 1
  useEffect(() => {
    if (activeStep === 1) {
      const selectedAgents = agents.filter(agent => 
        selectedAgentIds.includes(agent.id)
      );

      // Ensure each agent has a string ID
      const agentsWithStringIds = selectedAgents.map(agent => {
        console.log(`Preparing agent for drag: ${agent.id}`);
        return {
          ...agent,
          id: String(agent.id) // Ensure ID is a string
        };
      });

      console.log('Setting ordered agents:', agentsWithStringIds.map(a => a.id));
      setOrderedAgents(agentsWithStringIds);
    }
  }, [activeStep, selectedAgentIds, agents]);

  const handleToggleAgent = (agentId: string) => {
    setSelectedAgentIds(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };



  const handleConfirm = () => {
    // Clear current chain first
    setCurrentAgentChain([]);

    // Add agents to the chain in the specified order
    orderedAgents.forEach(agent => {
      addAgentToChain(agent);
    });

    // Set a success message to be displayed in the parent component
    if (onSuccess) {
      if (orderedAgents.length === 1) {
        onSuccess(t('agents.agent_added_successfully'));
      } else if (orderedAgents.length > 1) {
        onSuccess(t('agents.agents_added_successfully', { count: orderedAgents.length }));
      }
    }

    onClose();
  };

  // Render agent selection step
  const renderAgentSelection = () => (
    <>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          {t('agents.select_required_agents')}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : agents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('agents.no_team_agents')}
          </Typography>
        ) : (
          <List sx={{ pt: 1 }}>
            {agents.map((agent) => (
              <ListItem key={agent.id} dense button onClick={() => handleToggleAgent(agent.id)}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedAgentIds.includes(agent.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                {agent.icon_svg && (
                  <Box 
                    sx={{ 
                      mr: 2, 
                      width: 24, 
                      height: 24, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                    dangerouslySetInnerHTML={{ __html: agent.icon_svg }}
                  />
                )}
                <ListItemText 
                  primary={agent.title.en} 
                  secondary={agent.description.en} 
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleNext}
          color="primary"
          disabled={selectedAgentIds.length === 0}
        >
          {t('agents.next_sequence')}
        </Button>
      </DialogActions>
    </>
  );

  // Render agent ordering step
  const renderAgentOrdering = () => {
    // Using a simple array for manual reordering to avoid react-beautiful-dnd issues
    const moveAgent = (index, direction) => {
      const newAgents = [...orderedAgents];
      if (direction === 'up' && index > 0) {
        // Swap with previous item
        [newAgents[index], newAgents[index - 1]] = [newAgents[index - 1], newAgents[index]];
        setOrderedAgents(newAgents);
      } else if (direction === 'down' && index < newAgents.length - 1) {
        // Swap with next item
        [newAgents[index], newAgents[index + 1]] = [newAgents[index + 1], newAgents[index]];
        setOrderedAgents(newAgents);
      }
    };

    return (
      <>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            {t('agents.order_agents')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('agents.set_agent_order')}
          </Typography>

          <Paper 
            variant="outlined"
            sx={{ minHeight: '200px', overflow: 'hidden' }}
          >
            {orderedAgents.length === 0 ? (
              <Box
                sx={{
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                  fontStyle: 'italic'
                }}
              >
                <Typography color="text.secondary" fontStyle="italic">
                  {t('agents.no_agents_selected')}
                </Typography>
              </Box>
            ) : (
              orderedAgents.map((agent, index) => (
                <Box
                  key={agent.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: index < orderedAgents.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', mr: 2 }}>
                    <Button
                      size="small"
                      disabled={index === 0}
                      onClick={() => moveAgent(index, 'up')}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      ▲
                    </Button>
                    <Button
                      size="small" 
                      disabled={index === orderedAgents.length - 1}
                      onClick={() => moveAgent(index, 'down')}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      ▼
                    </Button>
                  </Box>

                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    {agent.icon_svg && (
                      <Box 
                        sx={{ 
                          mr: 2, 
                          width: 30, 
                          height: 30, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                        dangerouslySetInnerHTML={{ __html: agent.icon_svg }}
                      />
                    )}
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {`${index + 1}. ${agent.title.en}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {agent.description.en.substring(0, 100)}
                        {agent.description.en.length > 100 ? '...' : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBack} color="inherit">
            {t('common.back')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            color="primary" 
            variant="contained"
            disabled={orderedAgents.length === 0}
          >
            {t('common.ok')}
          </Button>
        </DialogActions>
      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="agent-selection-dialog-title"
    >
      <DialogTitle id="agent-selection-dialog-title">
        {t('agents.add_agents_to_workflow')}
      </DialogTitle>

      <Stepper activeStep={activeStep} sx={{ px: 3, py: 2 }}>
        <Step>
          <StepLabel>{t('agents.select_agents')}</StepLabel>
        </Step>
        <Step>
          <StepLabel>{t('agents.sequence_agents')}</StepLabel>
        </Step>
      </Stepper>

      <Divider />

      {activeStep === 0 && renderAgentSelection()}
      {activeStep === 1 && renderAgentOrdering()}
    </Dialog>
  );
};

export default AgentSelectionModal;