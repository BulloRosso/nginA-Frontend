// src/components/profile/SetupStep4.tsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  Grid, 
  Typography, 
  Box,
  Chip,
  styled
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SetupStepProps } from '../../types/profile-setup';

const StyledCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  borderRadius: '8px', // Add this line
  transition: theme.transitions.create(['border', 'transform']),
  height: '100%',
  position: 'relative', 
  overflow: 'visible',  
  '&.MuiCard-root': {  
    backgroundColor: 'transparent', 
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const InterviewerImage = styled('img')(({ theme, disabled }) => ({
  width: theme.spacing(12),
  height: theme.spacing(12),
  objectFit: 'cover',
  borderRadius: theme.shape.borderRadius,
  filter: disabled ? 'grayscale(100%) brightness(110%) contrast(75%)' : 'none',
}));

interface InterviewerCardProps {
  name: string;
  skills: string[];
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}
const RibbonContainer = styled(Box)(({ theme }) => ({
  '--f': '10px',
  position: 'absolute',
  right: -40,
  top: 26,
  padding: '6px 30px',
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  textAlign: 'center',
  letterSpacing: '0.5px',
  borderBottom: 'var(--f) solid rgba(0,0,0,0.2)',
  transform: 'rotate(45deg)',
  transformOrigin: 'center',
  clipPath: `polygon(
    100% calc(100% - var(--f)),
    100% 100%,
    calc(100% - var(--f)) calc(100% - var(--f)),
    var(--f) calc(100% - var(--f)),
    0 100%,
    0 calc(100% - var(--f)),
    999px calc(100% - var(--f) - 999px),
    calc(100% - 999px) calc(100% - var(--f) - 999px)
  )`,
  minWidth: '140px',
  zIndex: 10000000,
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
  '.MuiCardContent-root:hover &': {
    opacity: 1
  }
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  '&:last-child': {
    paddingBottom: theme.spacing(3),
  },
  '&.MuiCardContent-root': {  // Add this for higher specificity
    backgroundColor: 'inherit', // Inherit from parent
  },
  backgroundColor: theme.palette.background.paper,
  position: 'relative',
  borderRadius: '8px',
  overflow: 'visible' // Change from 'hidden' to 'visible'
}));

const InterviewerCard: React.FC<InterviewerCardProps> = ({ 
  name, 
  skills, 
  selected, 
  disabled,
  onClick 
}) => (
  <StyledCard 
    onClick={disabled ? undefined : onClick}
    sx={{ 
      '&.MuiCard-root': {  // Add this for higher specificity
        backgroundColor: selected ? '#fafaf7' : 'background.paper',
      },
      borderLeft: selected ? (theme) => `4px solid ${theme.palette.warning.light}` : 'none',
      boxShadow: (theme) => `${theme.shadows[4]},  0 0 10px rgba(0,0,0,0.1)`,
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}
  >
    <StyledCardContent>
      {disabled && (
        <RibbonContainer>
          Business edition
        </RibbonContainer>
      )}
      <Box sx={{ 
        display: 'flex', 
        gap: 3
      }}>
        <InterviewerImage
          src={`/img/interviewers/avatar-${name.toLowerCase()}.jpg`}
          alt={name}
          sx={{ minWidth: '200px', minHeight: '200px' }}
          disabled={disabled}
        />
        <Box>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: theme => disabled ? theme.palette.text.secondary : theme.palette.text.primary,
            }}
          >
            {name}
          </Typography>
          <Box component="ul" sx={{ 
            listStyle: 'none', 
            p: 0, 
            m: 0,
            '& > li': { 
              mb: 1,
              color: 'text.secondary',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              '&::before': {
                content: '""',
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: theme => theme.palette.primary.main,
                marginRight: 1.5,
                opacity: disabled ? 0.5 : 0.8,
              }
            }
          }}>
            {skills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </Box>
        </Box>
      </Box>
    </StyledCardContent>
  </StyledCard>
);

export const SetupStep4: React.FC<SetupStepProps> = ({ profile, setProfile }) => {
  const { t } = useTranslation('profile');

  React.useEffect(() => {
    if (!profile.interviewer) {
      setProfile(prev => ({
        ...prev,
        interviewer: 'Nora'
      }));
    }
  }, []);
  
  const interviewers = [
    {
      name: 'Nora',
      skills: [
        t('profile.interviewer.skills.empathetic'),
        t('profile.interviewer.skills.feelings_focused'),
        t('profile.interviewer.skills.patient')
      ],
      disabled: false
    },
    {
      name: 'Nadia',
      skills: [
        t('profile.interviewer.skills.friendly'),
        t('profile.interviewer.skills.results_focused'),
        t('profile.interviewer.skills.motivating')
      ],
      disabled: true
    },
    {
      name: 'Nathan',
      skills: [
        t('profile.interviewer.skills.realistic'),
        t('profile.interviewer.skills.experience_focused'),
        t('profile.interviewer.skills.supporting')
      ],
      disabled: true
    },
    {
      name: 'Nolan',
      skills: [
        t('profile.interviewer.skills.optimistic'),
        t('profile.interviewer.skills.ideas_focused'),
        t('profile.interviewer.skills.creative')
      ],
      disabled: true
    }
  ];

  const handleInterviewerSelect = (name: string) => {
    setProfile(prev => ({
      ...prev,
      interviewer: name
    }));
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ mb: 4 }}
      >
        {t('profile.interviewer.description')}
      </Typography>

      <Grid container spacing={3}>
        {interviewers.map((interviewer) => (
          <Grid item xs={12} md={6} key={interviewer.name}>
            <InterviewerCard
              {...interviewer}
              selected={profile.interviewer === interviewer.name}
              onClick={() => handleInterviewerSelect(interviewer.name)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};