import React, { useState, useCallback } from 'react';
import { Box, Typography, Paper, Button, Container, Divider } from '@mui/material';
import ChainEditor from './ChainEditor';

interface ChainConfig {
  agents: {
    agentId: string;
    connectorType: 'magic' | 'code';
    connectorJsCode: string;
    connectorPrompt: string; // Add the new property
    connectorValid: boolean;
  }[];
}

const ChainEditorDemo: React.FC = () => {
  const [chainConfig, setChainConfig] = useState<ChainConfig | null>(null);

  // Use useCallback to prevent the function from changing on every render
  const handleChainChange = useCallback((config: ChainConfig) => {
    setChainConfig(config);
  }, []);

  // Initial chain configuration that doesn't change between renders
  // We'll use React.useMemo to ensure this object isn't recreated on each render
  const initialChain = React.useMemo(() => ({
    agents: [
      {
        agentId: '9df9a066-0abd-4fbf-bc05-c74ba8ed5cbb', // This would be your initial agent ID
        connectorType: 'magic',
        connectorJsCode: '',
        connectorPrompt: '', // Initialize with empty prompt
        connectorValid: false
      }
    ]
  }), []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 0 }}>

        <ChainEditor 
          onChange={handleChainChange} 
          initialChain={initialChain}
        />

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" sx={{ mb: 2 }}>
          Current Chain Configuration
        </Typography>

        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            JSON Output:
          </Typography>
          <pre style={{ overflowX: 'auto', backgroundColor: '#eee', padding: '16px', borderRadius: '4px' }}>
            {JSON.stringify(chainConfig, null, 2)}
          </pre>
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => console.log('Save configuration:', chainConfig)}
          >
            Save Configuration
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ChainEditorDemo;