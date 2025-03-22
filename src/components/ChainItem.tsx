import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Agent } from '../types/agent';

interface ChainItemProps {
  agent: Agent;
  connectorType: 'magic' | 'code';
  connectorJsCode: string;
  connectorValid: boolean;
  isLast: boolean;
  onConnectorValidClick: () => void;
  onUpClick: () => void;
  onDownClick: () => void;
  onAddClick: () => void;
}

const ChainItem: React.FC<ChainItemProps> = ({
  agent,
  connectorValid,
  isLast,
  onConnectorValidClick,
  onUpClick,
  onDownClick,
  onAddClick
}) => {
  // Parse SVG icon
  const svgIcon = agent.icon_svg || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" /></svg>';

  // Get agent title in the correct language
  const agentTitle = agent.title?.en || 'Unknown Agent';

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
            border: '2px solid #c3c9d5',
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
                fill: connectorValid ? '#c3c9d5' : '#ff9922'
              }
            }}
            dangerouslySetInnerHTML={{ __html: svgIcon }}
          />
        </Box>

        {/* Connector Valid Indicator - upper left */}
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
          {connectorValid ? (
            <CheckCircleIcon sx={{ color: 'green', fontSize: 39 }} />
          ) : (
            <CancelIcon sx={{ color: '#ff9922', fontSize: 39 }} />
          )}
        </IconButton>

        {/* Up Arrow - upper right */}
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 42,
            right: 42,
            padding: 0,
          }}
          onClick={onUpClick}
        >
          <ArrowUpwardIcon sx={{ color: '#c3c9d5', fontSize: 24 }} />
        </IconButton>

        {/* Down Arrow - lower right */}
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            bottom: 42,
            right: 42,
            padding: 0,
          }}
          onClick={onDownClick}
        >
          <ArrowDownwardIcon sx={{ color: '#c3c9d5', fontSize: 24 }} />
        </IconButton>

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
            backgroundColor: '#c3c9d5',
            borderRadius: '50%',
          }}
        />

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
              backgroundColor: '#c3c9d5',
            }}
          />
          {isLast ? (
            <IconButton
              size="small"
              sx={{
                backgroundColor: '#c3c9d5',
                borderRadius: '4px',
                width: 30,
                height: 30,
                padding: 0,
                '&:hover': {
                  backgroundColor: '#ddd',
                },
              }}
              onClick={onAddClick}
            >
              <AddIcon sx={{ color: 'black', fontSize: 26 }} />
            </IconButton>
          ) : (
            <ArrowForwardIcon sx={{ marginLeft: '-7px', color: '#c3c9d5', fontSize: 26 }} />
          )}
        </Box>
      </Box>

      {/* Agent Title */}
      <Typography
        variant="body2"
        sx={{
          color: '#fff',
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