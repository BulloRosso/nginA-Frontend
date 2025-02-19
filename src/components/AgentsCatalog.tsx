// components/agents/AgentsCatalog.tsx
import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CircularProgress,
  Container,
  Alert,
  Fab,
  Tooltip
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import { useTranslation } from 'react-i18next';
import { AgentService } from '../services/agents';
import { TeamService } from '../services/teams';
import { Agent } from '../types/agent';
import { Team } from '../types/team';

const AgentsCatalog: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingAgent, setAddingAgent] = useState<string | null>(null);
  const { i18n, t } = useTranslation();

  const fetchData = async () => {
    try {
      const [agentsData, teamData] = await Promise.all([
        AgentService.getAgents(),
        TeamService.getTeam()
      ]);
      setAgents(agentsData);
      setTeam(teamData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAgentInTeam = (agentId: string): boolean => {
    return team?.agents.members.some(member => member.agentId === agentId) ?? false;
  };

  const handleAddToTeam = async (agentId: string) => {
    try {
      setAddingAgent(agentId);
      const updatedTeam = await TeamService.addAgent(agentId);
      setTeam(updatedTeam);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add agent to team');
    } finally {
      setAddingAgent(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Grid container spacing={3}>
      {agents.map((agent) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
          <Card 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            {/* Add to Team FAB */}
            <Tooltip 
              title={isAgentInTeam(agent.id) ? t('common.already_in_team') : t('common.add_to_team')}
              placement="top"
            >
              <Fab
                size="small"
                color="primary"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  opacity: isAgentInTeam(agent.id) ? 0.5 : 1
                }}
                onClick={() => !isAgentInTeam(agent.id) && handleAddToTeam(agent.id)}
                disabled={isAgentInTeam(agent.id) || addingAgent === agent.id}
              >
                {addingAgent === agent.id ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <GroupAddOutlinedIcon />
                )}
              </Fab>
            </Tooltip>

            <CardContent 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: 2,
                '&:last-child': { 
                  pb: 2
                }
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {agent.title[i18n.language as keyof typeof agent.title] || agent.title.en}
                </Typography>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {agent.description[i18n.language as keyof typeof agent.description] || agent.description.en}
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 'auto',
                  pt: 1,
                  borderTop: 1,
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StarIcon sx={{ color: 'gold', mr: 0.5 }} fontSize="small" />
                  <Typography variant="body2">
                    {agent.stars}
                  </Typography>
                </Box>

                <Typography 
                  variant="body2" 
                  color="primary"
                  sx={{ fontWeight: 'medium' }}
                >
                  {agent.credits_per_run} cred.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default AgentsCatalog;