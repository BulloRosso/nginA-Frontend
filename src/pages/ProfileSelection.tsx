// src/pages/ProfileSelection.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar,
  Button,
  Box,
  CircularProgress,
  Divider
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Profile, calculateAge } from '../types/profile';
import { formatDistance } from 'date-fns';
import { ProfileService } from '../services/profiles';

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

const ProfileSelection: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ProfileService.getAllProfiles();
        setProfiles(data);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError('Failed to load profiles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleProfileSelect = (profileId: string) => {
    localStorage.setItem('profileId', profileId);
    if (onSelect) {
      onSelect(profileId);
    }
    navigate('/interview');
  };

  const handleCreateNew = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Select a Profile
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleCreateNew}
            fullWidth
            sx={{ mb: 3 }}
          >
            Create New Profile
          </Button>

          <Divider sx={{ my: 2 }}>or continue with existing profile</Divider>

          <List sx={{ width: '100%' }}>
            {profiles.map((profile) => (
              <ListItem
                key={profile.id}
                button
                onClick={() => handleProfileSelect(profile.id)}
                sx={{
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={profile.profile_image_url}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      mr: 2,
                      bgcolor: 'primary.main' // Fallback color if image fails to load
                    }}
                  >
                    {!profile.profile_image_url && `${profile.first_name[0]}${profile.last_name[0]}`}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${profile.first_name} ${profile.last_name}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Age: {calculateAge(profile.date_of_birth)}
                      </Typography>
                      {profile.updated_at && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Last interview: {formatDistance(new Date(profile.updated_at), new Date(), { addSuffix: true })}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          {profiles.length === 0 && !error && (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>
              No profiles found. Create a new one to get started.
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfileSelection;