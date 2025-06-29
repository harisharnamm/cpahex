import React, { createContext, useContext, useState, useEffect } from 'react';
import Preloader from '../components/ui/preloader';

interface PreloaderContextType {
  showPreloader: boolean;
  setShowPreloader: React.Dispatch<React.SetStateAction<boolean>>;
}

const PreloaderContext = createContext<PreloaderContextType | undefined>(undefined);

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const [showPreloader, setShowPreloader] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check if user just logged in on initial load
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      setShowPreloader(true);
    }
    
    // Set initial load to false after a short delay
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <PreloaderContext.Provider value={{ showPreloader, setShowPreloader }}>
      {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} />}
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  const context = useContext(PreloaderContext);
  if (context === undefined) {
    throw new Error('usePreloader must be used within a PreloaderProvider');
  }
  return context;
}