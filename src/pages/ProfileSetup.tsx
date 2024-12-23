// src/pages/ProfileSetup.tsx
import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Divider
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { SetupStep1 } from '../components/profile/SetupStep1';
import { SetupStep2 } from '../components/profile/SetupStep2';
import { SetupStep3 } from '../components/profile/SetupStep3';
import { ProfileData, ValidationErrors } from '../types/profile-setup';

const ProfileSetup = () => {
  const { t, i18n } = useTranslation(['profile','common']);
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
    backstory: '',
    narratorStyle: 'neutral',
    narratorPerspective: 'ego',
    narratorVerbosity: 'normal'
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const initializeProfileSelection = async () => {
    try {
      // Clear local storage at component mount
      localStorage.removeItem('profileId');
      localStorage.removeItem('profiles');
      window.dispatchEvent(new CustomEvent('profileSelected'));

      // Get current user ID from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('No user data found. Please log in again.');
        return;
      }

      const user = JSON.parse(userData);
      setCurrentUserId(user.id);

      // Fetch profiles
      const data = await ProfileService.getAllProfiles();

      // Filter profiles for current user
      const userProfiles = data.filter(profile => profile.user_id === user.id);
      setProfiles(userProfiles);

    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const steps = [
    t('profile.steps.basic_info'),
    t('profile.steps.characterization'),
    t('profile.steps.memory_style')
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
    // No validation for step 3 as it has defaults

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setErrors({});
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
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

      // Get current user from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
          throw new Error('No user data found');
      }
      const user = JSON.parse(userData);

      const profileData = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        date_of_birth: profile.dateOfBirth?.toISOString().split('T')[0],
        place_of_birth: profile.placeOfBirth,
        gender: profile.gender,
        children: profile.children,
        spoken_languages: profile.spokenLanguages,
        metadata: {
          backstory: profile.backstory,
          narrator_style: profile.narratorStyle,
          narrator_perspective: profile.narratorPerspective,
          narrator_verbosity: profile.narratorVerbosity
        },
        user_id: user.id
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

  const renderCurrentStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <SetupStep1 
            profile={profile} 
            setProfile={setProfile} 
            errors={errors}
            setErrors={setErrors}
          />
        );
      case 1:
        return (
          <SetupStep2 
            profile={profile} 
            setProfile={setProfile} 
            errors={errors}
            setErrors={setErrors}
          />
        );
      case 2:
        return (
          <SetupStep3 
            profile={profile} 
            setProfile={setProfile} 
            errors={errors}
            setErrors={setErrors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ p: 3 }}>
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} md={4} >
            <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f2f0e8' }}>
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
                  <img src="/public/noblivion-icon-1.png" alt="Noblivion" style={{ width:'120px', justifySelf:'center', marginBottom: '10px' }} />
                  {t('profile.help2')}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Main Content Column */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 4 }} gutterBottom>
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

              <form onSubmit={(e) => {
                e.preventDefault();
                if (activeStep === steps.length - 1) {
                  handleSubmit(e);
                }
              }}>
                {renderCurrentStep()}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                     type="button"
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
                      type="button"
                      variant="contained"
                      onClick={(e) => {
                        e.preventDefault();  // Prevent any form submission
                        handleNext();
                      }}
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

export default ProfileSetup;