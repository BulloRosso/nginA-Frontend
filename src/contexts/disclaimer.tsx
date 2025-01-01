// src/contexts/disclaimer.tsx
import React, { createContext, useContext, useState } from 'react';

interface DisclaimerContextType {
  isOpen: boolean;
  openDisclaimer: () => void;
  closeDisclaimer: () => void;
}

const DisclaimerContext = createContext<DisclaimerContextType | undefined>(undefined);

export const DisclaimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openDisclaimer = () => setIsOpen(true);
  const closeDisclaimer = () => setIsOpen(false);

  return (
    <DisclaimerContext.Provider value={{ isOpen, openDisclaimer, closeDisclaimer }}>
      {children}
    </DisclaimerContext.Provider>
  );
};

export const useDisclaimer = () => {
  const context = useContext(DisclaimerContext);
  if (context === undefined) {
    throw new Error('useDisclaimer must be used within a DisclaimerProvider');
  }
  return context;
};