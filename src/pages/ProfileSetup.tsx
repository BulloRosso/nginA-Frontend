// src/pages/PersonProfile.tsx
import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

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

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  placeOfBirth: string;
  gender: string;
  children: string[];
  spokenLanguages: string[];
  profileImage: File | null;
  imageUrl: string | null;
  backstory: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
  profileImage?: string;
  backstory?: string;
}

const PersonProfile = () => {
  const { t, i18n } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    placeOfBirth: '',
    gender: '',
    children: [],
    spokenLanguages: [],
    profileImage: null,
    imageUrl: null,
    backstory: ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [newChild, setNewChild] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const steps = [
    t('profile.steps.basic_info'),
    t('profile.steps.characterization')
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 0) {
      if (!profile.firstName) newErrors.firstName = t('profile.errors.required_first_name');
      if (!profile.lastName) newErrors.lastName = t('profile.errors.required_last_name');
      if (!profile.dateOfBirth) newErrors.dateOfBirth = t('profile.errors.required_dob');
      if (!profile.placeOfBirth) newErrors.placeOfBirth = t('profile.errors.required_pob');
      if (!profile.gender) newErrors.gender = t('profile.errors.required_gender');
      if (!profile.profileImage) newErrors.profileImage = t('profile.errors.required_image');
    } else if (step === 1) {
      if (!profile.backstory || profile.backstory.split('.').length < 3) {
        newErrors.backstory = t('profile.errors.required_backstory');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        setProfile(prev => ({
          ...prev,
          profileImage: file,
          imageUrl: URL.createObjectURL(file),
        }));
        setErrors(prev => ({ ...prev, profileImage: undefined }));
      } else {
        setErrors(prev => ({
          ...prev,
          profileImage: t('profile.errors.invalid_image'),
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

  const handleRemoveChild = (index: number) => {
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

  const handleRemoveLanguage = (index: number) => {
    setProfile(prev => ({
      ...prev,
      spokenLanguages: prev.spokenLanguages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateStep(activeStep)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      if (profile.profileImage) {
        formData.append('profile_image', profile.profileImage);
      }

      // Add the current UI language to the form data
      const currentLanguage = i18n.language || 'en';
      formData.append('language', currentLanguage);

      const profileData = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        date_of_birth: profile.dateOfBirth?.toISOString().split('T')[0],
        place_of_birth: profile.placeOfBirth,
        gender: profile.gender,
        children: profile.children,
        spoken_languages: profile.spokenLanguages,
        metadata: {
          backstory: profile.backstory
        }
      };

      formData.append('profile', JSON.stringify(profileData));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profiles`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || t('profile.errors.save_failed'));
      }

      const data = await response.json();
      localStorage.setItem('profileId', data.id);
      navigate('/introduction');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('profile.errors.save_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <>
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
            sx={{ borderColor: '#777', backgroundColor: '#dfd9c6' }}
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
            label={t('profile.fields.first_name')}
            value={profile.firstName}
            onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
            error={!!errors.firstName}
            helperText={errors.firstName}
          />
          <TextField
            fullWidth
            label={t('profile.fields.last_name')}
            value={profile.lastName}
            onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
            error={!!errors.lastName}
            helperText={errors.lastName}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <DatePicker
            label={t('profile.fields.dob')}
            value={profile.dateOfBirth}
            onChange={(date) => setProfile(prev => ({ ...prev, dateOfBirth: date }))}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.dateOfBirth,
                helperText: errors.dateOfBirth
              }
            }}
          />
          <TextField
            fullWidth
            label={t('profile.fields.pob')}
            value={profile.placeOfBirth}
            onChange={(e) => setProfile(prev => ({ ...prev, placeOfBirth: e.target.value }))}
            error={!!errors.placeOfBirth}
            helperText={errors.placeOfBirth}
          />
        </Box>

        <FormControl error={!!errors.gender}>
          <FormLabel>{t('profile.fields.gender')}</FormLabel>
          <RadioGroup
            row
            value={profile.gender}
            onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
          >
            <FormControlLabel value="female" control={<Radio />} label={t('profile.gender.female')} />
            <FormControlLabel value="male" control={<Radio />} label={t('profile.gender.male')} />
            <FormControlLabel value="other" control={<Radio />} label={t('profile.gender.other')} />
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
            label={t('profile.fields.add_child')}
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
            label={t('profile.fields.add_language')}
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
      </Stack>
    </>
  );

  const renderCharacterization = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        {t('profile.backstory.description')}
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={8}
        label={t('profile.backstory.label')}
        value={profile.backstory}
        onChange={(e) => setProfile(prev => ({ ...prev, backstory: e.target.value }))}
        placeholder={t('profile.backstory.placeholder')}
        error={!!errors.backstory}
        helperText={errors.backstory}
      />
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Grid container spacing={4}>
              {/* Left Column */}
              <Grid item xs={12} md={4} >
                <Paper elevation={3} sx={{ p: 4, backgroundColor: '#f2f0e8' }}>
                <Box 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      pb: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      mb: 2 
                    }}
                  >
                    {t('profile.helpcaption')}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ flex: 1 }}
                  >
                    {t('profile.help')}
                    <br/><br/>
                    {t('profile.help2')}
                  </Typography>
                </Box>
                </Paper>
              </Grid>

              {/* Main Content Column */}
              <Grid item xs={12} md={8}>
                <Paper elevation={3} sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    {t('profile.title')}
                  </Typography>

                  <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {submitError}
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit}>
                    {activeStep === 0 ? renderBasicInfo() : renderCharacterization()}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                      <Button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        startIcon={<ArrowBackIcon />}
                      >
                        {t('common.back')}
                      </Button>

                      {activeStep === steps.length - 1 ? (
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={isSubmitting}
                          endIcon={isSubmitting ? <CircularProgress size={24} /> : <NavigateNextIcon />}
                        >
                          {t('profile.continue_to_interview')}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          endIcon={<NavigateNextIcon />}
                        >
                          {t('common.next')}
                        </Button>
                      )}
                    </Box>
                  </form>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </LocalizationProvider>
      );
    };

export default PersonProfile;