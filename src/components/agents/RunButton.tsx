// src/components/agents/RunButton.tsx
import React from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { 
  DirectionsRun as RunIcon,
  Pause as PauseIcon,
  BackHand as BackHandIcon,
} from '@mui/icons-material';
import { Agent } from '../../types/agent';

interface RunButtonProps {
  agent: Agent;
  active: boolean;
  status: string | null;
  onStartRun: (agent: Agent) => void;
}

// This is a separate component to prevent state updates in the parent component
const RunButton: React.FC<RunButtonProps> = ({ agent, active, status, onStartRun }) => {

  if (status === "running") {
    status = "pending";
  }
  
  const getFabIcon = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <PauseIcon sx={{ color: 'darkorange' }} />;
      case 'human-in-the-loop':
        return <BackHandIcon />;
      default:
        return <RunIcon />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Completely stop the event propagation
    e.preventDefault();
    e.stopPropagation();

    // Call the onStartRun callback
    onStartRun(agent);

    // Return false to ensure no further handlers are triggered
    return false;
  };

  return (
    <Tooltip title={active ? "Manage Run" : "Start Run"}>
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <IconButton
          aria-label="run"
          type="button"
          size="small"
          sx={{
            color: status === 'pending' ? 'darkorange' : (active ? 'white' : 'inherit'),
            backgroundColor: status === 'pending' ? 'white' : (active ? 'darkorange' : 'gold'),
            padding: '8px',
            '&:hover': {
              backgroundColor: status === 'pending' ? 'white' : (active ? '#004d00' : 'gold'), 
            },
          }}
          onClick={handleClick}
        >
          {getFabIcon(status)}
        </IconButton>
        {(status === 'running' || status === 'pending') && (
      <>
      <CircularProgress
        size={38}
        variant="determinate"
        value={100}
        sx={{
          color: '#ccc',
          position: 'absolute',
          top: 1,
          left: 1,
          zIndex: 1,
        }}
      />
      <CircularProgress
        size={38}
        sx={(theme) => ({
          animationDuration: '10000ms',
          color: 'darkorange',
          position: 'absolute',
          top: 1,
          left: 1,
          zIndex: 2
        })}
       
      /> </>
        )}
      </div>
    </Tooltip>
  );
};

export default RunButton;