import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const plans = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    priceSuffix: '',
    description: 'Para interagir, curtir, comentar, criar grupos e comprar.',
    features: [
      'Posts (não comerciais)',
      'Curtir e comentar em tudo',
      'Criar e participar de grupos',
      'Comprar no Marketplace',
    ],
    color: 'text-green-600 bg-green-100 border-green-200',
    buttonText: 'Comece Agora',
  },
  {
    name: 'Bronze',
    price: 'R$ 60',
    priceSuffix: '/mês',
    description: 'Para ter sua empresa no guia e fazer posts publicitários.',
    features: [
      'Tudo do plano Grátis',
      'Cadastro no Guia de Empresas',
      '2 posts publicitários por semana',
      'Selo de verificação Bronze',
    ],
    color: 'text-orange-600 bg-orange-100 border-orange-200',
    buttonText: 'Assinar Bronze',
  },
  {
    name: 'Prata',
    price: 'R$ 150',
    priceSuffix: '/mês',
    description: 'Mais visibilidade com banners e mais anúncios.',
    features: [
      'Tudo do plano Bronze',
      'Banner publicitário intermediário',
      '2 posts publicitários por dia',
      '2 produtos à venda por dia',
      'Selo de verificação Prata',
    ],
    color: 'text-gray-600 bg-gray-100 border-gray-200',
    buttonText: 'Assinar Prata',
    isFeatured: true,
  },
  {
    name: 'Ouro',
    price: 'R$ 300',
    priceSuffix: '/mês',
    description: 'Visibilidade máxima, sem limites para seu negócio.',
    features: [
      'Tudo do plano Prata',
      'Banner publicitário no topo',
      'Postagens e produtos ilimitados',
      'Suporte prioritário',
      'Selo de verificação Ouro',
    ],
    color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
    buttonText: 'Assinar Ouro',
  },
  {
    name: 'Praça de Alimentação',
    price: 'Negociar',
    priceSuffix: '',
    description: 'Destaque seu restaurante ou lanchonete na nossa praça de alimentação.',
    features: [
      'Tudo do plano Ouro',
      'Destaque na seção Praça de Alimentação',
      'Cardápio digital integrado',
      'Sistema de pedidos 100% automatizado - GUARAFOOD',
    ],
    color: 'text-red-600 bg-red-100 border-red-200',
    buttonText: 'Negociar Plano',
    icon: Utensils,
    guarafoodLink: 'https://www.guarafood.com.br', // Added GuaraFood link
  },
];

const PlansPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubscription = (planName) => {
    if (planName === 'Grátis') {
      navigate('/register');
      return;
    }
    
    // For "Praça de Alimentação" plan, the primary action is to navigate to the GuaraFood link
    // or initiate a WhatsApp conversation as before for other paid plans.
    // The GuaraFood link will be a separate button.
    const whatsappNumber = "5535991048020";
    const message = encodeURIComponent(`Olá, gostaria de saber mais sobre o plano ${planName} da RedeGuara.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-3">
            Escolha o Plano Perfeito para Você
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Seja você um usuário casual, um empreendedor ou uma empresa, temos um plano que se encaixa nas suas necessidades.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-screen-xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'rounded-xl border p-6 flex flex-col bg-white shadow-lg relative',
                plan.color,
                plan.isFeatured ? 'border-blue-500 border-2 transform md:scale-105' : 'hover:shadow-2xl hover:-translate-y-1 transition-all'
              )}
            >
              {plan.isFeatured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Recomendado
                </div>
              )}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                {plan.icon && <plan.icon className="w-6 h-6" />}
              </div>
              <p className="text-sm mt-1 h-12">{plan.description}</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                {plan.priceSuffix && <span className="text-lg font-medium">{plan.priceSuffix}</span>}
              </div>
              <ul className="space-y-3 text-sm flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscription(plan.name)}
                className={cn(
                  'w-full mt-8 text-white font-bold',
                  plan.isFeatured ? 'bg-blue-500 hover:bg-blue-600' : 
                  plan.name === 'Grátis' ? 'bg-green-500 hover:bg-green-600' :
                  plan.name === 'Bronze' ? 'bg-orange-500 hover:bg-orange-600' :
                  plan.name === 'Ouro' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  plan.name === 'Praça de Alimentação' ? 'bg-red-500 hover:bg-red-600' :
                  'bg-gray-700 hover:bg-gray-800'
                )}
              >
                {plan.buttonText}
              </Button>
              {plan.guarafoodLink && (
                <Button asChild className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold">
                  <a href={plan.guarafoodLink} target="_blank" rel="noopener noreferrer">
                    Visitar GuaraFood
                  </a>
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center mx-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;