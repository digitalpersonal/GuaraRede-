import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PwaContext = createContext();

export const usePwa = () => useContext(PwaContext);

export const PwaProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  const handleBeforeInstallPrompt = useCallback((e) => {
    e.preventDefault();
    setDeferredPrompt(e);
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [handleBeforeInstallPrompt]);

  const triggerInstallPrompt = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
        setCanInstall(false);
      });
    }
  };

  const value = {
    canInstall,
    triggerInstallPrompt,
  };

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
};