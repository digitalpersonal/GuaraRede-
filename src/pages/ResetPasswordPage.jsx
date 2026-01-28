import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Eye, EyeOff, Lock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    
    const ResetPasswordPage = () => {
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [loading, setLoading] = useState(false);
      const [token, setToken] = useState(null);
      const [checkingToken, setCheckingToken] = useState(true);
      const navigate = useNavigate();
    
      useEffect(() => {
        const hash = window.location.hash;
        if (!hash.includes('type=recovery')) {
            setCheckingToken(false);
            return;
        }
    
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            if (session?.access_token) {
              setToken(session.access_token);
              // We don't need the subscription anymore
              subscription.unsubscribe();
            }
            setCheckingToken(false);
          }
        });
    
        // In case the event doesn't fire, check for the token manually after a short delay
        const timer = setTimeout(() => {
            if (checkingToken) {
                setCheckingToken(false);
            }
        }, 3000);
    
        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      }, [checkingToken]);
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
          toast({
            variant: 'destructive',
            title: 'As senhas não coincidem',
            description: 'Por favor, verifique e tente novamente.',
          });
          return;
        }
        if (password.length < 6) {
          toast({
            variant: 'destructive',
            title: 'Senha muito curta',
            description: 'A senha deve ter pelo menos 6 caracteres.',
          });
          return;
        }
    
        setLoading(true);
        try {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          await supabase.auth.signOut(); // Ensure any temporary session is cleared
          toast({
            title: 'Senha atualizada com sucesso!',
            description: 'Você já pode fazer login com sua nova senha.',
          });
          navigate('/login');
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Erro ao atualizar senha',
            description: error.message,
          });
        } finally {
          setLoading(false);
        }
      };
    
      if (checkingToken) {
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Verificando link de recuperação...</p>
            </div>
          </div>
        );
      }
    
      if (!token) {
         return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-sm">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-800">Link Inválido ou Expirado</h1>
                <p className="text-gray-600 mt-2">Não foi possível verificar seu link. Por favor, solicite um novo link de recuperação de senha.</p>
                <Button onClick={() => navigate('/login')} className="mt-6 w-full">Voltar para Login</Button>
            </div>
          </div>
        );
      }
    
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
          >
            <div className="text-center mb-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800">Redefinir sua Senha</h1>
              <p className="text-gray-600 mt-2">Crie uma nova senha para sua conta.</p>
            </div>
    
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Nova senha"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Confirme a nova senha"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
    
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </Button>
            </form>
          </motion.div>
        </div>
      );
    };
    
    export default ResetPasswordPage;