// src/components/common/LoadingState.tsx
import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Paper,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  size?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  fullScreen = false,
  overlay = false,
  size = 40
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        gap: 2,
        ...(overlay && {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: theme.zIndex.modal - 1,
        })
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
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
          bgcolor: 'background.default',
          zIndex: theme.zIndex.modal
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          {content}
        </Paper>
      </Box>
    );
  }

  return content;
};