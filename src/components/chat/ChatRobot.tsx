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
import { 
  Send as SendIcon, 
  Mic as MicIcon, 
} from '@mui/icons-material';

// Enhanced type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  error?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
  onerror: ((event: SpeechRecognitionEvent) => void) | null;
}

// Extend global window interface
declare global {
  interface Window {
    webkitSpeechRecognition: new () => ISpeechRecognition;
    SpeechRecognition: new () => ISpeechRecognition;
  }
}

import { ChatService } from '../../services/chat';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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

const hasInitialized = { current: false };

const ChatRobot: React.FC = () => {
  const { t, i18n } = useTranslation(['chat', 'common']);
  const [messages, setMessages] = useState<Message[]>([{
    text: t('chat.welcome_message'),
    isUser: false,
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!hasInitialized.current && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = i18n.language === 'de' ? 'de-DE' : 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          setTranscript(transcript);
          setInputMessage(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        // Automatically stop after 5 seconds of silence
        recognitionRef.current.onspeechend = () => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        };

        // Handle errors
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        hasInitialized.current = true;
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [i18n.language]); // Only reinitialize when language changes

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

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Update language before starting
      recognitionRef.current.lang = i18n.language === 'de' ? 'de-DE' : 'en-US';
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
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
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(marked(message.text))
                    }} 
                  />
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
          <IconButton
            onClick={toggleListening}
            disabled={isLoading}
            sx={{
              bgcolor: isListening ? 'red' : '#e0e0e0',
              color: 'white',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              transition: 'all 0.2s',
              animation: isListening ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)'
                },
                '70%': {
                  boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)'
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)'
                }
              },
              '&:hover': {
                bgcolor: isListening ? '#d32f2f' : '#bdbdbd'
              },
              '&.Mui-disabled': {
                bgcolor: '#cccccc'
              }
            }}
          >
            <MicIcon />
          </IconButton>
          <TextField
            fullWidth
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? t('chat.listening') : t('chat.type_message')}
            multiline
            maxRows={4}
            disabled={isLoading}
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: isListening ? 'rgba(255, 0, 0, 0.05)' : 'transparent',
                transition: 'background-color 0.3s ease'
              }
            }}
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