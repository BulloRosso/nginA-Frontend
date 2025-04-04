// components/AgentsFooter.tsx
import React from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Typography, 
  Container,
  Paper,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WidgetsIcon from '@mui/icons-material/Widgets';
import BuildIcon from '@mui/icons-material/Build';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import CableIcon from '@mui/icons-material/Cable';

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
  onMCPToolsClick: () => void;
}

const AgentsFooter: React.FC<AgentsFooterProps> = ({
  onDiscoverClick,
  onWrapperClick,
  onBuildClick,
  onMCPToolsClick
}) => {
  const { t } = useTranslation(['agents']);
  const [expanded, setExpanded] = React.useState<boolean>(false);

  const handleAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  return (
    <Box 
      component="footer" 
      sx={{ 
        mt: 4,
        paddingLeft: 2,
        paddingRight: 4,
      }}
    >
        <Container 
          maxWidth={false} 
          disableGutters 
          sx={{ 
            width: '100%',
            px: 0 // Remove horizontal padding
          }}
        >
        <Accordion 
          expanded={expanded} 
          onChange={handleAccordionChange}
          sx={{ 
            backgroundColor: '#f7f0dd',
            width: '100%',
            '&:before': {
              display: 'none', // Removes the default divider
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="agents-footer-content"
            id="agents-footer-header"
            sx={{ 

            }}
          >
            <Typography variant="h6" fontWeight="medium">
              {t('agents.add_agents_panel')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ py: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
                <FooterAction
                  title={t('agents.footer.discover_title')}
                  description={t('agents.footer.discover_description')}
                  imageSrc="/img/basic-bot.png"
                  buttonLabel={t('agents.discover_new')}
                  icon={<AddIcon />}
                  onClick={onDiscoverClick}
                />
              </Grid>

              <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
                <FooterAction
                  title={t('agents.footer.wrapper_title')}
                  description={t('agents.footer.wrapper_description')}
                  imageSrc="/img/wrapper.png"
                  buttonLabel={t('agents.create_wrapper')}
                  icon={<WidgetsIcon />}
                  onClick={onWrapperClick}
                />
              </Grid>

              <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
                <FooterAction
                  title={t('agents.footer.build_title')}
                  description={t('agents.footer.build_description')}
                  imageSrc="/img/agent-profile.jpg"
                  buttonLabel={t('agents.build_new')}
                  icon={<BuildIcon />}
                  onClick={onBuildClick}
                />
              </Grid>

              <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
                <FooterAction
                  title={t('agents.footer.mcp_tools_title')}
                  description={t('agents.footer.mcp_tools_description')}
                  imageSrc="/img/mcp-logo.png"
                  buttonLabel={t('agents.connect_to_server')}
                  icon={<CableIcon />}
                  onClick={onMCPToolsClick}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Container>
    </Box>
  );
};

export default AgentsFooter;