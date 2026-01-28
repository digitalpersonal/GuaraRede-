import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(identifier, password);

      if (error) {
        throw error;
      }

      toast({
        title: "Login bem-sucedido!",
        description: "Bem-vindo de volta!",
      });
      navigate('/');

    } catch (error) {
      let errorTitle = "Erro no login";
      let errorMessage = error.message || "Usuário ou senha inválidos.";
      
      if (error.message.includes("Email not confirmed")) {
        errorTitle = "Confirmação Pendente";
        errorMessage = "ACESSE SUA CAIXA DE EMAIL E CONFIRME SEU CADASTRO";
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: 'Link enviado!',
        description: 'Verifique seu e-mail para redefinir sua senha.',
      });
      setIsForgotPassword(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar e-mail',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {isForgotPassword ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Recuperar Senha</h1>
              <p className="text-gray-600 mt-2">Insira seu e-mail para receber o link de recuperação.</p>
            </div>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Seu e-mail de cadastro"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => setIsForgotPassword(false)} className="text-blue-600 hover:text-blue-700 font-medium">
                Voltar para o login
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Acesse sua Conta</h1>
              <p className="text-gray-600 mt-2">Bem-vindo de volta à RedeGuara!</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Email ou Usuário"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Sua senha"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right">
                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm text-blue-600 hover:underline">
                  Esqueci minha senha
                </button>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </>
        )}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center mx-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;