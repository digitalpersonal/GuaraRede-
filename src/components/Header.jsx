import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Newspaper, Store, Users, LogIn, UserPlus, Menu, X, ShoppingBag, LogOut, User as UserIcon, Shield, BookMarked, Gem, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import OptimizedImage from '@/components/OptimizedImage';
import { useToast } from '@/components/ui/use-toast';

const Header = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    const helperDismissed = localStorage.getItem('headerHelperDismissed');
    if (!helperDismissed && isAuthenticated) {
      const timer = setTimeout(() => {
        setShowHelper(true);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const dismissHelper = () => {
    setShowHelper(false);
    localStorage.setItem('headerHelperDismissed', 'true');
  };

  const handleSignOut = async () => {
    // Fecha menus
    setIsProfileMenuOpen(false);
    setIsMenuOpen(false);
    
    try {
      await signOut();
      
      toast({
        title: "Até logo!",
        description: "Você saiu da sua conta com sucesso.",
        duration: 3000,
      });
      
      // Redireciona explicitamente para a página de login como solicitado
      navigate('/login');
      
    } catch (error) {
      console.error("Erro ao tentar sair:", error);
      // Fallback: força a ida para o login mesmo com erro
      navigate('/login');
    }
  };

  const navLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/feed', label: 'Feed', icon: Newspaper },
    { href: '/marketplace', label: 'Marketplace', icon: Store },
    { href: '/guia-comercial', label: 'Guia Comercial', icon: BookMarked },
    { href: '/groups', label: 'Grupos', icon: Users },
    { href: '/planos', label: 'Planos', icon: Gem }, // Updated href from /plans to /planos
  ];

  const profileMenuLinks = [
    { href: `/profile/${user?.user_id}`, label: 'Meu Perfil', icon: UserIcon, condition: true },
    { href: '/my-products', label: 'Meus Produtos', icon: ShoppingBag, condition: user?.plan_type === 'prata' || user?.plan_type === 'ouro' },
    { href: '/admin', label: 'Painel Admin', icon: Shield, condition: user?.user_type === 'admin' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-20 h-20 flex items-center justify-center"
            >
              <img src="https://horizons-cdn.hostinger.com/1f18af65-0f36-409f-9dde-b43d21a4059a/dac93f09a97be588a267e0ed43da24a9.jpg" alt="RedeGuara Logo" className="h-full object-contain" />
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="text-gray-600 hover:text-blue-500 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center space-x-2 group">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-blue-400 transition-all">
                    {user?.avatar_url ? (
                      <OptimizedImage src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" width={40} height={40} />
                    ) : (
                      <UserIcon className="text-gray-500" />
                    )}
                  </div>
                  <span className="hidden sm:inline font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100"
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                        <p className="font-bold text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    {profileMenuLinks.map(link => link.condition && (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <link.icon className="w-4 h-4 mr-3" />
                        {link.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sair
                        </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link to="/login"><LogIn className="mr-2 h-4 w-4" /> Entrar</Link>
                </Button>
                <Button asChild>
                  <Link to="/register"><UserPlus className="mr-2 h-4 w-4" /> Cadastrar</Link>
                </Button>
              </div>
            )}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-1 font-medium p-2 hover:bg-gray-100 rounded-lg transition-colors">
                {isMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showHelper && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full right-4 mt-2 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 rounded-lg shadow-lg max-w-xs z-50"
        >
          <div className="flex">
            <div className="py-1"><Info className="h-5 w-5 text-blue-500 mr-3"/></div>
            <div>
              <p className="text-sm font-medium">
                Clique na bolinha para ver seu perfil ou em "Menu" para abrir a navegação!
              </p>
            </div>
            <button onClick={dismissHelper} className="ml-2 -mt-2 -mr-2 p-1 hover:bg-blue-200 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden bg-white border-t border-gray-100 shadow-lg"
        >
          <nav className="flex flex-col p-4 space-y-2">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                to={link.href} 
                className="flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium" 
                onClick={() => setIsMenuOpen(false)}
              >
                <link.icon className="w-5 h-5 mr-3" />
                {link.label}
              </Link>
            ))}
            {!isAuthenticated ? (
              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}><LogIn className="mr-2 h-4 w-4" /> Entrar</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}><UserPlus className="mr-2 h-4 w-4" /> Cadastrar</Link>
                </Button>
              </div>
            ) : (
                <div className="pt-4 border-t border-gray-100">
                     <Button 
                        variant="destructive" 
                        className="w-full justify-start" 
                        onClick={handleSignOut}
                     >
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                     </Button>
                </div>
            )}
          </nav>
        </motion.div>
      )}
    </header>
  );
};

export default Header;