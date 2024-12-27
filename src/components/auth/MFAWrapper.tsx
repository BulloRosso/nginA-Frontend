// src/components/auth/MFAWrapper.tsx
import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';
import MFAEnrollment from './MFAEnrollment';
import MFAVerification from './MFAVerification';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface MFAWrapperProps {
  children: React.ReactNode;
}

const MFAWrapper: React.FC<MFAWrapperProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [showMFAEnrollment, setShowMFAEnrollment] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [existingFactorId, setExistingFactorId] = useState<string | null>(null);

  const checkMFAStatus = async () => {
    try {
      setIsChecking(true);
      const { data, error } = await AuthService.getAuthLevel();

      if (error) throw error;

      if (data) {
        // If next level is aal2 but current level is aal1, MFA is needed
        if (data.nextLevel === 'aal2' && data.currentLevel === 'aal1') {
          // Check if user has existing MFA factors
          const factors = await AuthService.listMFAFactors();
          if (factors.data?.totp?.length > 0) {
            // User has existing MFA setup, show verification
            setExistingFactorId(factors.data.totp[0].id);
            setShowMFAVerification(true);
          } else {
            // User needs to set up MFA
            setShowMFAEnrollment(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const handleMFAComplete = () => {
    setShowMFAEnrollment(false);
    setShowMFAVerification(false);
    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {showMFAEnrollment && (
        <MFAEnrollment
          open={showMFAEnrollment}
          onClose={() => setShowMFAEnrollment(false)}
          onEnrolled={handleMFAComplete}
        />
      )}

      {showMFAVerification && existingFactorId && (
        <MFAVerification
          open={showMFAVerification}
          factorId={existingFactorId}
          onClose={() => setShowMFAVerification(false)}
          onVerified={handleMFAComplete}
        />
      )}

      {!showMFAEnrollment && !showMFAVerification && children}
    </>
  );
};

export default MFAWrapper;