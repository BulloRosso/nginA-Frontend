// src/components/SupportBot.tsx
import React, { useState, useRef, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import { BugReport, TopicButton } from './answer-modules/AnswerModules';
import { SupportBotService } from '../services/supportbot';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  modules?: JSX.Element[];
}

const SupportBot: React.FC = () => {
  const { t, i18n } = useTranslation('supportbot');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial message
    setMessages([{
      text: t('supportbot.initial_message'),
      isUser: false,
      timestamp: new Date(),
      modules: [
        <TopicButton key="getting-started" cmd="GETTING_STARTED" />,
        <TopicButton key="interview-process" cmd="INTERVIEW_PROCESS" />
      ]
    }]);
  }, [t]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const parseModules = (text: string): [string, JSX.Element[]] => {
    const modules: JSX.Element[] = [];
    let cleanText = text;

    // Parse BugReport tag
    if (text.includes('<BugReport/>')) {
      modules.push(<BugReport key={`bug-${Date.now()}`} />);
      cleanText = cleanText.replace('<BugReport/>', '');
    }

    // Parse TopicButton tags
    const topicButtonRegex = /<TopicButton\s+cmd="([^"]+)"(?:\s+title="([^"]+)")?\s*\/>/g;
    let match;
    while ((match = topicButtonRegex.exec(text)) !== null) {
      const [fullMatch, cmd, title] = match;
      console.log("Parsing buttons")
      modules.push(
        <TopicButton 
          key={`topic-${cmd}-${Date.now()}`} 
          cmd={cmd}
          title={t('supportbot.buttons.' + cmd)}
        />
      );
      cleanText = cleanText.replace(fullMatch, '');
    }

    return [cleanText.trim(), modules];
  };

  const sendMessage = async (text: string) => {
    try {
      const data = await SupportBotService.sendMessage(text, i18n.language);
      const [cleanText, modules] = parseModules(data.answer);

      return {
        text: cleanText,
        modules: modules
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        text: t('supportbot.error_message'),
        modules: []
      };
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

    const response = await sendMessage(inputMessage);

    setMessages(prev => [...prev, {
      text: response.text,
      isUser: false,
      timestamp: new Date(),
      modules: response.modules
    }]);

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
      <Paper elevation={3} sx={{ p: 3, height: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src="/img/supportbot.png"
            alt="SupportBot"
            sx={{ width: 48, height: 48, mr: 2 }}
          />
          <Typography variant="h6">
            SupportBot
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
                  <Typography variant="body1">{message.text}</Typography>
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
                {message.modules && (
                  <Box sx={{ mt: 1, width: '100%' }}>
                    {message.modules}
                  </Box>
                )}
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
                <CircularProgress size={14} />
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
            placeholder={t('supportbot.type_message')}
            multiline
            maxRows={4}
            disabled={isLoading}
          />
          <IconButton 
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
  );
};

export default SupportBot;