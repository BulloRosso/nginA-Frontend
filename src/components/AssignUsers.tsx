// src/components/AssignUsers.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  TextField,
  Button,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  ListItemAvatar,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  AccountCircleOutlined as AccountCircleOutlinedIcon
} from '@mui/icons-material';
import { UserService } from '../services/users';
import { User } from '../types/user';

interface AssignUsersProps {
  /**
   * Array of user IDs that are currently assigned
   */
  assignedUserIds: string[];

  /**
   * Callback fired when users are added or removed
   * @param userIds The updated list of user IDs
   */
  onUsersChanged?: (userIds: string[]) => void;

  /**
   * Title to display above the component
   */
  title?: string;

  /**
   * Whether the component should allow editing (adding/removing users)
   */
  readOnly?: boolean;
}

/**
 * Component for displaying and managing assigned users
 */
const AssignUsers: React.FC<AssignUsersProps> = ({
  assignedUserIds = [],
  onUsersChanged,
  title = 'Assigned Users',
  readOnly = false
}) => {
  // State for assigned users
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for the user selection
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // UI states
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  // Load assigned users on component mount or when assignedUserIds changes
  useEffect(() => {
    const fetchAssignedUsers = async () => {
      setLoading(true);
      try {
        const userMap = await UserService.getUsersByIds(assignedUserIds);
        // Convert map to array and sort by email
        const users = Array.from(userMap.values())
          .sort((a, b) => a.email.localeCompare(b.email));

        setAssignedUsers(users);
        setError(null);
      } catch (err) {
        console.error('Error loading assigned users:', err);
        setError('Failed to load assigned users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedUsers();
  }, [assignedUserIds]);

  // Load all available users for the dropdown
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const users = await UserService.getUsers();
        // Filter out already assigned users
        const availableUsersList = users.filter(
          user => !assignedUserIds.includes(user.id)
        ).sort((a, b) => a.email.localeCompare(b.email));

        setAvailableUsers(availableUsersList);
      } catch (err) {
        console.error('Error loading available users:', err);
      }
    };

    if (!readOnly) {
      fetchAvailableUsers();
    }
  }, [assignedUserIds, readOnly]);

  // Handle adding a user
  const handleAddUser = () => {
    if (!selectedUser) return;

    // Create new array with the selected user added
    const newUserIds = [...assignedUserIds, selectedUser.id];

    // Update state and call callback
    setAssignedUsers([...assignedUsers, selectedUser]);
    setSelectedUser(null);

    // Remove the selected user from available users
    setAvailableUsers(availableUsers.filter(user => user.id !== selectedUser.id));

    // Notify parent component
    if (onUsersChanged) {
      onUsersChanged(newUserIds);
    }
  };

  // Handle user removal confirmation dialog
  const handleRemoveClick = (user: User) => {
    setUserToRemove(user);
    setOpenDialog(true);
  };

  // Cancel user removal
  const handleCancelRemove = () => {
    setOpenDialog(false);
    setUserToRemove(null);
  };

  // Confirm user removal
  const handleConfirmRemove = () => {
    if (!userToRemove) return;

    // Create new array without the removed user
    const newUserIds = assignedUserIds.filter(id => id !== userToRemove.id);

    // Update state
    setAssignedUsers(assignedUsers.filter(user => user.id !== userToRemove.id));

    // Add the removed user back to available users
    setAvailableUsers([...availableUsers, userToRemove].sort((a, b) => 
      a.email.localeCompare(b.email)
    ));

    // Notify parent component
    if (onUsersChanged) {
      onUsersChanged(newUserIds);
    }

    // Close dialog
    setOpenDialog(false);
    setUserToRemove(null);
  };

  return (
    <Box sx={{ mb: 0 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <>
          {/* User List */}
          <Paper variant="outlined" sx={{ mb: 3 }}>
            {assignedUsers.length === 0 ? (
              <Box p={2} textAlign="center">
                <Typography color="text.secondary">
                  No users assigned yet.
                </Typography>
              </Box>
            ) : (
              <List>
                {assignedUsers.map((user) => (
                  <ListItem key={user.id} divider>
                    <Tooltip title={`User ID: ${user.id}`} arrow>
                      <ListItemAvatar>
                        <AccountCircleOutlinedIcon color="primary" />
                      </ListItemAvatar>
                    </Tooltip>
                    <ListItemText
                      primary={user.email}
                      secondary={
                        <>
                          {user.user_metadata?.first_name && user.user_metadata?.last_name && (
                            <Box component="span">
                              {user.user_metadata.first_name} {user.user_metadata.last_name}
                            </Box>
                          )}
                          {user.email_confirmed_at ? (
                            <Chip 
                              label="Verified" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          ) : (
                            <Chip 
                              label="Unverified" 
                              size="small" 
                              color="warning" 
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </>
                      }
                    />
                    {!readOnly && (
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="remove" 
                          color="error"
                          onClick={() => handleRemoveClick(user)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>

          {/* Add User Form */}
          {!readOnly && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Autocomplete
                sx={{ flexGrow: 1 }}
                options={availableUsers}
                getOptionLabel={(option) => option.email}
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select User"
                    variant="outlined"
                    fullWidth
                    placeholder="Search by email"
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography>{option.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.user_metadata?.first_name} {option.user_metadata?.last_name}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={availableUsers.length === 0}
              />
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleAddUser}
                disabled={!selectedUser}
                size="small"
              >
                Add
              </Button>
            </Box>
          )}

          {/* Removal Confirmation Dialog */}
          <Dialog
            open={openDialog}
            onClose={handleCancelRemove}
          >
            <DialogTitle>Confirm User Removal</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to remove user <strong>{userToRemove?.email}</strong>?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelRemove}>Cancel</Button>
              <Button onClick={handleConfirmRemove} color="error" autoFocus>
                Remove
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default AssignUsers;