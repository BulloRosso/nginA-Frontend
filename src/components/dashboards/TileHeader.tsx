// src/components/dashboards/TileHeader.tsx
import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { 
  MoreVert as MoreIcon,
  Fullscreen as FullscreenIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface TileHeaderProps {
  title: string;
  icon?: React.ReactNode;
  showMenu?: boolean;
  showFullscreen?: boolean;
  showInfo?: boolean;
  infoText?: string;
  onMenuClick?: () => void;
  onFullscreenClick?: () => void;
  onInfoClick?: () => void;
  color?: string;
  bgcolor?: string;
}

const TileHeader: React.FC<TileHeaderProps> = ({
  title,
  icon,
  showMenu = false,
  showFullscreen = false,
  showInfo = false,
  infoText,
  onMenuClick,
  onFullscreenClick,
  onInfoClick,
  color = 'inherit',
  bgcolor = 'transparent',
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee',
        p: 2,
        mb: 1,
        bgcolor: bgcolor,
        color: color,
      }}
      className="tile-header"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {showInfo && (
          <Tooltip title={infoText || "Information"}>
            <IconButton size="small" onClick={onInfoClick}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {showFullscreen && (
          <IconButton size="small" onClick={onFullscreenClick}>
            <FullscreenIcon fontSize="small" />
          </IconButton>
        )}

        {showMenu && (
          <IconButton size="small" onClick={onMenuClick}>
            <MoreIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default TileHeader;