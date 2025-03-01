import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { HumanFeedbackService, HumanFeedbackData } from '../services/human-feedback';
import ScratchpadBrowser from '../components/ScratchpadBrowser';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

const HumanInTheLoopReview = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [reviewData, setReviewData] = useState<HumanFeedbackData | null>(null);

  // Get ID from URL path
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    // Fetch the human-in-the-loop request details
    const fetchReviewData = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('No review ID found');

        const data = await HumanFeedbackService.getHumanFeedback(id);
        setReviewData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [id]);

  const handleSubmit = async (approved: boolean) => {
    try {
      if (!id) throw new Error('No review ID found');

      setSubmitting(true);
      await HumanFeedbackService.updateHumanFeedback(id, {
        status: approved ? 'approved' : 'rejected',
        feedback: feedback || undefined
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading review request...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="success">
          Thank you for your review! Your feedback has been submitted successfully.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ mb: 4 }}><b>nginA</b>: Please Review the Agents output</Typography>

        {reviewData?.reason && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6">Reason for Review:</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
              <Typography>{reviewData.reason}</Typography>
            </Paper>
          </Box>
        )}

        {/* Scratchpad Browser Section */}
        {reviewData?.run_id && (
          <Box sx={{ mb: 4, 
                    minHeight:'325px',
                    maxHeight: '325px', 
                    overflowY: 'auto', 
                    borderBottom: '1px solid #ccc',
                    borderTop: '1px solid #ccc'
                   }}>
            <ScratchpadBrowser runId={reviewData.run_id} />
          </Box>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Your Feedback</Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Enter your feedback here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<ThumbDownIcon />}
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            sx={{ minWidth: 120 }}
          >
            Reject
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<ThumbUpIcon />}
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            sx={{ minWidth: 120 }}
          >
            Approve
          </Button>
        </Box>

        {submitting && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 1 }}>Submitting your response...</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default HumanInTheLoopReview;