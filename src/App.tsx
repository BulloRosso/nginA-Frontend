import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MemoryTimeline from './components/common/MemoryTimeline';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';
import ProfileSelection from './pages/ProfileSelection';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Login, Register, ForgotPassword } from './components/auth';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthProvider } from './contexts/auth';
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

const theme = createTheme({
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
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <Routes>
              {/* Landing page - no header */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/business" element={<LandingPageBusiness />} />
              <Route path="/introduction" element={<IntroductionVideo />} />

              {/* Interview token handler */}
              <Route path="/interview-token" element={<TokenHandler />} />

              {/* Auth routes - no header */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes - with header */}
              <Route path="/profile-selection" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <ProfileSelection />
                  </VerifiedRoute>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } />

              <Route path="/invitations" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <InvitationsDashboard />
                  </VerifiedRoute>
                </ProtectedRoute>
              } />

              <Route path="/interview" element={
                <TokenProtectedRoute>
                  <MemoryCapture />
                </TokenProtectedRoute>
              } />

              <Route path="/timeline" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <MemoryTimeline 
                      memories={[]}
                      onMemorySelect={(memory) => console.log('Selected memory:', memory)}
                    />
                  </VerifiedRoute>
                </ProtectedRoute>
              } />

              <Route path="/chat" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <ChatRobot />
                  </VerifiedRoute>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </I18nextProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;