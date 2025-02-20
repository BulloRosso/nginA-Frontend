import React, { useState, useEffect } from 'react';

// Material UI style status icons
const CheckCircle = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const ErrorCircle = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>
);

const TimeoutCircle = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
  </svg>
);

const LoadingCircle = () => (
  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.41 3.59-8 8-8zm0 16c-4.41 0-8-3.59-8-8H2c0 5.52 4.48 10 10 10v-2zm0-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

interface AgentStatusIndicatorProps {
  agentEndpoint: string | null;
}

export const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ agentEndpoint }) => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (!agentEndpoint) {
      console.error('No agent endpoint provided');
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
     
      const prevStatus = status;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
         
        }, 500);

        const response = await fetch(agentEndpoint, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        // Log state change
        const newStatus = response.status === 200 ? 'online' : 'error';
       
        // Force state update
        setStatus(status => {
         
          return newStatus;
        });

      } catch (error) {
        
        const newStatus = error.name === 'AbortError' ? 'timeout' : 'error';

      
        // Force state update
        setStatus(status => {
         
          return newStatus;
        });
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [agentEndpoint]);

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle />;
      case 'error':
        return <ErrorCircle />;
      case 'timeout':
        return <TimeoutCircle />;
      default:
        return <LoadingCircle />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#4caf50';  // Green
      case 'error':
        return '#f44336';  // Red
      case 'timeout':
        return '#757575';  // Dark gray
      default:
        return '#bdbdbd';  // Light gray
    }
  };

  return (
    <div style={{ color: getStatusColor() }}>
      {getStatusIcon()}
    </div>
  );
};