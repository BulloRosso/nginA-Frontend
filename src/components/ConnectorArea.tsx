import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface ConnectorAreaProps {
  connectorType: 'magic' | 'code';
  connectorJsCode: string;
  onTypeChange: (type: 'magic' | 'code') => void;
  onCodeChange: (code: string) => void;
  onClose: () => void;
}

const ConnectorArea: React.FC<ConnectorAreaProps> = ({
  connectorType,
  connectorJsCode,
  onTypeChange,
  onCodeChange,
  onClose
}) => {
  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        background: '#1e1e1e',
        borderRadius: 1,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 2, color: 'white' }}>
        Connector Configuration
      </Typography>

      <Stack spacing={2}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="connector-type-label" sx={{ color: 'white' }}>Connector Type</InputLabel>
          <Select
            labelId="connector-type-label"
            value={connectorType}
            onChange={(e) => onTypeChange(e.target.value as 'magic' | 'code')}
            label="Connector Type"
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            }}
          >
            <MenuItem value="magic">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoFixHighIcon sx={{ mr: 1 }} />
                Magic (Auto-Transform)
              </Box>
            </MenuItem>
            <MenuItem value="code">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CodeIcon sx={{ mr: 1 }} />
                Code (JavaScript)
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {connectorType === 'code' && (
          <TextField
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            label="JavaScript Connector Code"
            value={connectorJsCode}
            onChange={(e) => onCodeChange(e.target.value)}
            InputProps={{
              style: {
                fontFamily: 'monospace',
                fontSize: '14px',
              },
            }}
            sx={{
              '.MuiInputBase-root': {
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
              },
              '.MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            }}
          />
        )}

        {connectorType === 'magic' && (
          <Box sx={{ p: 2, background: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Magic connector will automatically transform the output of the previous agent to match the input requirements of the next agent.
            </Typography>

            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
              The connector will analyze the output schema of the previous agent and the input schema of the next agent to determine how to transform the data.
            </Typography>
          </Box>
        )}

        <Button 
          variant="contained" 
          color="primary"
          onClick={onClose}
        >
          Close Connector
        </Button>
      </Stack>
    </Box>
  );
};

export default ConnectorArea;