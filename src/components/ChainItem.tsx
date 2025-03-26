import React, { useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpIcon from '@mui/icons-material/Help';
import CodeIcon from '@mui/icons-material/Code';
import WarningIcon from '@mui/icons-material/Warning';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Agent } from '../types/agent';

interface ChainItemProps {
  agent: Agent;
  connectorType: 'magic' | 'code';
  connectorJsCode: string;
  connectorValid: boolean;
  isLast: boolean;
  isSelected?: boolean; // New prop to indicate if this item is selected
  teamAgents: Agent[]; // Add teamAgents prop to display in the menu
  onConnectorValidClick: () => void;
  onAgentChange: (agentId: string) => void; // Change to handle agent selection
  onAddClick: () => void;
}

const ChainItem: React.FC<ChainItemProps> = ({
  agent,
  connectorType,
  connectorJsCode,
  connectorValid,
  isLast,
  isSelected = false,
  teamAgents,
  onConnectorValidClick,
  onAgentChange,
  onAddClick
}) => {
  // State for the menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Parse SVG icon
  const svgIcon = agent.icon_svg || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" /></svg>';

  // Get agent title in the correct language
  const agentTitle = agent.title?.en || 'Unknown Agent';

  // Gold color for selected state
  const goldColor = '#FFD700';

  // Handler for opening the menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handler for closing the menu
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handler for selecting an agent from the menu
  const handleAgentSelect = (agentId: string) => {
    onAgentChange(agentId);
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        width: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      {/* Background without pattern */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 200,
          background: 'transparent',
          borderRadius: '5%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Agent SVG Icon - centered */}
        <Box
          sx={{
            width: 128,
            height: 128,
            background: '#414244',
            borderRadius: '8%',
            border: isSelected ? `3px solid ${goldColor}` : '2px solid #c3c9d5', // Gold border when selected
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: '0 0 8px rgba(195, 201, 213, 0.5)'
            }
          }}
          onClick={onConnectorValidClick} // Add click handler to show connector area
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              '& svg': {
                width: '100%',
                height: '100%',
                fill: isSelected ? goldColor : (connectorValid ? '#c3c9d5' : '#ff9922')
              }
            }}
            dangerouslySetInnerHTML={{ __html: svgIcon }}
          />
        </Box>

        {/* Connector Type Indicator - upper left */}
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 81,
            left: 17,
            padding: 0,
            zIndex: 100
          }}
          onClick={onConnectorValidClick}
        >
          {/* Show Help Icon if connector type is empty and not valid */}
          {(!connectorType || connectorType === '') && !connectorValid && (
            <HelpIcon sx={{ color: '#808080', fontSize: 24, position: 'relative', top: 7, left: 7 }} />
          )}

          {/* Show AutoFixHighIcon if connector type is magic */}
          {connectorType === 'magic' && connectorValid && (
            <AutoFixHighIcon sx={{ color: 'green', fontSize: 24, position: 'relative', top: 7, left: 7 }} />
          )}

          {/* Show CodeIcon if connector type is code and has code */}
          {connectorType === 'code' && connectorJsCode && connectorValid && (
            <CodeIcon sx={{ color: 'green', fontSize: 24, position: 'relative', top: 7, left: 7 }} />
          )}

          {/* Show CancelIcon for any other invalid state */}
          {((connectorType === 'code' && !connectorJsCode) || 
            (connectorValid === false && connectorType && connectorType !== '')) && (
            <CancelIcon sx={{ color: '#ff9922', fontSize: 24, position: 'relative', top: 7, left: 7 }} />
          )}
        </IconButton>

        {/* Vertical Ellipsis - replace the up arrow */}
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 42,
            right: 42,
            padding: 0,
          }}
          onClick={handleMenuClick}
          aria-controls={open ? "agent-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <MoreVertIcon sx={{ color: isSelected ? goldColor : '#c3c9d5', fontSize: 24 }} />
        </IconButton>

        {/* Agent Selection Menu */}
        <Menu
          id="agent-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-labelledby': 'agent-selection-button',
          }}
          sx={{
            '& .MuiPaper-root': {
              backgroundColor: '#2d2e2e',
              color: 'white',
              border: '1px solid #444'
            }
          }}
        >
          {teamAgents.map((teamAgent) => (
            <MenuItem 
              key={teamAgent.id} 
              onClick={() => handleAgentSelect(teamAgent.id)}
              selected={teamAgent.id === agent.id}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 215, 0, 0.2)'
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  '& svg': {
                    width: '100%',
                    height: '100%',
                    fill: '#c3c9d5'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: teamAgent.icon_svg || svgIcon }}
              />
              {teamAgent.title?.en || 'Unknown Agent'}
            </MenuItem>
          ))}
        </Menu>

        {/* Left Connector - white circle */}
        <Box
          sx={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            backgroundColor: '#fff',
            borderRadius: '50%',
            border: isSelected ? `2px solid ${goldColor}` : 'none',
          }}
        />

                  {/* Right Connector - circle */}
        <Box
          sx={{
            position: 'absolute',
            right: '28px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            backgroundColor: isSelected ? goldColor : '#c3c9d5',
            borderRadius: '50%',
          }}
        />

        {/* Red disc indicator for missing output_example */}
        {!agent.output_example && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 42,
              right: 42
            }}
            title="Missing output example"
          >
            <WarningIcon sx={{ color: 'red', fontSize: 32, position: 'relative', top: 0 }} />
          </Box>
        )}

        {/* Right Connection Line + Icon */}
        <Box
          sx={{
            position: 'absolute',
            right: '-40px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 55,
              height: 2,
              backgroundColor: isSelected ? goldColor : '#c3c9d5',
            }}
          />
          {isLast ? (
            <IconButton
              size="small"
              sx={{
                backgroundColor: isSelected ? goldColor : '#c3c9d5',
                borderRadius: '4px',
                width: 30,
                height: 30,
                padding: 0,
                '&:hover': {
                  backgroundColor: isSelected ? '#FFC500' : '#ddd',
                },
              }}
              onClick={onAddClick}
            >
              <AddIcon sx={{ color: 'black', fontSize: 26 }} />
            </IconButton>
          ) : (
            <ArrowForwardIcon sx={{ marginLeft: '-7px', color: isSelected ? goldColor : '#c3c9d5', fontSize: 26 }} />
          )}
        </Box>
      </Box>

      {/* Agent Title */}
      <Typography
        variant="body2"
        sx={{
          color: isSelected ? goldColor : '#fff',
          fontWeight: 'bold',
          fontSize: '100%',
          mt: -3,
          textAlign: 'center',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {agentTitle}
      </Typography>
    </Box>
  );
};

export default ChainItem;