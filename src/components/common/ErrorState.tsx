// src/components/common/ErrorState.tsx
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  error: string | Error;
  fullScreen?: boolean;
  onRetry?: () => void;
  title?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  fullScreen = false,
  onRetry,
  title
}) => {
  const { t } = useTranslation();
  const errorMessage = error instanceof Error ? error.message : error;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center'
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 48 }} />

      <Alert 
        severity="error" 
        variant="outlined"
        sx={{ width: '100%' }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {errorMessage}
      </Alert>

      {onRetry && (
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          {t('common.try_again')}
        </Button>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: 'background.default'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            maxWidth: 500,
            width: '100%'
          }}
        >
          {content}
        </Paper>
      </Box>
    );
  }

  return content;
};