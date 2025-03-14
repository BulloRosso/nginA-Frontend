// src/components/dashboards/TileHumanInTheLoopNotifications.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress,
  FormControl,
  FormLabel,
  TextField,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import eventBus from './DashboardEventBus';
import TileHeader from './TileHeader';
import { OperationService, HumanFeedbackItem } from '../../services/operations';
import { UUID } from '../../types/common';

interface TileHumanInTheLoopNotificationsSettings {
  title?: string;
}

interface TileHumanInTheLoopNotificationsProps {
  settings?: TileHumanInTheLoopNotificationsSettings;
  renderMode?: 'dashboard' | 'settings';
  fullHeight?: boolean;
}

const TileHumanInTheLoopNotifications: React.FC<TileHumanInTheLoopNotificationsProps> = ({ 
  settings = {}, 
  renderMode = 'dashboard',
  fullHeight = false
}) => {
  const [localSettings, setLocalSettings] = useState<TileHumanInTheLoopNotificationsSettings>({
    title: settings.title || 'Human Feedback Requests'
  });

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<HumanFeedbackItem[]>([]);

  // For the feedback modal
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<HumanFeedbackItem | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string>('');

  // Listen for agentRunSelected events
  useEffect(() => {
    const handleAgentRunSelected = (data: { runId: string, agentId: string }) => {
      console.log('Agent run selected:', data);
      setSelectedRunId(data.runId);
      fetchHumanFeedbackItems(data.runId);
    };

    // Subscribe to the event
    eventBus.on('agentRunSelected', handleAgentRunSelected);

    // Cleanup subscription
    return () => {
      eventBus.off('agentRunSelected', handleAgentRunSelected);
    };
  }, []);

  // Set up polling interval for data refresh
  useEffect(() => {
    // Only set up polling if we have a selected run ID
    if (!selectedRunId) return;

    // Initial fetch
    fetchHumanFeedbackItems(selectedRunId);

    // Set up interval for polling every 10 seconds
    const intervalId = setInterval(() => {
      fetchHumanFeedbackItems(selectedRunId);
    }, 60000);

    // Clean up interval when component unmounts or runId changes
    return () => {
      clearInterval(intervalId);
    };
  }, [selectedRunId]);

  const fetchHumanFeedbackItems = async (runId: string) => {
    setLoading(true);
    try {
      // Use the OperationService to fetch human feedback items
      const data = await OperationService.getHumanFeedbackItems(runId, 'pending');
      console.log('Human feedback items:', data);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching human feedback items:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedbackModal = (item: HumanFeedbackItem) => {
    setSelectedItem(item);
    setFeedbackReason(item.reason || '');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedItem(null);
    setFeedbackReason('');
  };

  const handleSubmitFeedback = async (status: 'approved' | 'rejected') => {
    if (!selectedItem || !feedbackReason.trim()) return;

    try {
      // Use the OperationService to update the human feedback
      await OperationService.updateHumanFeedback(
        selectedItem.id,
        status,
        feedbackReason
      );

      // If the item has a callback URL, invoke it asynchronously
      if (selectedItem.callback_url) {
        // Fire and forget - we don't need to wait for the response
        fetch(selectedItem.callback_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            reason: feedbackReason,
            id: selectedItem.id
          }),
        }).catch(error => {
          console.error('Error invoking callback URL:', error);
        });
      }

      // Refresh the notifications list
      if (selectedRunId) {
        fetchHumanFeedbackItems(selectedRunId);
      }

      // Close the modal
      handleCloseModal();
    } catch (error) {
      console.error('Error updating human feedback:', error);
    }
  };

  const handleSettingChange = (field: keyof TileHumanInTheLoopNotificationsSettings, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Settings form
  if (renderMode === 'settings') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Human Feedback Notifications Settings</Typography>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <FormLabel>Title</FormLabel>
            <TextField
              value={localSettings.title}
              onChange={(e) => handleSettingChange('title', e.target.value)}
              placeholder="Enter title"
              fullWidth
              margin="dense"
              size="small"
            />
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            This component displays human-in-the-loop notification requests that require feedback.
            It will show notifications when an agent run is selected via the "agentRunSelected" event.
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Dashboard view
  return (
    <Box 
      sx={{ 
        height: fullHeight ? '100%' : 'auto', 
        display: 'flex', 
        flexDirection: 'column' 
      }}
      className="human-feedback-tile"
    >
      {/* Using the common TileHeader component */}
      <TileHeader 
        title={localSettings.title || 'Human Feedback Requests'}
        icon={<NotificationsIcon />}
        showInfo={true}
        infoText="View and respond to human-in-the-loop feedback requests"
      />

      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
        className="feedback-content"
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : selectedRunId ? (
          notifications.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Created At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>{formatDate(notification.created_at)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={notification.status} 
                          color="warning" 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{notification.email_settings?.subject || 'No Subject'}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          startIcon={<ReplyIcon />}
                          onClick={() => handleOpenFeedbackModal(notification)}
                          sx={{ 
                            bgcolor: 'gold', 
                            '&:hover': { bgcolor: '#d4af37' } 
                          }}
                          size="small"
                        >
                          Reply
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" sx={{ m: 2 }}>
              No pending human feedback requests for this run.
            </Alert>
          )
        ) : (
          <Alert severity="info" sx={{ m: 2 }}>
            Select an agent run first to view feedback requests.
          </Alert>
        )}
      </Box>

      {/* Feedback Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>Give Feedback</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Subject: {selectedItem?.email_settings?.subject || 'No Subject'}
          </Typography>
          <TextField
            autoFocus
            label="Reason"
            fullWidth
            multiline
            rows={5}
            value={feedbackReason}
            onChange={(e) => setFeedbackReason(e.target.value)}
            margin="dense"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={handleCloseModal} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              onClick={() => handleSubmitFeedback('rejected')}
              variant="contained"
              color="error"
              disabled={!feedbackReason.trim()}
            >
              Reject
            </Button>
            <Button 
              onClick={() => handleSubmitFeedback('approved')}
              variant="contained"
              color="success"
              disabled={!feedbackReason.trim()}
            >
              Approve
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TileHumanInTheLoopNotifications;