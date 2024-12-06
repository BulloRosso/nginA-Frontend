import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio,
  Chip,
  Avatar,
  Alert,
  IconButton,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

const ProfileImage = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  margin: '0 auto',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.primary.main}`,
  '&:hover': {
    opacity: 0.8,
  },
}));

const ProfileSetup = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    placeOfBirth: '',
    gender: '',
    children: [],
    spokenLanguages: [],
    profileImage: null,
    imageUrl: null,
  });

  const [errors, setErrors] = useState({});
  const [newChild, setNewChild] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  // Load existing profile if available
  const loadProfile = async () => {
    try {
      const profileId = localStorage.getItem('profileId');
      if (!profileId) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profiles/${profileId}`);
      if (!response.ok) throw new Error('Profile not found');

      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        firstName: data.first_name,
        lastName: data.last_name,
        dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        placeOfBirth: data.place_of_birth,
        gender: data.gender,
        children: data.children || [],
        spokenLanguages: data.spoken_languages || [],
        imageUrl: data.profile_image_url
      }));
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setProfile(prev => ({
          ...prev,
          profileImage: file,
          imageUrl: URL.createObjectURL(file),
        }));
        setErrors(prev => ({ ...prev, profileImage: null }));
      } else {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Please upload an image file',
        }));
      }
    }
  };

  const handleAddChild = () => {
    if (newChild.trim()) {
      setProfile(prev => ({
        ...prev,
        children: [...prev.children, newChild.trim()],
      }));
      setNewChild('');
    }
  };

  const handleRemoveChild = (index) => {
    setProfile(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      setProfile(prev => ({
        ...prev,
        spokenLanguages: [...prev.spokenLanguages, newLanguage.trim()],
      }));
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (index) => {
    setProfile(prev => ({
      ...prev,
      spokenLanguages: prev.spokenLanguages.filter((_, i) => i !== index),
    }));
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profile.firstName) newErrors.firstName = 'First name is required';
    if (!profile.lastName) newErrors.lastName = 'Last name is required';
    if (!profile.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!profile.placeOfBirth) newErrors.placeOfBirth = 'Place of birth is required';
    if (!profile.gender) newErrors.gender = 'Gender is required';
    if (!profile.profileImage) newErrors.profileImage = 'Profile image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validateProfile()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (profile.profileImage) {
        formData.append('profile_image', profile.profileImage);
      }

      const profileData = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        date_of_birth: profile.dateOfBirth?.toISOString().split('T')[0],
        place_of_birth: profile.placeOfBirth,
        gender: profile.gender,
        children: profile.children,
        spoken_languages: profile.spokenLanguages
      };

      formData.append('profile', JSON.stringify(profileData));

      const response = await fetch('https://e5ede652-5081-48eb-9e93-64c13c6bbf50-00-2cmwk7hnytqn6.worf.replit.dev/api/v1/profiles', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save profile');
      }

      const data = await response.json();
      localStorage.setItem('profileId', data.id);
      navigate('/interview');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Person Profile
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 4 }}>
              <input
                accept="image/*"
                id="profile-image-upload"
                type="file"
                onChange={handleImageChange}
                className={Input}
              />
              <label htmlFor="profile-image-upload">
                <ProfileImage
                  src={profile.imageUrl}
                  variant="rounded"
                >
                  {!profile.imageUrl && <PhotoCameraIcon sx={{ width: 40, height: 40 }} />}
                </ProfileImage>
              </label>
              {errors.profileImage && (
                <Typography color="error" variant="caption" display="block" textAlign="center">
                  {errors.profileImage}
                </Typography>
              )}
            </Box>

            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Date of Birth"
                  value={profile.dateOfBirth}
                  onChange={(date) => setProfile(prev => ({ ...prev, dateOfBirth: date }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.dateOfBirth}
                      helperText={errors.dateOfBirth}
                    />
                  )}
                />
                <TextField
                  fullWidth
                  label="Place of Birth"
                  value={profile.placeOfBirth}
                  onChange={(e) => setProfile(prev => ({ ...prev, placeOfBirth: e.target.value }))}
                  error={!!errors.placeOfBirth}
                  helperText={errors.placeOfBirth}
                />
              </Box>

              <FormControl error={!!errors.gender}>
                <FormLabel>Gender</FormLabel>
                <RadioGroup
                  row
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                </RadioGroup>
                {errors.gender && (
                  <Typography color="error" variant="caption">
                    {errors.gender}
                  </Typography>
                )}
              </FormControl>

              <Box>
                <TextField
                  fullWidth
                  label="Add Child"
                  value={newChild}
                  onChange={(e) => setNewChild(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleAddChild} edge="end">
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.children.map((child, index) => (
                    <Chip
                      key={index}
                      label={child}
                      onDelete={() => handleRemoveChild(index)}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Add Spoken Language"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleAddLanguage} edge="end">
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.spokenLanguages.map((language, index) => (
                    <Chip
                      key={index}
                      label={language}
                      onDelete={() => handleRemoveLanguage(index)}
                    />
                  ))}
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                endIcon={<NextIcon />}
              >
                Continue to Interview
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ProfileSetup