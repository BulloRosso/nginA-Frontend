// src/components/chat/ChatRobot.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Stack
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { ChatService } from '../../services/chat';
import { useTranslation } from 'react-i18next';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Add styles for markdown content
const markdownStyles = `
  .markdown-content {
    font-family: inherit;
  }
  .markdown-content p {
    margin: 0 0 8px 0;
  }
  .markdown-content p:last-child {
    margin-bottom: 0;
  }
  .markdown-content pre {
    background-color: rgba(0, 0, 0, 0.04);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
  }
  .markdown-content code {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.04);
    padding: 2px 4px;
    border-radius: 4px;
  }
  .markdown-content ul, .markdown-content ol {
    margin: 8px 0;
    padding-left: 20px;
  }
`;

const ChatRobot: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load profile data from localStorage
    const profileData = localStorage.getItem('profiles');
    if (profileData) {
      setProfile(JSON.parse(profileData));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const newUserMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await ChatService.sendMessage(inputMessage);

      const newBotMessage = {
        text: response.answer,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error appropriately
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

  return (
    <>
      <style>{markdownStyles}</style>
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header with Avatar and Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={profile?.profile_image_url}
            alt={profile?.first_name}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Typography variant="h5">
            {t('chat.chat_with')} {profile?.first_name}
          </Typography>
        </Box>

        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          mb: 2,
          p: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}>
          <Stack spacing={2}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
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
                  {message.isUser ? (
                    <Typography variant="body1">{message.text}</Typography>
                  ) : (
                    <ReactMarkdown className="markdown-content">
                      {message.text}
                    </ReactMarkdown>
                  )}
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <CircularProgress size={20} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        {/* Input Area */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.type_message')}
            multiline
            maxRows={4}
            disabled={isLoading}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend}
            disabled={isLoading || !inputMessage.trim()}
            sx={{ 
              bgcolor: 'gold',
              color: 'black',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
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
      </Paper>
    </Container>
    </>
  );
};

export default ChatRobot;