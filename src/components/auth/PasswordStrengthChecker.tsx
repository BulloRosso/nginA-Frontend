import React from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';

const PasswordStrengthChecker = ({ password, onValidityChange }) => {
  const { t } = useTranslation(['common']);

  const requirements = [
    {
      test: (pwd) => /[A-Z]/.test(pwd),
      message: t('common.auth.password_requirements.uppercase')
    },
    {
      test: (pwd) => pwd.length >= 12,
      message: t('common.auth.password_requirements.length')
    },
    {
      test: (pwd) => /[0-9]/.test(pwd),
      message: t('common.auth.password_requirements.number')
    },
    {
      test: (pwd) => /[.*-]/.test(pwd),
      message: t('common.auth.password_requirements.special')
    }
  ];

  const unmetRequirements = requirements.filter(req => !req.test(password));
  const isValid = unmetRequirements.length === 0;

  React.useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  if (!password || isValid) return null;

  return (
    <Alert severity="warning" sx={{ mt: 0 }}>
      <AlertTitle>{t('common.auth.password_requirements.title')}</AlertTitle>
      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
        {unmetRequirements.map((req, index) => (
          <li key={index} style={{ fontSize: '0.875rem' }}>
            {req.message}
          </li>
        ))}
      </ul>
    </Alert>
  );
};

export default PasswordStrengthChecker;