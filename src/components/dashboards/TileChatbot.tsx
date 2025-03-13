// src/components/dashboards/TileChatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Stack,
  Paper,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { 
  Send as SendIcon,
  Chat as ChatIcon 
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import api from '../../services/api';
import { v4 as uuidv4 } from 'uuid';
import eventBus from './DashboardEventBus';
import TileHeader from './TileHeader';
import ComponentDebugInfo from './ComponentDebugInfo';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotSettings {
  agentId?: string;
  title?: string;
  sessionId?: string;
  welcomeMessage?: string; // Added welcomeMessage setting
}

interface TileChatbotProps {
  settings?: ChatbotSettings;
  renderMode?: 'dashboard' | 'settings';
  fullHeight?: boolean;
}

const TileChatbot: React.FC<TileChatbotProps> = ({ 
  settings = {}, 
  renderMode = 'dashboard',
  fullHeight = false 
}) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [availableAgents, setAvailableAgents] = useState<Array<{id: string, name: string}>>([]);
  const [agentEndpoint, setAgentEndpoint] = useState<string | null>(null);

  // Local settings with defaults
  const [localSettings, setLocalSettings] = useState<ChatbotSettings>({
    agentId: settings?.agentId || '',
    title: settings?.title || 'Chat Support',
    sessionId: settings?.sessionId || uuidv4(),
    welcomeMessage: settings?.welcomeMessage || 'Welcome! How can I assist you today?' // Default welcome message
  });

  // Debug logging
  useEffect(() => {
    console.log('[TileChatbot] Settings received:', settings);
    console.log('[TileChatbot] AgentId:', localSettings.agentId);
  }, [settings]);

  // Fetch available agents for the settings form
  useEffect(() => {
    if (renderMode === 'settings') {
      const fetchAgents = async () => {
        try {
          // In a real implementation, you would fetch from your API
          const response = await api.get('/api/v1/agents');
          setAvailableAgents(response.data.map((agent: any) => ({
            id: agent.id,
            name: agent.title.en || agent.id
          })));
        } catch (error) {
          console.error('Error fetching agents:', error);
          // Mock data for demo
          setAvailableAgents([
            { id: 'agent-1', name: 'Support Agent' },
            { id: 'agent-2', name: 'Sales Agent' },
            { id: 'agent-3', name: 'Technical Support' }
          ]);
        }
      };

      fetchAgents();
    }
  }, [renderMode]);

  // Fetch agent endpoint when agentId changes
  useEffect(() => {
    if (localSettings.agentId && renderMode === 'dashboard') {
      const fetchAgentEndpoint = async () => {
        try {
          // In a real implementation, you would fetch from your supabase
          const response = await api.get(`/api/v1/agents/${localSettings.agentId}`);
          setAgentEndpoint(response.data.agent_endpoint);
        } catch (error) {
          console.error('Error fetching agent endpoint:', error);
          // Mock endpoint for demo
          setAgentEndpoint('/api/v1/dashboardbot');
        }
      };

      fetchAgentEndpoint();

      // Add initial welcome message - use custom welcome message if provided
      setMessages([{
        text: localSettings.welcomeMessage || `Welcome to ${localSettings.title}! How can I assist you today?`,
        isUser: false,
        timestamp: new Date()
      }]);
    }
  }, [localSettings.agentId, localSettings.title, localSettings.welcomeMessage, renderMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSettingChange = (field: keyof ChatbotSettings, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendMessage = async (text: string) => {
    if (!agentEndpoint) {
      return "I'm sorry, I can't connect to the agent right now. Please try again later.";
    }

    try {
      const response = await api.post(agentEndpoint, {
        sessionId: localSettings.sessionId,
        action: "sendMessage",
        chatInput: text
      });

      console.log("Agent response:", response.data);

      // Check if response is an array (like your specific case)
      if (Array.isArray(response.data) && response.data.length > 0) {
        const firstItem = response.data[0];

        // Try to get output field from the first item
        if (firstItem && typeof firstItem === 'object' && firstItem.output) {
          return firstItem.output;
        }
      }

      // Check if the response has the 'answer' property (original FastAPI format)
      if (response.data && response.data.answer !== undefined) {
        return response.data.answer;
      }

      // For debugging: if we don't find the expected structure, log it
      console.warn("Unexpected response format:", response.data);

      // Try to extract any likely response text
      if (typeof response.data === 'string') {
        return response.data;
      } else if (typeof response.data === 'object') {
        // Check for common response fields
        const possibleAnswer = response.data.output || 
                               response.data.response || 
                               response.data.message ||
                               response.data.text ||
                               response.data.content;

        if (possibleAnswer) {
          return possibleAnswer;
        }
      }

      // Only return fallback if we absolutely cannot find a response
      return "I'm sorry, I couldn't process the response properly. Please try again.";
    } catch (error) {
      console.error('Error sending message:', error);
      return "Sorry, there was an error processing your request. Please try again later.";
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const botResponse = await sendMessage(inputMessage);

      setMessages(prev => [...prev, {
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error in chat flow:', error);
      setMessages(prev => [...prev, {
        text: "Sorry, something went wrong. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Settings view
  if (renderMode === 'settings') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Chatbot Settings</Typography>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <FormLabel>Title</FormLabel>
            <TextField
              value={localSettings.title}
              onChange={(e) => handleSettingChange('title', e.target.value)}
              placeholder="Enter chatbot title"
              fullWidth
              margin="dense"
              size="small"
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="agent-select-label">Agent</InputLabel>
            <Select
              labelId="agent-select-label"
              value={localSettings.agentId}
              onChange={(e) => handleSettingChange('agentId', e.target.value)}
              label="Agent"
              size="small"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {availableAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Added welcome message setting */}
          <FormControl fullWidth>
            <FormLabel>Welcome Message</FormLabel>
            <TextField
              value={localSettings.welcomeMessage}
              onChange={(e) => handleSettingChange('welcomeMessage', e.target.value)}
              placeholder="Enter welcome message"
              fullWidth
              multiline
              rows={2}
              margin="dense"
              size="small"
              helperText="Custom welcome message shown at the start of the conversation"
            />
          </FormControl>
        </Stack>
      </Box>
    );
  }

  // Dashboard view
  return (
    <Box 
      sx={{ 
        height: fullHeight ? '100%' : 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
      className="chatbot-tile"
    >
      {/* Debug info component - only shows in development */}
      <ComponentDebugInfo 
        componentId={settings?.id || 'unknown'}
        componentName="TileChatbot"
        settings={settings}
      />

      {/* Using the common TileHeader component with no background and hidden icon */}
      <TileHeader 
        title={localSettings.title || 'Chat Support'}
        icon={<ChatIcon sx={{ mr: 1 }} />}
        showInfo={false}
        hideIcon={true} // Hide the icon
        bgcolor="transparent" // No background color
      />

      {/* Messages Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          marginTop: 0,
          backgroundColor: '#f5f5f5',
          minHeight: '100%', // Ensure there's at least some space for messages
        }}
        className="messages-container"
      >
        <Stack spacing={2}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  backgroundColor: message.isUser ? '#1eb3b7' : '#fff',
                  color: message.isUser ? '#fff' : 'inherit',
                }}
              >
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(marked.parse(message.text)) 
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    mt: 1,
                    opacity: 0.7
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      {/* Input Area - with sticky positioning */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          p: 2, 
          borderTop: '1px solid #eee',
          mt: 'auto', // Push to the bottom
          backgroundColor: '#fff' // Ensure background is opaque
        }}
        className="input-container"
      >
        <TextField
          fullWidth
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('Type your message...')}
          multiline
          maxRows={4}
          disabled={isLoading || !localSettings.agentId}
          size="small"
        />
        <IconButton 
          onClick={handleSend}
          disabled={isLoading || !inputMessage.trim() || !localSettings.agentId}
          sx={{ 
            bgcolor: 'gold',
            color: 'black',
            '&:hover': {
              bgcolor: '#ffd700'
            },
            '&.Mui-disabled': {
              bgcolor: '#cccccc',
              color: 'white'
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default TileChatbot;