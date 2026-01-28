import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { usePwa } from '@/contexts/PwaContext';

const PwaPrompt = () => {
  const { canInstall, triggerInstallPrompt } = usePwa();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      if (canInstall && sessionStorage.getItem('pwaPromptDismissed') !== 'true') {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const timer = setTimeout(handleVisibility, 3000); // 3 seconds delay

    // Also check when canInstall changes
    handleVisibility();

    return () => clearTimeout(timer);
  }, [canInstall]);

  const handleInstallClick = () => {
    setIsVisible(false);
    triggerInstallPrompt();
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwaPromptDismissed', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl p-4 max-w-sm w-full"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <img className="h-12 w-12 rounded-md" src="https://horizons-cdn.hostinger.com/1f18af65-0f36-409f-9dde-b43d21a4059a/dac93f09a97be588a267e0ed43da24a9.jpg" alt="RedeGuara Logo" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">Instale o App RedeGuara</p>
              <p className="mt-1 text-sm text-gray-500">Adicione à sua tela inicial para uma experiência mais rápida.</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleInstallClick} className="w-full flex items-center gap-2">
                  <Download size={16} />
                  Instalar
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDismiss}>
                  <X size={16} />
                </Button>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                <span className="font-semibold">No Android:</span> Toque nos 3 pontinhos (menu) e "Adicionar à tela inicial".<br/>
                <span className="font-semibold">No iOS:</span> Toque no ícone de Compartilhar (quadrado com seta para cima) e "Adicionar à Tela de Início".
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaPrompt;