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
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(prev => ({
            ...prev,
            ...data,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          }));
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, []);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validateProfile()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profileImage', profile.profileImage);
      formData.append('profile', JSON.stringify({
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth.toISOString(),
        placeOfBirth: profile.placeOfBirth,
        gender: profile.gender,
        children: profile.children,
        spokenLanguages: profile.spokenLanguages,
      }));

      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      // Navigate to interview page
      navigate('/interview');
    } catch (error) {
      setSubmitError('Failed to save profile. Please try again.');
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