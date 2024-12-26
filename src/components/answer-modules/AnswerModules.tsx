// src/components/answer-modules/AnswerModules.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Paper
} from '@mui/material';
import { BugReport as BugIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { SupportBotService } from '../../services/supportbot';

interface BugReportFormData {
  severity: 'Feature Request' | 'Bug' | 'Severe Bug';
  subject: string;
  message: string;
  userEmail: string;
}

export const BugReport: React.FC = () => {
  const { t } = useTranslation('supportbot');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<BugReportFormData>(() => {
    // Get user email from localStorage
    const userData = localStorage.getItem('user');
    const userEmail = userData ? JSON.parse(userData).email : '';

    return {
      severity: 'Bug',
      subject: '',
      message: '',
      userEmail
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SupportBotService.submitBugReport(formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      // You might want to show an error message to the user here
    }
  };

  if (submitted) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>{t('supportbot.bug_report.thank_you')}</Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>{t('supportbot.bug_report.severity')}</InputLabel>
          <Select
            value={formData.severity}
            label={t('supportbot.bug_report.severity')}
            onChange={(e) => setFormData({
              ...formData,
              severity: e.target.value as BugReportFormData['severity']
            })}
          >
            <MenuItem value="Feature Request">{t('supportbot.bug_report.feature_request')}</MenuItem>
            <MenuItem value="Bug">{t('supportbot.bug_report.bug')}</MenuItem>
            <MenuItem value="Severe Bug">{t('supportbot.bug_report.severe_bug')}</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label={t('supportbot.bug_report.subject')}
          value={formData.subject}
          onChange={(e) => setFormData({
            ...formData,
            subject: e.target.value
          })}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          multiline
          rows={4}
          label={t('supportbot.bug_report.message')}
          value={formData.message}
          onChange={(e) => setFormData({
            ...formData,
            message: e.target.value
          })}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          startIcon={<BugIcon />}
          onClick={handleSubmit}
          disabled={!formData.subject || !formData.message}
          fullWidth
          sx={{
            color: 'white',
            '& .MuiSvgIcon-root': {
              color: 'white'
            }
          }}
        >
          {t('supportbot.bug_report.submit')}
        </Button>
      </Grid>
    </Grid>
  );
};

interface TopicButtonProps {
  cmd: string;
  title?: string;
}

export const TopicButton: React.FC<TopicButtonProps> = ({ cmd, title }) => {
  const { t } = useTranslation('supportbot');
  const [clicked, setClicked] = useState(false);

  const handleClick = async () => {
    if (clicked) return;

    setClicked(true);
    const message = t(`topics.${cmd}`);

    // Dispatch a custom event that SupportBot will listen to
    const event = new CustomEvent('supportbot.supportbot:topic', {
      detail: { message }
    });
    window.dispatchEvent(event);

    setClicked(false);
  };

  return (
    <Button
      variant="outlined"
      onClick={handleClick}
      disabled={clicked}
      sx={{ mr: 1, mb: 1 }}
    >
      {title || t(`buttons.${cmd}`)}
    </Button>
  );
};