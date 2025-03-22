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
  CssBaseline,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // Import Add icon
import { Global, css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BuilderBot from '../components/BuilderBot';
import BuilderCanvas from '../components/agents/BuilderCanvas';
import useAgentStore from '../../stores/agentStore';
import { AgentService } from '../services/agents';
import AgentSelectionModal from '../components/agents/AgentSelectionModal'; // Import the new component
import ChainEditorDemo from '../components/ChainEditorDemo'; // Import ChainEditorDemo component

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

type BuildMode = 'chain' | 'dynamic';

const AgentBuilder: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  // Add state for mode toggle
  const [buildMode, setBuildMode] = useState<BuildMode>('chain');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAgentSelectionOpen, setIsAgentSelectionOpen] = useState(false); // New state for modal
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0); // State for tracking active step
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['agents', 'common']);

  // Access agent store to monitor chain and transformations
  const { 
    currentAgentChain, 
    currentAgentTransformations,
    addAgentToChain,
    updateAgentTransformation
  } = useAgentStore();

  // Define the steps for the stepper
  const steps = [
    'Required Agents',
    'JSON Post-Processing',
    'Human in the Loop'
  ];

  // Map i18n languages to date-fns locales
  const locales = {
    'de': 'de',
    'en': 'enUS',
    // Add more locales as needed
  };

  // Function to handle mode change
  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: BuildMode | null,
  ) => {
    if (newMode !== null) {
      setBuildMode(newMode);
    }
  };

  // Function to handle step navigation
  const handleStepChange = (step: number) => {
    // If moving to step 1 (transformations) and we have agents but no transformations
    if (step === 1 && currentAgentChain.length > 0 && currentAgentTransformations.length === 0) {
      // Initialize transformations for each agent in the chain (except the first one)
      // First agent doesn't need transformation as it's the start of the chain
      currentAgentChain.slice(1).forEach(agent => {
        updateAgentTransformation(
          agent.agent_id,
          // Default transformation template
          `/**
   * Transform function to convert previous agent output to this agent input
   * @param {object} input - The input data from the previous agent
   * @returns {object} - The transformed data for this agent
   */
  function transform_input(input) {
    // Add your transformation logic here
    return input;
  }`
        );
      });
    }

    setActiveStep(step);
  };

  // Handler for opening agent selection modal
  const handleOpenAgentSelection = () => {
    setIsAgentSelectionOpen(true);
  };

  // Handler for closing agent selection modal
  const handleCloseAgentSelection = () => {
    setIsAgentSelectionOpen(false);
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
        <Box sx={{ mt: 2, mb: 0 }}>
          {/* Toggle button group for build mode */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 0
          }}>
            <ToggleButtonGroup
              color="primary"
              value={buildMode}
              exclusive
              onChange={handleModeChange}
              aria-label="build mode"
              sx={{
                mb: 2,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 1,
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    fontWeight: 'bold',
                  },
                },
              }}
            >
              <ToggleButton value="chain" aria-label="chain mode">
                Chain (manual)
              </ToggleButton>
              <ToggleButton value="dynamic" aria-label="dynamic mode">
                Dynamic (guided)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Conditional rendering based on selected mode */}
          {buildMode === 'chain' ? (
            <ChainEditorDemo />
          ) : (
            <>
            <Paper elevation={3} sx={{ p: 1, position: 'relative' }}>
              {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}

              {/* Add Agents Button - Positioned absolute before stepper */}
              <Button
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAgentSelection}
                sx={{
                  position: 'absolute !important',
                  top: '40px',
                  left: '16px',
                  zIndex: 1,
                }}
              >
                {t('agents.add_agents')}
              </Button>

              {/* Step Indicator with Navigation */}
              <Box sx={{ width: '100%', mb: 2, mt: 5 }}> {/* Added margin top to account for the button */}
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
            <BuilderBot />
            </>
          )}
        </Box>

        {/* Agent Selection Modal */}
        <AgentSelectionModal
          open={isAgentSelectionOpen}
          onClose={handleCloseAgentSelection}
          onSuccess={setSuccessMessage}
        />

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

       
      </Container>
)};

export default AgentBuilder;