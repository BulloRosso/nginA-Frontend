// src/components/agents/RunHistory.tsx
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Drawer, 
  IconButton, 
  CircularProgress, 
  Alert,
  List,
  ListItem,
  Chip,
  Button,
  Divider,
  Link
} from '@mui/material';
import { Close as CloseIcon, FilePresent as FileIcon } from '@mui/icons-material';
import { Operation } from '../../types/operation';
import { OperationService } from '../../services/operations';
import { UUID } from '../../types/common';

interface RunHistoryProps {
  open: boolean;
  onClose: () => void;
  agentId: UUID | null;
  agentTitle: string;
  onShowResults: (results: any, run_id?: string) => void;
}

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
      return 'white';
    case 'failure':
      return 'white';
    case 'pending':
      return 'white';
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

// Helper to extract executionIds from results
const getExecutionIds = (results: any): string[] => {
  if (!results) return [];

  // Check if 'flow' exists and is an array
  if (results.flow && Array.isArray(results.flow)) {
    return results.flow
      .filter(item => item && item.executionId)
      .map(item => item.executionId);
  }

  return [];
};

const RunHistory: React.FC<RunHistoryProps> = ({ 
  open, 
  onClose, 
  agentId, 
  agentTitle,
  onShowResults 
}) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOperations = async () => {
      if (!agentId || !open) return;

      setLoading(true);
      setError(null);

      try {
        const data = await OperationService.getAgentRunHistory(agentId);
        setOperations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch run history');
      } finally {
        setLoading(false);
      }
    };

    fetchOperations();
  }, [agentId, open]);

  const hasValidResults = (operation: Operation) => {
    return operation.results && Object.keys(operation.results).length > 0;
  };

  // Calculate run duration
  const calculateDuration = (operation: Operation): number => {
    if (!operation.created_at || !operation.finished_at) return 0;

    const startTime = new Date(operation.created_at).getTime();
    const endTime = new Date(operation.finished_at).getTime();

    return Math.round((endTime - startTime) / 1000);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': { 
          width: '500px',
          padding: 2,
          boxSizing: 'border-box'
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Run History: {agentTitle}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : operations.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No run history found for this agent
        </Alert>
      ) : (
        <List>
          {operations.map((operation) => {
            const duration = calculateDuration(operation);
            const hasResults = hasValidResults(operation);
            const executionIds = getExecutionIds(operation.results);

            return (
              <ListItem 
                key={operation.id.toString()}
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1,
                  display: 'block'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1">
                      {formatDateTime(operation.created_at)}
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ mt: 0.5 }}>
                      <Chip 
                        size="small"
                        label={operation.status || 'Unknown'}
                        sx={{ 
                          mr: 1,
                          backgroundColor: getStatusColor(operation.status),
                          color: getStatusFontColor(operation.status)
                        }}
                      />
                      {duration > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          &#128336; {formatDuration(duration)}
                        </Typography>
                      )}

                      {executionIds.length > 0 && (
                        <span>
                          {executionIds.map((executionId, index) => (
                            <Link 
                              key={index}
                              href={`${import.meta.env.VITE_N8N_URL}/workflow/${operation.workflow_id}/executions/${executionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ display: 'block', ml: '10px', fontSize: '80%' }}
                            >
                              Execution #{executionId}
                            </Link>
                          ))}
                          </span>
                      )}
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileIcon />}
                    onClick={() => {
                      onShowResults(
                        operation.results, 
                        operation.id.toString()
                      );
                    }}
                  >
                    Results
                  </Button>
                </Box>


              </ListItem>
            );
          })}
        </List>
      )}
    </Drawer>
  );
};

export default RunHistory;