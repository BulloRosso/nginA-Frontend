// src/pages/AgentBuilder.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Stepper,
  Step,
  StepLabel,
  createTheme,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import { Global, css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../types/profile';
import { ProfileService } from '../services/profiles';
import { useTranslation } from 'react-i18next';
import BuilderBot from '../components/BuilderBot';
import BuilderCanvas from '../components/agents/BuilderCanvas';
import useAgentStore from '../../stores/agentStore';
import { AgentService } from '../services/agents';

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

const AgentBuilder: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem('profileId')
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0); // State for tracking active step
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['profile', 'invitation', 'interview', 'common', 'agents']);

  // Access agent store to monitor chain and transformations
  const { 
    currentAgentChain, 
    currentAgentTransformations,
    addAgentToChain,
    updateAgentTransformation
  } = useAgentStore();

  // Define the steps for the stepper
  const steps = [
    'Required Components',
    'Parameter Transformations',
    'Human in the Loop'
  ];

  // Map i18n languages to date-fns locales
  const locales = {
    'de': 'de',
    'en': 'enUS',
    // Add more locales as needed
  };

  // Single effect for initialization
  useEffect(() => {
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

        // Use new method to fetch profiles for current user
        const userProfiles = await ProfileService.getProfilesForUser(user.id);
        setProfiles(userProfiles);

        // If there are profiles, select the first one by default
        if (userProfiles.length > 0) {
          const firstProfile = userProfiles[0];
          localStorage.setItem('profileId', firstProfile.id);
          localStorage.setItem('profiles', JSON.stringify(firstProfile));
          setSelectedProfileId(firstProfile.id);
          window.dispatchEvent(new CustomEvent('profileSelected'));
        }

      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError('Failed to load profiles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeProfileSelection();
  }, []);

  // Function to handle step navigation
  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

    // Add mock agents to the workflow
  const handleAddMockAgents = async () => {
    try {
      setLoading(true);
      // Fetch agents if not already available
      const mockAgents = await AgentService.getAgents();

      // Add a few agents to the chain
      mockAgents.slice(0, 3).forEach(agent => {
        addAgentToChain(agent);
      });

      const transformations = await AgentService.getAgentTransformations();

      // For each agent in the chain, add a transformation if one exists
      mockAgents.slice(0, 3).forEach(agent => {
        const existingTransformation = transformations.find(t => t.agent_id === agent.id);

        if (existingTransformation) {
          updateAgentTransformation(
            agent.id, 
            existingTransformation.post_process_transformations
          );
        }
      });
      
    } catch (error) {
      console.error('Error adding mock agents:', error);
      setError(t('agents.error_adding_mock_agents'));
    } finally {
      setLoading(false);
    }
  };

  // Determine whether the user can proceed to the next step
  const canProceedToTransformations = currentAgentChain.length > 0;
  const canProceedToHumanInLoop = currentAgentTransformations.length > 0;

  // Step content and navigation
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <BuilderCanvas activeStep={0} />
            {!canProceedToTransformations && (
              <Typography 
                sx={{ 
                  mt: 2, 
                  color: 'text.secondary', 
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
                onClick={handleAddMockAgents}
              >
                (Click to add mock agents)
              </Typography>
            )}
          </>
        );
      case 1:
        return (
          <>
            <BuilderCanvas activeStep={1} />
          </>
        );
      case 2:
        return (
          <Box sx={{ mt: 2, p: 3, minHeight: '503px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              {t('agents.human_in_loop_coming_soon')}
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ 
        mt: 4, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 2, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            {/* Step Indicator with Navigation */}
            <Box sx={{ width: '100%', mb: 2 }}>
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel
                sx={{ 
                  '& .MuiStepLabel-root': { 
                    padding: '0px 8px',
                  },
                  '& .MuiStepConnector-line': {
                    minHeight: '1px',
                    marginTop: '-8px'
                  },
                  '& .MuiStepLabel-label': {
                    fontSize: '0.85rem',
                    marginTop: '-2px'
                  },
                  '& .MuiSvgIcon-root': {
                    width: '1.5rem',
                    height: '1.5rem'
                  }
                }}
              >
                {steps.map((label, index) => {
                  // Determine if step is enabled based on prerequisites
                  const isStepDisabled = (index === 1 && !canProceedToTransformations) || 
                                        (index === 2 && !canProceedToHumanInLoop);

                  return (
                    <Step key={label}>
                      <StepLabel 
                        onClick={() => !isStepDisabled && handleStepChange(index)} 
                        sx={{ 
                          cursor: isStepDisabled ? 'not-allowed' : 'pointer',
                          opacity: isStepDisabled ? 0.5 : 1
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </Box>

            {/* Step Content */}
            {renderStepContent()}

          </Paper>
        </Box>

        {/* Feedback Messages */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSuccessMessage(null)}
            severity="success"
            variant="filled"
          >
            {successMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setError(null)}
            severity="error"
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>

        <BuilderBot />
      </Container>
)};

export default AgentBuilder;