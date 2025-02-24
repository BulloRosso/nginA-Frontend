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
  Alert
} from '@mui/material';
import { OperationService } from '../../services/operations';
import { TeamStatus as TeamStatusType } from '../../types/operation';

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

export const TeamStatus: React.FC = () => {
  const [teamStatus, setTeamStatus] = useState<TeamStatusType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamStatus = async () => {
      try {
        const data = await OperationService.getTeamStatus();
        setTeamStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team status');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamStatus();
    // Refresh every minute
    const interval = setInterval(fetchTeamStatus, 60000);
    return () => clearInterval(interval);
  }, []);

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
      <Alert severity="info" sx={{ mt: 2 }}>
        No agents found in the team.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {teamStatus.agents.map((agent) => (
        <Card key={agent.title} variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {agent.title}
            </Typography>
            {agent.lastRun ? (
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip 
                    size="small"
                    label={agent.lastRun.status || 'Unknown'}
                    color={getStatusColor(agent.lastRun.status)}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Started: {formatDateTime(agent.lastRun.startedAt)}
                </Typography>
                {agent.lastRun.finishedAt && (
                  <Typography variant="body2" color="text.secondary">
                    Finished: {formatDateTime(agent.lastRun.finishedAt)}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Duration: {formatDuration(agent.lastRun.duration)}
                </Typography>
                {agent.lastRun.workflowId && (
                  <Typography variant="body2" color="text.secondary">
                    Workflow ID: {agent.lastRun.workflowId}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No runs recorded
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default TeamStatus;