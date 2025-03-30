// src/components/agents/MCPToolsImportModal.tsx
import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Button,
  Modal,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface MCPToolsImportModalProps {
  open: boolean;
  onClose: () => void;
  onToolsReceived: (tools: any[]) => void;
}

const MCPToolsImportModal: React.FC<MCPToolsImportModalProps> = ({ 
  open, 
  onClose, 
  onToolsReceived 
}) => {
  const { t } = useTranslation(['agents', 'common']);
  const [serverUrl, setServerUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!serverUrl) {
      setError(t('common.field_required'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/mcp/sse/tools/', {
        mcp_server_url: serverUrl
      });

      onToolsReceived(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect to MCP server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={!isLoading ? onClose : undefined}
      aria-labelledby="mcp-tools-import-modal"
    >
      <Paper sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        maxWidth: '90vw',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 1,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Typography variant="h6" component="h2">
            {t('agents.connect_to_mcp_server')}
          </Typography>
          <IconButton onClick={onClose} aria-label="close" disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" gutterBottom>
          {t('agents.enter_mcp_server_url')}
        </Typography>
        <TextField
          fullWidth
          label={t('agents.server_url')}
          variant="outlined"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          error={!!error}
          disabled={isLoading}
          sx={{ mt: 2, mb: 3 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {t('agents.connect')}
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default MCPToolsImportModal;