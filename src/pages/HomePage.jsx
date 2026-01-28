import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ShoppingBag, ArrowRight, Newspaper, PlusCircle, Sparkles, Image as ImageIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import CreatePost from '@/components/CreatePost';
import { supabase } from '@/lib/customSupabaseClient';
import OptimizedImage from '@/components/OptimizedImage';
import PostMedia from '@/components/PostMedia';
import { getShareUrl } from '@/lib/utils';
import PullToRefresh from '@/components/PullToRefresh';

const LoadingPlaceholder = React.memo(({ className }) => (
  <div className={`relative overflow-hidden rounded-xl shadow-lg bg-gray-200 animate-pulse ${className}`}>
    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
      <ImageIcon className="w-12 h-12 text-white/50" />
    </div>
  </div>
));
LoadingPlaceholder.displayName = 'LoadingPlaceholder';

const BannerCarousel = React.memo(({ images, className, loading, resizeMode = 'cover' }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images]);

  if (loading) {
    return <LoadingPlaceholder className={className} />;
  }

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-2xl bg-gray-100 ${className}`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <a href={images[index].link_url || '#'} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
            <OptimizedImage 
              alt={images[index].title} 
              className="w-full h-full" 
              src={images[index].image_url}
              width={800}
              height={400}
              quality={90}
              resize={resizeMode}
            />
          </a>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
BannerCarousel.displayName = 'BannerCarousel';

const HomePage = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [feedPosts, setFeedPosts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState({
    posts: true,
    companies: true,
    products: true,
    banners: true,
  });
  const navigate = useNavigate();

  const fetchData = useCallback(async (cachePolicy = 'default') => {
    const fetchWithCache = async (key, queryFn, ttl = 300000) => { // 5 min default TTL
      const cacheKey = `home_${key}`;
      if (cachePolicy === 'default') {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < ttl) {
            return parsed.data;
          }
        }
      }

      const data = await queryFn();
      sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    };

    try {
      // Banners
      fetchWithCache('banners', () => supabase.rpc('get_random_banners', { limit_count: 15 }).then(res => res.data))
        .then(data => {
          setBanners(data || []);
          setLoading(prev => ({ ...prev, banners: false }));
        });

      // Posts
      fetchWithCache('posts', async () => {
        let query = supabase
          .from('posts')
          .select('id, content, image_url, media_urls, video_url, likes_count, comments_count, created_at, profiles(name, avatar_url, user_id)');
        
        if (user?.user_id) {
          query = query.select('*, profiles(*), post_likes!left(user_id)');
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        
        return data.map(post => ({
          ...post,
          user_has_liked: user ? post.post_likes?.some(like => like.user_id === user.user_id) : false,
          likes_count: post.likes_count || 0,
           // Fallback logic
          media_urls: (post.media_urls && post.media_urls.length > 0) ? post.media_urls : (post.image_url ? [post.image_url] : [])
        }));
      }).then(data => {
        setFeedPosts(data || []);
        setLoading(prev => ({ ...prev, posts: false }));
      });


      // Companies
      fetchWithCache('companies', () => supabase.rpc('get_random_companies', { limit_count: 10 }).then(res => res.data))
        .then(data => {
          setCompanies(data || []);
          setLoading(prev => ({ ...prev, companies: false }));
        });

      // Products
      fetchWithCache('products', () => supabase.from('products').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(10).then(res => res.data))
        .then(data => {
          setProducts(data || []);
          setLoading(prev => ({ ...prev, products: false }));
        });

    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao carregar dados", description: error.message });
      // Set all loading to false on error to avoid infinite loading state
      setLoading({ posts: false, companies: false, products: false, banners: false });
    }
  }, [toast, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler specifically for PullToRefresh - bypasses cache
  const handleRefresh = useCallback(async () => {
    await fetchData('reload');
    toast({
      title: "Atualizado",
      description: "O feed foi atualizado com sucesso.",
      duration: 2000
    });
  }, [fetchData, toast]);

  const handleNewPost = useCallback((newPost) => {
    const processedNewPost = {
         ...newPost, 
         post_likes: [], 
         user_has_liked: false, 
         comments_count: 0, 
         likes_count: 0,
         media_urls: (newPost.media_urls && newPost.media_urls.length > 0) ? newPost.media_urls : (newPost.image_url ? [newPost.image_url] : [])
    };
    setFeedPosts(prevPosts => [processedNewPost, ...prevPosts]);
    sessionStorage.removeItem('home_posts');
  }, []);

  const handleLikeToggle = useCallback(async (postId) => {
    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Você precisa estar logado para curtir um post.", variant: "destructive" });
      return;
    }

    const postIndex = feedPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = feedPosts[postIndex];
    const currentlyLiked = post.user_has_liked;

    const optimisticPosts = [...feedPosts];
    optimisticPosts[postIndex] = {
      ...post,
      user_has_liked: !currentlyLiked,
      likes_count: currentlyLiked ? (post.likes_count || 1) - 1 : (post.likes_count || 0) + 1,
    };
    setFeedPosts(optimisticPosts);

    try {
      if (currentlyLiked) {
        await supabase.from('post_likes').delete().match({ user_id: user.user_id, post_id: postId });
      } else {
        await supabase.from('post_likes').insert({ user_id: user.user_id, post_id: postId });
      }
      sessionStorage.removeItem('home_posts');
    } catch (error) {
      setFeedPosts(feedPosts); // Revert on error
      toast({ title: "Erro ao curtir", description: "Não foi possível atualizar sua curtida.", variant: "destructive" });
    }
  }, [isAuthenticated, user, toast, feedPosts]);

  const handleSharePost = useCallback(async (post) => {
    const shareUrl = getShareUrl(post.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Veja este post na RedeGuara!`,
          text: post.content.substring(0, 100) + '...',
          url: shareUrl,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copiado!",
        description: "O link do post foi copiado para sua área de transferência.",
      });
    }
  }, [toast]);

  const handleWhatsAppContact = (item, type) => {
    const phone = item.whatsapp_number;
    if (!phone) {
      toast({
        variant: "destructive",
        title: "Vendedor sem contato",
        description: "O vendedor não cadastrou um número de telefone.",
      });
      return;
    }
    const message = encodeURIComponent(`Olá! Vi seu ${type === 'product' ? 'produto' : 'anúncio'} "${item.name}" na RedeGuara e gostaria de mais informações.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const { topBanners, intermediateBanners } = useMemo(() => {
    return {
      topBanners: banners.filter(b => b.position === 'topo' && b.is_active),
      intermediateBanners: banners.filter(b => b.position === 'intermediario' && b.is_active),
    };
  }, [banners]);

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

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <BannerCarousel images={topBanners} loading={loading.banners} className="h-64 md:h-96 w-full mb-12" resizeMode="contain" />

          {!isAuthenticated && !loading.posts && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r-lg mb-12" 
              role="alert"
            >
              <div className="flex">
                <div className="py-1"><Info className="h-5 w-5 text-blue-500 mr-3" /></div>
                <div>
                  <p className="font-bold">Bem-vindo à RedeGuara!</p>
                  <p className="text-sm">Você pode visualizar todo o site, mas para interagir e postar, <Link to="/register" className="font-semibold underline hover:text-blue-800">cadastre-se</Link> ou <Link to="/login" className="font-semibold underline hover:text-blue-800">faça login</Link>.</p>
                </div>
              </div>
            </motion.div>
          )}

          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center"><Newspaper className="mr-3 text-blue-500" /> Feed de Notícias</h2>
            
            {isAuthenticated && <CreatePost onNewPost={handleNewPost} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {loading.posts ? Array.from({ length: 4 }).map((_, i) => (
                <LoadingPlaceholder key={i} className="h-80" />
              )) : feedPosts.map((post, index) => (
                <motion.div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex items-center mb-3">
                      <Link to={`/profile/${post.profiles?.user_id}`} className="flex items-center">
                        <div className="w-10 h-10 rounded-full mr-3 bg-gray-200 overflow-hidden">
                          <OptimizedImage alt={post.profiles?.name || 'Usuário'} className="w-full h-full object-cover" src={post.profiles?.avatar_url} width={40} height={40} />
                        </div>
                        <span className="font-semibold hover:underline">{post.profiles?.name || 'Usuário'}</span>
                      </Link>
                    </div>
                    
                    {/* Media Preview (Optimized with feedMode for container sizing) */}
                    <div className="w-full">
                        <PostMedia 
                            mediaUrls={post.media_urls} 
                            videoUrl={post.video_url} 
                            feedMode={true} 
                        />
                    </div>

                    <p className="text-gray-700 text-sm mb-3 mt-2 flex-grow">
                      {post.content.length > 150 ? (
                        <>
                          {post.content.substring(0, 150)}...{' '}
                          <Link to={`/post/${post.id}`} className="text-blue-600 hover:underline font-medium">
                            Leia mais
                          </Link>
                        </>
                      ) : (
                        post.content
                      )}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white border-t border-gray-100 mt-auto">
                    <div className="flex justify-between items-center text-gray-500">
                      <div className="flex gap-4">
                        <button onClick={() => handleLikeToggle(post.id)} className={`flex items-center gap-1 hover:text-red-500 transition-colors ${post.user_has_liked ? 'text-red-500' : ''}`}>
                          <Heart size={16} fill={post.user_has_liked ? 'currentColor' : 'none'} /> {post.likes_count || 0}
                        </button>
                        <Link to={`/post/${post.id}`} className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                          <MessageCircle size={16} /> {post.comments_count || 0}
                        </Link>
                        <button onClick={() => handleSharePost(post)} className="flex items-center gap-1 hover:text-green-500 transition-colors"><Share2 size={16} /></button>
                      </div>
                      <Link to={`/post/${post.id}`} className="text-sm font-medium text-blue-600 hover:underline">Ver Post</Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/feed">
                <Button className="flex items-center gap-2">
                  Ver Mais Posts <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </section>

          <BannerCarousel images={intermediateBanners} loading={loading.banners} className="h-40 md:h-56 w-full mb-16" resizeMode="cover" />

          <section id="guia-comercial" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center"><Sparkles className="mr-3 text-yellow-500" /> Guia Comercial</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading.companies ? Array.from({ length: 4 }).map((_, i) => (
                <LoadingPlaceholder key={i} className="h-40" />
              )) : companies.length > 0 ? companies.map((company, index) => (
                <motion.div 
                  key={company.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.1 }} 
                  className={`bg-gradient-to-br ${companyCardColors[index % companyCardColors.length]} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group`}
                >
                  <Link to={`/company/${company.id}`} className="block p-4 h-full flex flex-col">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full mr-3 bg-white/50 p-1 overflow-hidden flex-shrink-0 shadow-md">
                        <OptimizedImage alt={company.name} className="w-full h-full object-contain rounded-full bg-white" src={company.logo_url} width={48} height={48} resize="contain" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{company.name}</h3>
                        <p className="text-xs text-gray-600 font-medium">{company.category}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2 flex-grow">{company.description}</p>
                    <div className="flex justify-end items-center text-blue-700 font-semibold text-xs mt-auto">
                      Ver mais <ArrowRight className="ml-1 w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              )) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600 text-lg">Nenhuma empresa encontrada no Guia Comercial ainda. Seja o primeiro a cadastrar!</p>
                  <Link to="/register" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                    Cadastre sua Empresa
                  </Link>
                </div>
              )}
            </div>
            <div className="text-center mt-8">
              <Link to="/guia-comercial">
                <Button className="flex items-center gap-2">
                  Ver Mais Empresas <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold flex items-center"><ShoppingBag className="mr-3 text-purple-500" /> Vitrine Marketplace</h2>
              {isAuthenticated && (user.plan_type === 'prata' || user.plan_type === 'ouro') && (
                <Link to="/my-products">
                  <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
                    <PlusCircle size={18} />
                    Meus Produtos
                  </Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {loading.products ? Array.from({ length: 5 }).map((_, i) => (
                <LoadingPlaceholder key={i} className="h-56" />
              )) : products.map((product, index) => (
                <motion.div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden group" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                  <div className="h-40 bg-gray-200 overflow-hidden relative">
                    <OptimizedImage alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src={product.image_url} width={300} height={200} />
                    <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-green-600 font-bold text-sm px-2 py-1 rounded-full">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate text-sm mb-2">{product.name}</h3>
                    <Button onClick={() => handleWhatsAppContact(product, 'product')} size="sm" className="w-full bg-green-500 hover:bg-green-600">Contatar Vendedor</Button>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/marketplace">
                <Button className="flex items-center gap-2">
                  Ver Mais Produtos <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default HomePage;