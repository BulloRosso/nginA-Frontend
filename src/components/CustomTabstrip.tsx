// CustomTabstrip.tsx
import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InputIcon from '@mui/icons-material/Input';
import OutputIcon from '@mui/icons-material/Output';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';

const TabContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 4),
  width: '100%',
  '& > *': {
    flex: '0 0 auto'
  },
  '& > div:nth-of-type(even)': {
    flex: '1 1 auto'
  }
}));

const TabItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  width: 50,
  height: 50,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: active ? theme.palette.primary.main : 'white',
  color: active ? 'white' : theme.palette.primary.main,
  border: `2px solid ${theme.palette.primary.main}`,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  flexShrink: 0, // Prevent the circle from being stretched
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
  }
}));

const ArrowContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
  padding: 0,
  color: '#ccc',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ccc',
    zIndex: 0
  },
  '& svg': {
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
    top: '1px',
    left: '3px',
    display: 'block'
  }
}));

// Order changed: Auth first, costs last
const tabIcons = [
  { icon: <SecurityIcon />, key: 'agents.tabs.credentials' },
  { icon: <InputIcon />, key: 'agents.tabs.input' },
  { icon: <OutputIcon />, key: 'agents.tabs.output' },
  { icon: <RemoveRedEyeOutlinedIcon />, key: 'agents.tabs.evals' },
  { icon: <MonetizationOnOutlinedIcon />, key: 'agents.tabs.costs' }
];

interface CustomTabstripProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const CustomTabstrip: React.FC<CustomTabstripProps> = ({ value, onChange }) => {
  const { t } = useTranslation(['agents']);
  return (
    <TabContainer>
      {tabIcons.map((tab, index) => (
        <React.Fragment key={index}>
          <Tooltip title={t(tab.key)}>
            <TabItem 
              active={index === value}
              onClick={(e) => onChange(e, index)}
              role="tab"
              aria-selected={index === value}
            >
              {tab.icon}
            </TabItem>
          </Tooltip>

          {index < tabIcons.length - 1 && (
            <ArrowContainer>
              <ArrowForwardIcon  />
            </ArrowContainer>
          )}
        </React.Fragment>
      ))}
    </TabContainer>
  );
};

export default CustomTabstrip;