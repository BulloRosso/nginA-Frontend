// src/components/agents/RunButton.tsx
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
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

  const getFabIcon = (status: string | null) => {
    switch (status) {
      case 'running':
        return <PauseIcon />;
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
      <IconButton
        aria-label="run"
        type="button"
        size="small"
        sx={{
          color: active ? 'white' : 'inherit',
          backgroundColor: active ? '#006400' : '#ccc',
          padding: '8px',
          '&:hover': {
             backgroundColor: active ? '#004d00' : 'gold', 
          },
        }}
        onClick={handleClick}
      >
        {getFabIcon(status)}
      </IconButton>
    </Tooltip>
  );
};

export default RunButton;