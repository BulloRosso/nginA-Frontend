// src/components/dashboards/ComponentDebugInfo.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import { 
  BugReport as DebugIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface ComponentDebugInfoProps {
  componentId: string;
  componentName: string;
  settings: any;
}

/**
 * A debugging component that can be conditionally rendered to display component props
 * Useful when troubleshooting issues with prop passing
 */
const ComponentDebugInfo: React.FC<ComponentDebugInfoProps> = ({
  componentId,
  componentName,
  settings
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Only enable in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <Box 
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          zIndex: 1000
        }}
      >
        <IconButton 
          size="small" 
          onClick={handleOpen}
          sx={{
            bgcolor: 'rgba(200, 0, 0, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(200, 0, 0, 0.2)',
            }
          }}
        >
          <DebugIcon fontSize="small" />
        </IconButton>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Component Debug Info
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6">Component ID: {componentId}</Typography>
          <Typography variant="h6">Component Name: {componentName}</Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>Settings:</Typography>
          <Box 
            component="pre" 
            sx={{ 
              backgroundColor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              overflow: 'auto'
            }}
          >
            {JSON.stringify(settings, null, 2)}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComponentDebugInfo;