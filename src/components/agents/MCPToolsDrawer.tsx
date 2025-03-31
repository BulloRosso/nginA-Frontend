// src/components/agents/MCPToolsDrawer.tsx
import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { AgentService } from '../../services/agents';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPToolsDrawerProps {
  open: boolean;
  onClose: () => void;
  tools: MCPTool[];
  onImportSuccess: () => void;
}

const MCPToolsDrawer: React.FC<MCPToolsDrawerProps> = ({
  open,
  onClose,
  tools,
  onImportSuccess
}) => {
  const { t } = useTranslation(['agents', 'common']);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [totalToImport, setTotalToImport] = useState(0);

  const handleToggle = (toolName: string) => {
    const currentIndex = selectedTools.indexOf(toolName);
    const newSelected = [...selectedTools];

    if (currentIndex === -1) {
      newSelected.push(toolName);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    setSelectedTools(newSelected);
  };

  const handleImport = async () => {
    if (selectedTools.length === 0) {
      setError(t('agents.select_at_least_one_tool'));
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportedCount(0);
    setTotalToImport(selectedTools.length);

    try {
      // Get the API base URL from environment
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      // Import each selected tool
      for (let i = 0; i < selectedTools.length; i++) {
        const toolName = selectedTools[i];
        const tool = tools.find(t => t.name === toolName);

        if (tool) {
          // Prepare agent data
          const agentData = {
            title: {
              en: tool.name,
              de: tool.name
            },
            description: {
              en: tool.description,
              de: tool.description
            },
            type: 'atom',
            input: tool.inputSchema,
            output: {
              type: 'object',
              properties: {
                result: {
                  type: 'string',
                  description: 'The result of the tool execution'
                }
              }
            },
            wrapped_url: `${apiBaseUrl}/mcp/tool/call`,
            authentication: 'none',
            credits_per_run: 1,
            icon_svg: await getIconSvg(),
            configuration: {
              tool_name: tool.name
            }
          };

          // Create the agent
          await AgentService.createAgent(agentData);
          setImportedCount(prev => prev + 1);
        }
      }

      // All tools imported successfully
      onImportSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to import tools');
    } finally {
      setIsImporting(false);
    }
  };

  // Function to get the SVG icon content
  const getIconSvg = async (): Promise<string> => {
    try {
      const response = await fetch('/img/mcp-logo.svg');
      const svgText = await response.text();
      return svgText;
    } catch (error) {
      console.error('Failed to load SVG icon:', error);
      // Return a simple default SVG if loading fails
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.33L19 9v6l-7 3.5L5 15V9l7-3.67z"/></svg>';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={!isImporting ? onClose : undefined}
      sx={{
        '& .MuiDrawer-paper': {
          width: '500px',
          maxWidth: '100%',
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" component="h2">
            {t('agents.import_tools')}
          </Typography>
          <IconButton onClick={onClose} disabled={isImporting}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isImporting && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('agents.importing_tools', { count: importedCount, total: totalToImport })}
          </Alert>
        )}

        <List sx={{ mb: 2 }}>
          {tools.sort((a, b) => a.name.localeCompare(b.name)).map((tool) => (
            <ListItem
              key={tool.name}
              dense
              button
              onClick={() => handleToggle(tool.name)}
              disabled={isImporting}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selectedTools.indexOf(tool.name) !== -1}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText
                primary={tool.name}
                secondary={tool.description.trim()}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'end', pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={isImporting || selectedTools.length === 0}
            startIcon={isImporting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              minWidth: '150px',
              backgroundColor: 'gold'
            }}
          >
            {isImporting ? t('agents.importing') : t('agents.import')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default MCPToolsDrawer;