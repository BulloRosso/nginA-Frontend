// src/components/agents/DiscoveryModal.tsx
import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Button,
  Modal,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Paper,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { AgentService } from '../../services/agents';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`discovery-tabpanel-${index}`}
      aria-labelledby={`discovery-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface DiscoveryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DiscoveryModal: React.FC<DiscoveryModalProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation(['agents']);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleDiscover = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await AgentService.discoverAgent(url);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to discover agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={!isLoading ? onClose : undefined}
      aria-labelledby="discover-agent-modal"
    >
      <Paper sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '550px',
        width: isMobile ? '90%' : '650px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        bgcolor: 'background.paper',
        boxShadow: 24,
        borderRadius: 1,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          px: 2,
          pt: 1
        }}>
          <Typography variant="h6" component="h2">
            {t('agents.agent_discovery')}
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            aria-label="discovery modal tabs"
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : undefined}
          >
            <Tab label={t('agents.endpoint')} id="discovery-tab-0" aria-controls="discovery-tabpanel-0" />
            <Tab label={t('agents.agent_description_record')} id="discovery-tab-1" aria-controls="discovery-tabpanel-1" />
            <Tab label={t('agents.conventions')} id="discovery-tab-2" aria-controls="discovery-tabpanel-2" />
          </Tabs>
        </Box>

        <TabPanel value={tabIndex} index={0}>

         
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              ml: 1,
              mr: 4,
              textAlign: 'right'
            }}>
              <img 
                src="/img/basic-bot.png" 
                alt="Basic Bot" 
                style={{ 
                  height: '220px',
                  objectFit: 'contain'
                }} 
              />
            </Box>
            
            <Box sx={{ 
              
              mr: 1
            }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {t('agents.agent_discovery_endpoint')}
              </Typography>

              <TextField
                fullWidth
                label={t('agents.discovery_url')}
                variant="outlined"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleDiscover}
                  disabled={!url || isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}
                >
                  {t('agents.discover_now')}
                </Button>
              </Box>
            </Box>

            
          </Box>
        </TabPanel>

        <TabPanel value={tabIndex} index={1}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2,
            overflow: 'hidden'
          }}>
            <img 
              src="/img/adr-attributes.jpg" 
              alt="Agent Description Record Attributes" 
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                objectFit: 'contain'
              }} 
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabIndex} index={2}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2,
            overflow: 'hidden'
          }}>
            <img 
              src="/img/adr-conventions.jpg" 
              alt="Agent Description Record Conventions" 
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                objectFit: 'contain'
              }} 
            />
          </Box>
        </TabPanel>
      </Paper>
    </Modal>
  );
};

export default DiscoveryModal;