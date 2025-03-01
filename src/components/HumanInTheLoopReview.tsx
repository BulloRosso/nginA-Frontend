import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { HumanFeedbackService, HumanFeedbackData } from '../services/human-feedback';

const HumanInTheLoopReview = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [feedback, setFeedback] = useState('');
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4">Loading review request...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Thank you for your review! Your feedback has been submitted successfully.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Review Request</h1>

        {reviewData?.reason && (
          <div className="mb-6">
            <h2 className="text-lg font-medium">Reason for Review:</h2>
            <div className="mt-2 p-3 bg-gray-100 rounded">{reviewData.reason}</div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="feedback">
            Your Feedback
          </label>
          <textarea
            id="feedback"
            rows={4}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          ></textarea>
        </div>

        <div className="flex justify-between">
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-48 flex items-center justify-center"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
            Reject
          </button>

          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-48 flex items-center justify-center"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4l-1.4 1.866a4 4 0 00-.8 2.4z" />
            </svg>
            Approve
          </button>
        </div>

        {submitting && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-2">Submitting your response...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HumanInTheLoopReview;