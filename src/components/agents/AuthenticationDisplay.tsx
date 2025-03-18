// components/agents/AuthenticationDisplay.tsx
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HttpIcon from '@mui/icons-material/Http';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';
import { useTranslation } from 'react-i18next';

interface AuthenticationDisplayProps {
  authType: string;
}

const AuthenticationDisplay: React.FC<AuthenticationDisplayProps> = ({ authType }) => {
  const { t } = useTranslation(['agents', 'common']);

  // Parse the authentication type and extract details
  let displayType = 'none';
  let details = '';

  if (authType.startsWith('header:')) {
    displayType = 'header';
    const headerParts = authType.substring('header:'.length).split(',');
    if (headerParts.length >= 1) {
      details = `${t('agents.header_name')}: ${headerParts[0]}`;
      if (headerParts.length >= 2) {
        details += `, ${t('agents.credentials.modal.key_name')}: ${headerParts[1]}`;
      }
    }
  } else if (authType.startsWith('bearer-token:')) {
    displayType = 'bearer-token';
    const keyName = authType.substring('bearer-token:'.length);
    details = `${t('agents.credentials.modal.key_name')}: ${keyName}`;
  } else if (authType.startsWith('basic-auth:')) {
    displayType = 'basic-auth';
    const keyName = authType.substring('basic-auth:'.length);
    details = `${t('agents.credentials.modal.key_name')}: ${keyName}`;
  } else {
    displayType = authType;
  }

  // Map of display types to labels and icons
  const typeConfig = {
    'none': {
      label: t('agents.auth_none'),
      icon: <CancelIcon />,
      color: 'default'
    },
    'bearer-token': {
      label: t('agents.auth_bearer'),
      icon: <VpnKeyIcon />,
      color: 'primary'
    },
    'header': {
      label: t('agents.auth_header'),
      icon: <HttpIcon />,
      color: 'info'
    },
    'basic-auth': {
      label: t('agents.auth_basic'),
      icon: <LockIcon />,
      color: 'success'
    }
  };

  const config = typeConfig[displayType as keyof typeof typeConfig] || typeConfig.none;

  return (
    <Box>
      <Chip 
        icon={config.icon}
        label={config.label}
        color={config.color as any}
        sx={{ mb: 1 }}
      />

      {details && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          {details}
        </Typography>
      )}
    </Box>
  );
};

export default AuthenticationDisplay;