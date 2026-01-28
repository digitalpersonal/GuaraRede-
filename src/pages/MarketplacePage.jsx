import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MessageSquare, Star, Tag, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import OptimizedImage from '@/components/OptimizedImage';

const MarketplacePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const fetchProductsAndCategories = useCallback(async () => {
    setLoading(true);
    try {
      let productQuery = supabase
        .from('products')
        .select('*, companies(name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        productQuery = productQuery.ilike('name', `%${searchTerm}%`);
      }
      if (selectedCategory !== 'all') {
        productQuery = productQuery.eq('category', selectedCategory);
      }

      const { data: productsData, error: productsError } = await productQuery;
      if (productsError) throw productsError;
      setProducts(productsData || []);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);
      
      if (categoriesError) throw categoriesError;
      
      const uniqueCategories = [...new Set(categoriesData.map(p => p.category).filter(Boolean))];
      const categoryObjects = uniqueCategories.map(cat => ({ id: cat, name: cat }));
      setCategories([{ id: 'all', name: 'Todos' }, ...categoryObjects]);

    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao buscar produtos", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  const handleWhatsAppContact = (product) => {
    if (!product.whatsapp_number) {
      toast({ title: "Contato indisponível", description: "Este produto não possui um número de WhatsApp cadastrado.", variant: "destructive" });
      return;
    }
    const message = `Olá! Vi o produto "${product.name}" no Marketplace da RedeGuara e tenho interesse.`;
    window.open(`https://wa.me/${product.whatsapp_number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleFeatureClick = () => {
    toast({
      title: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-500">
              Marketplace RedeGuara
            </span>
          </h1>
          <p className="text-lg text-gray-600">Compre e venda localmente. Fortaleça nossa comunidade!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg p-6 mb-8 sticky top-24 z-40"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="O que você está procurando?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
            </div>
            <Button onClick={handleFeatureClick} variant="outline" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filtros Avançados</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {loading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md h-80 animate-pulse"></div>
          )) : products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden group flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-56 bg-gray-100 overflow-hidden relative">
                <OptimizedImage alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src={product.image_url} width={400} height={300} />
                <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-blue-600 font-bold text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Tag size={12} /> {product.category || 'Geral'}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-gray-800 text-md mb-2 line-clamp-2 flex-grow">{product.name}</h3>
                
                <p className="text-xs text-gray-500 mb-3">Vendido por: <span className="font-semibold">{product.companies?.name || 'Vendedor Local'}</span></p>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-green-600 font-extrabold text-xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</p>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star size={16} className="fill-current" />
                    <span className="text-sm font-bold text-gray-600">4.5</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleWhatsAppContact(product)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center space-x-2 mt-auto"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Contatar Vendedor</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600 mb-6">Que tal tentar uma nova busca ou explorar outra categoria?</p>
              <Button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                Limpar Filtros e Recomeçar
              </Button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-10 text-white text-center shadow-2xl"
        >
          <h2 className="text-3xl font-bold mb-4">Você é um comerciante local?</h2>
          <p className="mb-6 max-w-2xl mx-auto">Faça parte da nossa vitrine digital! Cadastre sua empresa e anuncie seus produtos para toda Guaranésia.</p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-8 py-3">
              Venda Também
            </Button>
          </Link>
        </motion.div>
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center mx-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;