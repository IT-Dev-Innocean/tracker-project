import React, { createContext, useContext } from 'react';
import useAppLogic from '../useAppLogic';

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const appState = useAppLogic();
  return <AppContext.Provider value={appState}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
