import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// import FooterBanner from '@/components/FooterBanner'; // Removed
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { PwaProvider } from '@/contexts/PwaContext';
import { Loader2, RefreshCw } from 'lucide-react';
import PwaPrompt from '@/components/PwaPrompt';
import ScrollToTop from '@/components/ScrollToTop';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const CompanyPage = lazy(() => import('@/pages/CompanyPage'));
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));
const GroupsPage = lazy(() => import('@/pages/GroupsPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const PostPage = lazy(() => import('@/pages/PostPage'));
const PostPreviewPage = lazy(() => import('@/pages/PostPreviewPage'));
const FeedPage = lazy(() => import('@/pages/FeedPage'));
const UserProductsPage = lazy(() => import('@/pages/UserProductsPage'));
const CommercialGuidePage = lazy(() => import('@/pages/CommercialGuidePage'));
const PlansPage = lazy(() => import('@/pages/PlansPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
// New page for unlimited banner management
const BannerManagementPage = lazy(() => import('@/pages/BannerManagementPage'));

// Componente de Loading Otimizado com Feedback Manual
const LoadingFallback = () => {
  const [showManualRetry, setShowManualRetry] = useState(false);

  useEffect(() => {
    // Se demorar mais de 3s no suspense, mostra botão
    const timer = setTimeout(() => setShowManualRetry(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      {showManualRetry && (
        <div className="text-center animate-in fade-in duration-500">
           <p className="text-sm text-gray-500 mb-2">A internet parece lenta...</p>
           <Button 
             variant="outline" 
             size="sm" 
             onClick={() => window.location.reload()}
             className="flex items-center gap-2"
           >
             <RefreshCw className="w-4 h-4" /> Recarregar Página
           </Button>
        </div>
      )}
    </div>
  );
};

const AppContent = () => {
  const { loading } = useAuth();
  const { toast } = useToast();

  // Lógica de Service Worker Simplificada e Não-Bloqueante
  useEffect(() => {
    if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
      const handleSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          
          // Evita recarregamento forçado. Apenas notifica se houver update.
          registration.onupdatefound = () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.onstatechange = () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: "Nova versão disponível!",
                    description: "O aplicativo foi atualizado. Recarregue para ver as novidades.",
                    action: (
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Atualizar
                      </Button>
                    ),
                    duration: 10000,
                  });
                }
              };
            }
          };
        } catch (err) {
          console.log('SW registration failed (non-critical):', err);
        }
      };
      
      // Atrasa ligeiramente o registro do SW para não competir com o carregamento inicial da UI
      window.addEventListener('load', () => {
        setTimeout(handleSW, 1000);
      });
    }
  }, [toast]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/company/:id" element={<CompanyPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/my-products" element={<UserProductsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/banners" element={<BannerManagementPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/post-preview/:id" element={<PostPreviewPage />} />
            <Route path="/guia-comercial" element={<CommercialGuidePage />} />
            <Route path="/planos" element={<PlansPage />} /> {/* Updated route from /plans to /planos */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </Suspense>
      </main>
      {/* <FooterBanner /> Removed the FooterBanner component */}
      <Footer />
      <PwaPrompt />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <PwaProvider>
          <Helmet>
            <title>RedeGuara - A Rede Social de Guaranésia-MG</title>
            <meta name="description" content="A primeira cidade do Brasil a ter uma rede social própria! Conecte-se com sua comunidade local." />
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-GC9NMXXN5B"></script>
            <script>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-GC9NMXXN5B');
              `}
            </script>
          </Helmet>
          
          <AppContent />

          <Toaster />
        </PwaProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;