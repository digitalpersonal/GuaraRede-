import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft, CheckCircle, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    features: ['Posts (não comerciais)', 'Curtir e comentar', 'Criar grupos e comprar'],
    color: 'text-green-600 bg-green-100 border-green-200',
  },
  {
    name: 'Bronze',
    price: 'R$ 60/mês',
    features: ['Tudo do Grátis', 'Página de empresa', '2 posts publicitários/semana'],
    color: 'text-orange-600 bg-orange-100 border-orange-200',
  },
  {
    name: 'Prata',
    price: 'R$ 150/mês',
    features: ['Tudo do Bronze', 'Banner intermediário', '2 posts e 2 produtos/dia'],
    color: 'text-gray-600 bg-gray-100 border-gray-200',
  },
  {
    name: 'Ouro',
    price: 'R$ 300/mês',
    features: ['Tudo do Prata', 'Banner no topo', 'Posts e produtos ilimitados'],
    color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
  },
];

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { name, email, password } = formData;

    if (!name || !email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
      });
      setLoading(false);
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        variant: "destructive",
        title: "Email inválido",
        description: "Por favor, insira um endereço de email válido.",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(
        email,
        password,
        {
          data: { name, user_type: 'user', plan_type: 'gratis' }
        }
      );

      if (error) throw error;

      // Verifica se precisa confirmar email (session será null)
      if (data?.user && !data?.session) {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar sua conta antes de entrar.",
          duration: 6000,
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Sua conta foi criada com sucesso! Bem-vindo à RedeGuara!",
          duration: 5000,
        });
      }
      
      // Redireciona para o login
      navigate('/login');

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
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
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl"
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-center md:text-left mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Crie sua Conta</h1>
              <p className="text-gray-600 mt-2">Junte-se à comunidade RedeGuara!</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
              <div className="flex">
                <div className="py-1"><Info className="h-5 w-5 text-blue-500 mr-3"/></div>
                <div>
                  <p className="font-bold text-blue-800">Bem-vindo à RedeGuara!</p>
                  <p className="text-sm text-blue-700">Todos podem se cadastrar e participar. O cadastro é necessário para garantir a segurança e permitir interações.</p>
                </div>
              </div>
              <div className="flex mt-2">
                <div className="py-1"><ShieldCheck className="h-5 w-5 text-blue-500 mr-3"/></div>
                <div>
                   <p className="text-sm text-blue-700">Crie uma senha forte para proteger sua conta.</p>
                </div>
              </div>
            </div>

            {/* Formulário de Cadastro */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField icon={User} name="name" placeholder="Seu nome ou nome da empresa" value={formData.name} onChange={handleChange} required />
              <FormField icon={Mail} name="email" type="email" placeholder="Seu melhor email" value={formData.email} onChange={handleChange} required />
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Crie uma senha forte"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Ao se cadastrar, você concorda com nossos <Link to="/terms" className="underline">Termos de Serviço</Link> e <Link to="/privacy" className="underline">Política de Privacidade</Link>.
              </p>

              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Cadastrando...' : 'Criar Conta Grátis'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Nossos Planos</h2>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.name} className={cn('rounded-lg border p-4 flex flex-col', plan.color)}>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xl font-semibold my-2">{plan.price}</p>
                  <ul className="space-y-2 text-sm flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link to="/plans" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Ver detalhes dos planos
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center mx-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const FormField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      {...props}
      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    />
  </div>
);

export default RegisterPage;