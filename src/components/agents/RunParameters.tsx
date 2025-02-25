// src/components/agents/RunParameters.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { DirectionsRun as RunIcon } from '@mui/icons-material';
import { Agent } from '../../types/agent';
import SchemaForm from './tabs/InputFormForSchema';
import { useTranslation } from 'react-i18next';
import { OperationService } from '../../services/operations';

interface RunParametersProps {
  agent: Agent;
  open: boolean;
  onClose: () => void;
  onRunStarted?: () => void;
}

const RunParameters: React.FC<RunParametersProps> = ({
  agent,
  open,
  onClose,
  onRunStarted
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useTranslation(['agents', 'common']);

  useEffect(() => {
    // Reset state when dialog opens
    if (open) {
      setLoading(false);
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError(null);

    try {
      await OperationService.startRun(agent.id, formData);
      setSuccess(t('agents.run_started_success'));

      // Allow time for the success message to be seen
      setTimeout(() => {
        onClose();
        if (onRunStarted) onRunStarted();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('agents.run_start_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => !loading && onClose()}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('agents.start_run_for', { agent: agent.title.en })}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              {t('agents.provide_run_parameters')}
            </Typography>
          </Box>

          {agent.input_schema ? (
            <>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                Debug schema: {JSON.stringify(agent.input_schema, null, 2)}
              </Typography>
              <SchemaForm
                schema={agent.input_schema}
                onSubmit={handleSubmit}
                isLoading={loading}
              />
            </>
          ) : (
            <Box display="flex" justifyContent="center" p={4}>
              <Typography>
                {t('agents.no_parameters_required')}
              </Typography>
            </Box>
          )}
        </DialogContent>

        {!agent.input_schema && (
          <DialogActions>
            <Button 
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
              onClick={() => handleSubmit({})}
              disabled={loading}
              sx={{
                backgroundColor: 'gold',
                '&:hover': {
                  backgroundColor: '#DAA520',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(218, 165, 32, 0.5)',
                }
              }}
            >
              {t('agents.start_run')}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccess(null)}
          severity="success"
          variant="filled"
        >
          {success}
        </Alert>
      </Snackbar>

      {/* Error Message */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
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
    </>
  );
};

export default RunParameters;