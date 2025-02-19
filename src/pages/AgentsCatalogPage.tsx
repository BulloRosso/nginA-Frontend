// pages/AgentsCatalogPage.tsx
import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AgentsCatalog from '../components/AgentsCatalog';

const AgentsCatalogPage: React.FC = () => {
  const { t } = useTranslation(['agents']);

  return (
    <Container maxWidth="lg" sx={{
      
    }}>
      <Box sx={{ pt: 2, 
                pb: 4,
                mb:2,
                padding: 2,
                backgroundSize: 'cover',
                background: 'url(/img/agents-banner.jpg) no-repeat center '
               }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('agents.catalog')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('agents.catalog_description')}
        </Typography>
        
      </Box>
      <AgentsCatalog />
    </Container>
  );
};

export default AgentsCatalogPage;