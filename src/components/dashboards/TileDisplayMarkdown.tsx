// src/components/dashboards/TileDisplayMarkdown.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField,
  FormControl,
  FormLabel,
  Stack
} from '@mui/material';
import {
  MarkdownIcon as MarkdownIcon,
  TextFields as TextIcon
} from '@mui/icons-material';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TileHeader from './TileHeader';

interface DisplayMarkdownSettings {
  markdown?: string;
  title?: string;
  cssUrl?: string;
}

interface TileDisplayMarkdownProps {
  settings?: DisplayMarkdownSettings;
  renderMode?: 'dashboard' | 'settings';
  onSettingsChange?: (settings: DisplayMarkdownSettings) => void;
  fullHeight?: boolean;
}

const TileDisplayMarkdown: React.FC<TileDisplayMarkdownProps> = ({ 
  settings = {}, 
  renderMode = 'dashboard',
  onSettingsChange,
  fullHeight = false
}) => {
  const [localSettings, setLocalSettings] = useState<DisplayMarkdownSettings>({
    markdown: settings.markdown || '# Hello World\n\nThis is a markdown component. Edit settings to customize.',
    title: settings.title || 'Markdown',
    cssUrl: settings.cssUrl || ''
  });

  const [htmlContent, setHtmlContent] = useState<string>('');

  // Load custom CSS if provided
  useEffect(() => {
    if (localSettings.cssUrl) {
      const linkId = 'markdown-custom-css';
      let linkElement = document.getElementById(linkId) as HTMLLinkElement;

      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.id = linkId;
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
      }

      linkElement.href = localSettings.cssUrl;

      return () => {
        document.head.removeChild(linkElement);
      };
    }
  }, [localSettings.cssUrl]);

  // Convert markdown to HTML
  useEffect(() => {
    if (localSettings.markdown) {
      const rawHtml = marked.parse(localSettings.markdown);
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);
      setHtmlContent(sanitizedHtml);
    }
  }, [localSettings.markdown]);

  // Handle settings change
  const handleSettingChange = (field: keyof DisplayMarkdownSettings, value: string) => {
    const updatedSettings = {
      ...localSettings,
      [field]: value
    };

    setLocalSettings(updatedSettings);

    // Notify parent component of settings changes if callback is provided
    if (onSettingsChange) {
      onSettingsChange(updatedSettings);
    }
  };

  // Settings form
  if (renderMode === 'settings') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Markdown Settings</Typography>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <FormLabel>Title</FormLabel>
            <TextField
              value={localSettings.title}
              onChange={(e) => handleSettingChange('title', e.target.value)}
              placeholder="Enter title"
              fullWidth
              margin="dense"
              size="small"
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>CSS URL (Optional)</FormLabel>
            <TextField
              value={localSettings.cssUrl}
              onChange={(e) => handleSettingChange('cssUrl', e.target.value)}
              placeholder="https://example.com/style.css"
              fullWidth
              margin="dense"
              size="small"
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel>Markdown Content</FormLabel>
            <TextField
              value={localSettings.markdown}
              onChange={(e) => handleSettingChange('markdown', e.target.value)}
              placeholder="# Markdown content here"
              fullWidth
              multiline
              rows={10}
              margin="dense"
              size="small"
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
        flexDirection: 'column' 
      }}
      className="markdown-tile"
    >
      {/* Using the common TileHeader component */}
      <TileHeader 
        title={localSettings.title || 'Markdown'}
        icon={<TextIcon sx={{ mr: 1 }} />}
        showInfo={false}
      />

      <Box
        className="markdown-content"
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          '& img': { maxWidth: '100%' },
          '& pre': { 
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto'
          },
          '& code': { 
            backgroundColor: '#f5f5f5',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            fontFamily: 'monospace'
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            marginBottom: '1rem'
          },
          '& th, & td': {
            border: '1px solid #ddd',
            padding: '8px'
          },
          '& th': {
            paddingTop: '12px',
            paddingBottom: '12px',
            textAlign: 'left',
            backgroundColor: '#f2f2f2'
          }
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </Box>
  );
};

export default TileDisplayMarkdown;