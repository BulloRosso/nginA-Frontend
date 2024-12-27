// src/components/profile/SetupStep1.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button,
  TextField, 
  FormControl, 
  FormLabel, 
  RadioGroup,
  FormControlLabel, 
  Radio, 
  Typography, 
  Stack, 
  Chip,
  InputAdornment, 
  IconButton,
  Avatar
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

// Define the Profile type explicitly
interface Profile {
  firstName: string;
  lastName: string;
  dateOfBirth: Dayjs | null;
  placeOfBirth: string;
  gender: 'male' | 'female' | 'other' | '';
  children: string[];
  spokenLanguages: string[];
  profileImage?: File | null;
  imageUrl?: string;
}

// Define the SetupStepProps type
interface SetupStepProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  errors: Partial<Record<keyof Profile, string>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof Profile, string>>>>;
}

const Input = styled('input')({
  display: 'none',
});

const ProfileImage = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  margin: '0 auto',
  borderRadius: '50%',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.primary.main}`,
  '&:hover': {
    opacity: 0.8,
  },
}));

export const SetupStep1: React.FC<SetupStepProps> = ({ 
  profile, 
  setProfile, 
  errors,
  setErrors 
}) => {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const [newChild, setNewChild] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Add useEffect to add current UI language on component mount
  useEffect(() => {
    // Only add if no languages are set yet
    if (profile.spokenLanguages.length === 0) {
      // Get the language name based on the language code
      const currentLang = i18n.language === 'de' ? 'Deutsch' : 'English';

      setProfile(prev => ({
        ...prev,
        spokenLanguages: [currentLang]
      }));
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        setProfile(prev => ({
          ...prev,
          profileImage: file,
          imageUrl: imageUrl,
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

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4,  // Adjust spacing between profile image and inputs
          mb: 4 
        }}
      >
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input
            accept="image/*"
            id="profile-image-upload"
            type="file"
            onChange={handleImageChange}
            style={{ display: 'none' }}  // Use style instead of className
          />
          <label htmlFor="profile-image-upload">
            <Box sx={{ textAlign: 'center' }}>
              <ProfileImage
                src={profile.imageUrl}
                variant="rounded"
                sx={{ 
                  borderColor: '#777', 
                  backgroundColor: '#dfd9c6',
                  mb: 2,  // Add margin bottom
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.9,
                    boxShadow: theme => theme.shadows[4]  // Add hover effect
                  },
                  transition: 'all 0.2s'  // Smooth transition
                }}
              >
                {!profile.imageUrl && <AccountCircleIcon sx={{ width: 40, height: 40 }} />}
              </ProfileImage>

              {/* Add Material Button below the image */}
              <Button
                component="span"  // Important to make the button work with label
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                size="small"
              >
                {profile.imageUrl ? t('profile.change_photo') : t('profile.upload_photo')}
              </Button>
            </Box>
          </label>

          {errors.profileImage && (
            <Typography 
              color="error" 
              variant="caption" 
              sx={{ mt: 1 }}  // Add margin top
            >
              {errors.profileImage}
            </Typography>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label={t('profile.fields.first_name')}
              value={profile.firstName}
              onChange={(e) => {
                setProfile(prev => ({ ...prev, firstName: e.target.value }));
                if (e.target.value) { // Clear error when value is entered
                  setErrors(prev => ({ ...prev, firstName: undefined }));
                }
              }}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />

            <TextField
              fullWidth
              label={t('profile.fields.last_name')}
              value={profile.lastName}
              onChange={(e) => {
                setProfile(prev => ({ ...prev, lastName: e.target.value }));
                if (e.target.value) {
                  setErrors(prev => ({ ...prev, lastName: undefined }));
                }
              }}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </Stack>
        </Box>
      </Box>

      <Stack spacing={3}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DatePicker
            label={t('profile.fields.dob')}
            value={profile.dateOfBirth}
            onChange={(date) => {
              setProfile(prev => ({ ...prev, dateOfBirth: date }));
              if (date) {
                setErrors(prev => ({ ...prev, dateOfBirth: undefined }));
              }
            }}
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
            onChange={(e) => {
              setProfile(prev => ({ ...prev, placeOfBirth: e.target.value }));
              if (e.target.value) {
                setErrors(prev => ({ ...prev, placeOfBirth: undefined }));
              }
            }}
            error={!!errors.placeOfBirth}
            helperText={errors.placeOfBirth}
          />
        </Box>

        <FormControl error={!!errors.gender}>
          <FormLabel>{t('profile.fields.gender')}</FormLabel>
          <RadioGroup
            row
            value={profile.gender}
            onChange={(e) => {
              setProfile(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }));
              setErrors(prev => ({ ...prev, gender: undefined }));
            }}
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
};