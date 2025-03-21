
import './App.css';
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import AgentBuilder from './pages/AgentBuilder';
import AgentOperator from './pages/AgentOperator';
import Accountant from './pages/Accountant';
import HumanInTheLoopReview from './components/HumanInTheLoopReview';
import PromptEditor from './components/prompts/PromptEditor';
import DashboardEditor from './components/DashboardEditor';
import Dashboard from './pages/Dashboard'; 
import RoleAuthGuard from './components/auth/RoleAuthGuard';

// Create the theme with error handling
let theme;
try {
  theme = createTheme({
    palette: {
      primary: {
        main: '#1eb3b7',
      },
    },
  });
} catch (error) {
  console.error('Failed to create theme:', error);
  // Fallback to a simple theme object
  theme = {
    palette: {
      primary: {
        main: '#1eb3b7',
      },
    },
  };
}

const ProtectedRoute = ({ children }) => {
  return (
    <RoleAuthGuard allowedRoles={['developer']}>
      <AppLayout>
        <VerifiedRoute>
          {children}
        </VerifiedRoute>
      </AppLayout>
    </RoleAuthGuard>
  );
};

// For customer-accessible routes (including developers)
const CustomerAccessibleRoute = ({ children }) => {
  return (
    <RoleAuthGuard allowedRoles={['customer', 'developer']}>
      {children}
    </RoleAuthGuard>
  );
};

const App = () => {
  return (
  <ThemeProvider theme={theme}>
    <AuthProvider>    
      <DisclaimerProvider>
       
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
                  <Route path="/human-in-the-loop/:id" element={<HumanInTheLoopReview />} />
                 
                  {/* Customer-role routes */}
                  <Route 
                    path="/customer-dashboards/:dashboardId" 
                    element={
                      <CustomerAccessibleRoute>
                        <Dashboard />
                      </CustomerAccessibleRoute>
                    } 
                  />
                  
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
                    path="/builder" 
                    element={
                      <ProtectedRoute>
                        <VerifiedRoute>
                          <AgentBuilder />
                        </VerifiedRoute>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/operator" 
                    element={
                      <ProtectedRoute>
                        <VerifiedRoute>
                          <AgentOperator />
                        </VerifiedRoute>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/prompts" 
                    element={
                      <ProtectedRoute>
                        <VerifiedRoute>
                          <PromptEditor />
                        </VerifiedRoute>
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/dashboards/edit/:id" 
                    element={
                      <ProtectedRoute>
                        <VerifiedRoute>
                          <DashboardEditor />
                        </VerifiedRoute>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/self-service" 
                    element={
                      <ProtectedRoute>
                        <VerifiedRoute>
                          <DashboardEditor />
                        </VerifiedRoute>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/accountant" 
                    element={
                      <ProtectedRoute>
                        <VerifiedRoute>
                          <Accountant />
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
       
      </DisclaimerProvider>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
