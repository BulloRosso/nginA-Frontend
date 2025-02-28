// components/agents/AuthenticationDisplay.tsx
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface AuthenticationDisplayProps {
  authType: string;
  readOnly?: boolean;
}

export const AuthenticationDisplay: React.FC<AuthenticationDisplayProps> = ({ 
  authType, 
  readOnly = true 
}) => {
  const { t } = useTranslation(['agents']);

  // Parse auth type - could be "none", "bearer-token", "header:X-API-Key", or "basic-auth:user,pass"
  let selectedType = 'none';
  let headerName = '';
  let basicAuthUsername = '';
  let basicAuthPassword = '';

  if (authType.startsWith('header:')) {
    selectedType = 'header';
    headerName = authType.replace('header:', '');
  } else if (authType.startsWith('basic-auth:')) {
    selectedType = 'basic-auth';
    const credentials = authType.replace('basic-auth:', '').split(',');
    basicAuthUsername = credentials[0] || '';
    basicAuthPassword = credentials[1] || '';
  } else if (authType === 'bearer-token') {
    selectedType = 'bearer-token';
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <FormControl component="fieldset" disabled={readOnly} fullWidth>
        <FormLabel component="legend">
          <Typography variant="subtitle1" fontWeight="bold">
            {t('agents.authentication_type')}
          </Typography>
        </FormLabel>
        <RadioGroup value={selectedType} name="auth-type">
          <FormControlLabel 
            value="none" 
            control={<Radio />} 
            label={t('agents.auth_none')} 
          />
          <FormControlLabel 
            value="bearer-token" 
            control={<Radio />} 
            label={t('agents.auth_bearer')} 
          />
          <FormControlLabel 
            value="header" 
            control={<Radio />} 
            label={
              <Box>
                {t('agents.auth_header')}
                {selectedType === 'header' && headerName && (
                  <Typography variant="caption" color="primary.main" sx={{ ml: 1 }}>
                    ({headerName})
                  </Typography>
                )}
              </Box>
            } 
          />
          <FormControlLabel 
            value="basic-auth" 
            control={<Radio />} 
            label={
              <Box>
                {t('agents.auth_basic')}
                {selectedType === 'basic-auth' && basicAuthUsername && (
                  <Typography variant="caption" color="primary.main" sx={{ ml: 1 }}>
                    ({basicAuthUsername})
                  </Typography>
                )}
              </Box>
            } 
          />
        </RadioGroup>
      </FormControl>
    </Paper>
  );
};

export default AuthenticationDisplay;