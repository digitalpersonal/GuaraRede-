import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signIn = useCallback(async (email, password) => {
    // Retorna a promessa diretamente para que o componente possa tratar o erro/sucesso
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }, []);

  const signUp = useCallback(async (email, password, options = {}) => {
    return await supabase.auth.signUp({
      email,
      password,
      options,
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Tenta fazer o logout no servidor
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro ao fazer logout no Supabase:", error);
      }
    } catch (err) {
      console.error("Exceção ao fazer logout:", err);
    } finally {
      // CRÍTICO: Sempre limpa o estado local, independentemente do erro da API/Rede
      // Isso garante que a UI atualize para o estado "deslogado" imediatamente
      setUser(null);
      setIsAuthenticated(false);
      
      // Opcional: limpar dados armazenados localmente se houver
      // localStorage.removeItem('sb-token'); 
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Tenta obter a sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            // Busca perfil detalhado para ter nome, avatar, etc.
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            // Mescla dados da sessão (auth) com dados do perfil (public)
            setUser(profile ? { ...session.user, ...profile } : session.user);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Erro na inicialização da autenticação:", error);
        if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listener para mudanças de estado em tempo real (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Ao logar, busca o perfil novamente para garantir dados frescos
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        setUser(profile ? { ...session.user, ...profile } : session.user);
        setIsAuthenticated(true);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        // Garante limpeza no evento de logout
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};