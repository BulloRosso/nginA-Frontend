// components/AgentsFooter.tsx
import React from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Typography, 
  Container,
  Paper,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WidgetsIcon from '@mui/icons-material/Widgets';
import BuildIcon from '@mui/icons-material/Build';
import { useTranslation } from 'react-i18next';

interface FooterActionProps {
  title: string;
  description: string;
  imageSrc: string;
  buttonLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const FooterAction: React.FC<FooterActionProps> = ({
  title,
  description,
  imageSrc,
  buttonLabel,
  icon,
  onClick
}) => {
  const theme = useTheme();

  return (
    <Paper 
      elevation={3}
      sx={{ 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        borderRadius: 2
      }}
    >
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Image column */}
        <Grid item xs={12} sm={4}>
          <Box>
            <img 
              src={imageSrc} 
              alt={title} 
              style={{ 
                width: 200,
                height: 'auto',
                objectFit: 'contain'
              }} 
            />
          </Box>
        </Grid>

        {/* Content column */}
        <Grid item xs={12} sm={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: theme.palette.primary.main
            }}
          >
            {title}
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              color: theme.palette.text.secondary
            }}
          >
            {description}
          </Typography>
        </Grid>
      </Grid>

      {/* Button container - separate from the grid to ensure it's at the bottom */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          mt: 'auto',
          pt: 3 
        }}
      >
        <Button
          variant="contained"
          startIcon={icon}
          onClick={onClick}
          sx={{ 
            backgroundColor: 'gold', 
            color: 'black',
            '&:hover': {
              backgroundColor: '#e6c200',
            }
          }}
        >
          {buttonLabel}
        </Button>
      </Box>
    </Paper>
  );
};

interface AgentsFooterProps {
  onDiscoverClick: () => void;
  onWrapperClick: () => void;
  onBuildClick: () => void;
}

const AgentsFooter: React.FC<AgentsFooterProps> = ({
  onDiscoverClick,
  onWrapperClick,
  onBuildClick
}) => {
  const { t } = useTranslation(['agents']);

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 5, 
        backgroundColor: '#f7f0dd',
        mt: 6
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
            <FooterAction
              title={t('agents.footer.discover_title')}
              description={t('agents.footer.discover_description')}
              imageSrc="/img/basic-bot.png"
              buttonLabel={t('agents.discover_new')}
              icon={<AddIcon />}
              onClick={onDiscoverClick}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
            <FooterAction
              title={t('agents.footer.wrapper_title')}
              description={t('agents.footer.wrapper_description')}
              imageSrc="/img/wrapper.png"
              buttonLabel={t('agents.create_wrapper')}
              icon={<WidgetsIcon />}
              onClick={onWrapperClick}
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
            <FooterAction
              title={t('agents.footer.build_title')}
              description={t('agents.footer.build_description')}
              imageSrc="/img/agent-profile.jpg"
              buttonLabel={t('agents.build_new')}
              icon={<BuildIcon />}
              onClick={onBuildClick}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AgentsFooter;