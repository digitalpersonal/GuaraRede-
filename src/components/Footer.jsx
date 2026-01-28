import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwa } from '@/contexts/PwaContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Footer = () => {
  const { deferredPrompt, canInstall, setCanInstall } = usePwa();
  const [showInstructions, setShowInstructions] = useState(false);

  const navLinks = [
    { name: 'Feed', path: '/feed' },
    { name: 'Guia Comercial', path: '/guia-comercial' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Grupos', path: '/groups' },
    { name: 'Planos', path: '/planos' }, // Updated path from /plans to /planos
  ];

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setCanInstall(false);
      });
    } else {
      setShowInstructions(true);
    }
  };

  return (
    <>
      <footer className="bg-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Happy people using their phones as a background watermark"
            className="w-full h-full object-cover opacity-30"
           src="https://horizons-cdn.hostinger.com/1f18af65-0f36-409f-9dde-b43d21a4059a/52761afb275f082d741e4272178fdb06.jpg" />
          <div className="absolute inset-0 bg-gray-800/10"></div>
        </div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <img src="https://horizons-cdn.hostinger.com/1f18af65-0f36-409f-9dde-b43d21a4059a/dac93f09a97be588a267e0ed43da24a9.jpg" alt="RedeGuara Logo" className="h-20 object-contain mb-4" />
              <h3 className="text-2xl font-bold text-white">RedeGuara</h3>
              <p className="text-gray-400 mt-2">Conectando Guaranésia.</p>
            </div>

            <div>
              <p className="font-semibold tracking-wider uppercase">Navegação</p>
              <ul className="mt-4 space-y-2">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-gray-400 hover:text-white transition-colors">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold tracking-wider uppercase">Contato</p>
              <div className="mt-4">
                <a href="https://wa.me/5535991048020" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Contato via WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            <div>
              <p className="font-semibold tracking-wider uppercase">Instale o App</p>
              <p className="text-gray-400 mt-4 text-sm">Tenha a RedeGuara sempre à mão!</p>
              {canInstall && (
                <Button onClick={handleInstallClick} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                  <Download className="mr-2 h-4 w-4" /> Instalar App
                </Button>
              )}
              {!canInstall && (
                <Button onClick={() => setShowInstructions(true)} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                  <Download className="mr-2 h-4 w-4" /> Como Instalar?
                </Button>
              )}
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>RedeGuara © 2025 - Guaranésia-MG. Todos os direitos reservados. A primeira cidade do Brasil a ter uma Rede Social própria!</p>
          </div>
        </div>
      </footer>
      <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Como Adicionar à Tela Inicial</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2 font-semibold">Para Android:</p>
              <ol className="list-decimal list-inside space-y-2 mb-4">
                <li>Abra o navegador (Chrome, por exemplo).</li>
                <li>Toque nos <strong>três pontinhos</strong> (menu) no canto superior direito.</li>
                <li>Procure e selecione a opção <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</li>
                <li>Confirme e o ícone da RedeGuara aparecerá na sua tela inicial!</li>
              </ol>
              <p className="mb-2 font-semibold">Para iOS (iPhone/iPad):</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Abra o Safari.</li>
                <li>Toque no ícone de <strong>Compartilhar</strong> (um quadrado com uma seta para cima <img alt="iOS share icon" className="inline h-5 w-5 mx-1"  src="https://images.unsplash.com/photo-1664098295863-62a394edad97" />) na barra inferior.</li>
                <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                <li>Confirme e o ícone da RedeGuara aparecerá na sua tela inicial!</li>
              </ol>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInstructions(false)}>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Footer;