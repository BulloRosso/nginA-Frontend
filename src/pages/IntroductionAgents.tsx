// src/pages/IntroductionAgents.tsx
import React, { useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const IntroductionAgents: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['agents', 'common']);

  useEffect(() => {
    // Set localStorage item with timestamp when component mounts
    localStorage.setItem('intro_for_agents', Date.now().toString());
  }, []);

  const handleContinue = () => {
    navigate('/operator');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Introduction to Agent Types
          </Typography>

          <Typography variant="body1" sx={{ mb: 4 }}>
            Welcome to the Agent Operator. Here's an overview of the different agent types available in our system.
          </Typography>

          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'gold' }}>
                  <TableCell><Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Agent Type</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Description</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Use Case</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ verticalAlign: 'top'}}>
                  <TableCell sx={{ backgroundColor: '#efefef'}}><Typography variant="h6" sx={{ fontWeight: 'bold' }}>Atom</Typography></TableCell>
                  <TableCell>Single-purpose agents that work like sub-routines: return a defined output for a defined input.</TableCell>
                  <TableCell>
                    <ul  style={{ listStyleType: 'disc' }}>
                    <li>Data retrieval, </li>
                      <li>simple calculations, </li>
                        <li>basic text generation.</li>
                    </ul></TableCell>
                </TableRow>
                <TableRow sx={{ verticalAlign: 'top'}}>
                  <TableCell sx={{ backgroundColor: '#efefef'}}><Typography variant="h6" sx={{ fontWeight: 'bold' }}>Chain</Typography></TableCell>
                  <TableCell>Sequential agents that pass information through a predefined workflow.</TableCell>
                  <TableCell>
                    <ul style={{ listStyleType: 'disc' }}>
                      <li>Multi-step data processing,</li> 
                        <li>sequential approvals,</li> 
                          <li>document transformation.</li>
                     </ul>
                  </TableCell>
                </TableRow>
                <TableRow sx={{ verticalAlign: 'top'}}>
                  <TableCell sx={{ backgroundColor: '#efefef'}}><Typography variant="h6" sx={{ fontWeight: 'bold' }}>Dynamic</Typography></TableCell>
                  <TableCell>Adaptive agents that can modify their behavior based on inputs and context.</TableCell>
                  <TableCell>
                    <ul style={{ listStyleType: 'disc' }}>
                      <li>Complex problem-solving, </li>
                        <li>conversational interfaces, </li>
                          <li>decision-making systems.</li>
                     </ul>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleContinue}
              size="large"
            >
              {t('common.continue')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default IntroductionAgents;