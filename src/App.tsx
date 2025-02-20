import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';
import ProfileSelection from './pages/ProfileSelection';
import { createTheme as createMuiTheme, ThemeProvider } from '@mui/material/styles';
import { Login } from './components/auth/Login';
import { Register } from './components/auth';
import { ForgotPassword } from './components/auth';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthProvider } from './contexts/auth';
import MFAWrapper from './components/auth/MFAWrapper';  // Updated import
import { VerifiedRoute } from './components/verification';
import { AppLayout } from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';  
import LandingPageBusiness from './pages/LandingPageBusiness'; 
import IntroductionVideo from './pages/IntroductionVideo';
import ChatRobot from './components/chat/ChatRobot';
import InvitationsDashboard from './components/invitations/InvitationsDashboard';
import TokenHandler from './components/interview/TokenHandler';
import { TokenProtectedRoute } from './hoc/withTokenProtection';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Checkout from './pages/Checkout';
import PrintSettings from './pages/PrintSettings';
import { DisclaimerProvider } from './contexts/disclaimer';
import { Disclaimer } from './components/modals/Disclaimer';
import InterviewWelcome from './pages/InterviewWelcome';
import { ResetPassword } from './components/auth/ResetPassword';
import AgentsCatalogPage from './pages/AgentsCatalogPage';
import AgentInfoPage from './pages/AgentInfoPage';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#1eb3b7',
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <AppLayout>{children}</AppLayout>;
};

const App = () => {
  return (
    <AuthProvider>
      <DisclaimerProvider>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <MFAWrapper>
            <Routes>
              {/* Public routes - no header */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/business" element={<LandingPageBusiness />} />
              <Route path="/introduction" element={<IntroductionVideo />} />
              <Route path="/interview-welcome" element={<InterviewWelcome />} />
              <Route path="/interview-token" element={<TokenHandler />} />
              <Route path="/reset-password" element={<ResetPassword />} />
             
              
              {/* Auth routes - no header */}
              <Route 
                path="/login" 
                element={
                  <Login onSuccess={() => {}} /> // Providing required prop
                }
              />
              <Route 
                path="/register" 
                element={
                  <Register onSuccess={() => {}} />
                }
              />
              <Route 
                path="/forgot-password" 
                element={
                  <ForgotPassword onSuccess={() => {}} />
                }
              />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes - with header */}
              <Route 
                path="/profile-selection" 
                element={
                  <ProtectedRoute>
                    <VerifiedRoute>
                      <ProfileSelection />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/agents" 
                element={
                  <ProtectedRoute>
                    <VerifiedRoute>
                      <AgentsCatalogPage />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } />
              <Route 
                path="/agents/:id" 
                element={
                  <ProtectedRoute>
                    <VerifiedRoute>
                      <AgentInfoPage />  
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                    <VerifiedRoute>
                      <Checkout />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfileSetup />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/print" 
                element={
                  <ProtectedRoute>
                    <VerifiedRoute>
                      <PrintSettings />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/invitations" 
                element={
                  <ProtectedRoute>
                    <VerifiedRoute>
                      <InvitationsDashboard />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/interview" 
                element={
                  <TokenProtectedRoute>
                    <MemoryCapture />
                  </TokenProtectedRoute>
                } 
              />

              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <VerifiedRoute>
                      <ChatRobot />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />

              {/* Catch all - redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
              <Disclaimer /> 
            
            </MFAWrapper>
          </BrowserRouter>
        </I18nextProvider>
      </ThemeProvider>
      </DisclaimerProvider>
    </AuthProvider>
  );
};

export default App;