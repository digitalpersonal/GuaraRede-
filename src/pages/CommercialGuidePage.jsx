import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Search, ArrowLeft, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import OptimizedImage from '@/components/OptimizedImage';

const CommercialGuidePage = () => {
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const navigate = useNavigate();

  const companyCardColors = useMemo(() => [
    'from-blue-100 to-cyan-100',
    'from-green-100 to-emerald-100',
    'from-yellow-100 to-amber-100',
    'from-purple-100 to-violet-100',
    'from-pink-100 to-rose-100',
    'from-orange-100 to-red-100',
    'from-teal-100 to-cyan-100',
    'from-lime-100 to-green-100',
  ], []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*, categories(id, name)')
          .eq('status', 'approved');

        if (companiesError) throw companiesError;

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) throw categoriesError;

        setCompanies(companiesData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar o guia comercial",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || company.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [companies, searchTerm, selectedCategory]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setIsCategoryFilterOpen(false);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sem Categoria';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <Building2 className="w-10 h-10 mr-3 text-blue-500" />
            Guia Comercial
          </h1>
          <p className="text-lg text-gray-600">Encontre as melhores empresas e serviços de Guaranésia.</p>
        </motion.div>

        <div className="sticky top-20 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nome da empresa..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-auto">
            <Button
              variant="outline"
              className="w-full md:w-56 flex justify-between items-center"
              onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
            >
              <span>{selectedCategory ? getCategoryName(selectedCategory) : 'Todas as Categorias'}</span>
              {isCategoryFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isCategoryFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 w-full md:w-56 bg-white rounded-md shadow-lg border z-20 max-h-60 overflow-y-auto"
              >
                <Button variant="ghost" className="w-full text-left justify-start" onClick={() => handleCategorySelect(null)}>Todas as Categorias</Button>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    className="w-full text-left justify-start"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p>Carregando empresas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`bg-gradient-to-br ${companyCardColors[index % companyCardColors.length]} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group`}
              >
                <Link to={`/company/${company.id}`} className="block p-4 h-full flex flex-col">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 rounded-full mr-3 bg-white/50 p-1 overflow-hidden flex-shrink-0 shadow-md">
                      <OptimizedImage alt={company.name} className="w-full h-full object-contain rounded-full bg-white" src={company.logo_url} width={48} height={48} resize="contain" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{company.name}</h3>
                      <p className="text-xs text-gray-600 font-medium">{company.categories?.name || 'Sem Categoria'}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2 flex-grow">{company.description}</p>
                  <div className="flex justify-end items-center text-blue-700 font-semibold text-xs mt-auto">
                    Ver mais <ArrowRight className="ml-1 w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
            {filteredCompanies.length === 0 && (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-600">Nenhuma empresa encontrada com os filtros selecionados.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center mx-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommercialGuidePage;