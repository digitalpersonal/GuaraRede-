import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Newspaper, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import CreatePost from '@/components/CreatePost';
import { supabase } from '@/lib/customSupabaseClient';
import OptimizedImage from '@/components/OptimizedImage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ShareMenu from '@/components/ShareMenu';
import PostMedia from '@/components/PostMedia';
import { getShareUrl, getSocialShareUrl } from '@/lib/utils';

const POSTS_PER_PAGE = 10;

const FeedPage = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [postToShare, setPostToShare] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const observer = useRef();
  const navigate = useNavigate();

  const fetchPosts = useCallback(async (currentPage) => {
    if (currentPage === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const from = currentPage * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(name, avatar_url), post_likes(user_id)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const processedPosts = data.map(post => ({
        ...post,
        user_has_liked: user ? post.post_likes.some(like => like.user_id === user.user_id) : false,
        likes_count: post.post_likes.length,
        comments_count: post.comments_count || 0,
        // Fallback if media_urls is empty but image_url exists (legacy support)
        media_urls: (post.media_urls && post.media_urls.length > 0) ? post.media_urls : (post.image_url ? [post.image_url] : [])
      }));

      setPosts(prev => currentPage === 0 ? processedPosts : [...prev, ...processedPosts]);
      setHasMore(data.length === POSTS_PER_PAGE);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao carregar posts", description: error.message });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  const lastPostElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    if (page > 0) {
      fetchPosts(page);
    }
  }, [page, fetchPosts]);

  const handleNewPost = (newPost) => {
    const processedNewPost = {
         ...newPost, 
         post_likes: [], 
         user_has_liked: false, 
         comments_count: 0,
         media_urls: (newPost.media_urls && newPost.media_urls.length > 0) ? newPost.media_urls : (newPost.image_url ? [newPost.image_url] : [])
    };
    setPosts(prevPosts => [processedNewPost, ...prevPosts]);
  };

  const handleLikeToggle = async (postId) => {
    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Você precisa estar logado para curtir.", variant: "destructive" });
      return;
    }

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const currentlyLiked = post.user_has_liked;

    const updatedPosts = [...posts];
    updatedPosts[postIndex] = {
      ...post,
      user_has_liked: !currentlyLiked,
      likes_count: currentlyLiked ? post.likes_count - 1 : post.likes_count + 1,
    };
    setPosts(updatedPosts);

    try {
      if (currentlyLiked) {
        await supabase.from('post_likes').delete().match({ user_id: user.user_id, post_id: postId });
      } else {
        await supabase.from('post_likes').insert({ user_id: user.user_id, post_id: postId });
      }
    } catch (error) {
      setPosts(posts);
      toast({ title: "Erro ao curtir", variant: "destructive" });
    }
  };

  const handleSharePost = async (post) => {
    // If we have native share, use it with the WhatsApp friendly URL logic
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.profiles?.name || 'RedeGuara'}`,
          text: post.content ? post.content.substring(0, 100) : 'Confira este post',
          url: getSocialShareUrl(post.id), // Use crawler friendly URL
        });
      } catch (error) {
         setPostToShare(post);
         setShowShareMenu(true);
      }
    } else {
      setPostToShare(post);
      setShowShareMenu(true);
    }
  };

  return (
    <>
      <div className="bg-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-4xl font-bold mb-8 flex items-center text-gray-800">
            <Newspaper className="mr-4 text-blue-500" />
            Feed de Notícias
          </h1>

          {isAuthenticated && <CreatePost onNewPost={handleNewPost} />}

          <div className="space-y-6 mt-8">
            {loading && posts.length === 0 ? (
              <div className="text-center py-10">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
                <p className="mt-2 text-gray-600">Carregando publicações...</p>
              </div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  ref={posts.length === index + 1 ? lastPostElementRef : null}
                  key={post.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-5">
                    <div className="flex items-center mb-4">
                      <Link to={`/profile/${post.user_id}`}>
                        <OptimizedImage
                          alt={post.profiles?.name || 'Usuário'}
                          className="w-12 h-12 rounded-full mr-4 bg-gray-200"
                          src={post.profiles?.avatar_url}
                          width={48}
                          height={48}
                          resize="cover"
                        />
                      </Link>
                      <div>
                        <Link to={`/profile/${post.user_id}`} className="font-bold text-gray-800 hover:underline">{post.profiles?.name || 'Usuário'}</Link>
                        <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    
                    {/* Media Display (Optimized with feedMode) */}
                    <PostMedia 
                        mediaUrls={post.media_urls} 
                        videoUrl={post.video_url} 
                        feedMode={true} 
                    />

                    <div className="text-gray-700 mb-2">
                      <MarkdownRenderer content={post.content} />
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-gray-500">
                      <div className="flex gap-5">
                        <button onClick={() => handleLikeToggle(post.id)} className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${post.user_has_liked ? 'text-red-500' : ''}`}>
                          <Heart size={20} fill={post.user_has_liked ? 'currentColor' : 'none'} />
                          <span className="font-medium text-sm">{post.likes_count || 0}</span>
                        </button>
                        <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                          <MessageCircle size={20} />
                          <span className="font-medium text-sm">{post.comments_count || 0}</span>
                        </Link>
                        <button onClick={() => handleSharePost(post)} className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
                          <Share2 size={20} />
                        </button>
                      </div>
                      <Link to={`/post/${post.id}`}>
                        <Button variant="ghost" size="sm">Ver Post</Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {loadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}
            {!loading && !hasMore && posts.length > 0 && (
              <p className="text-center text-gray-500 py-6">Você chegou ao fim do feed! 🎉</p>
            )}
             {!loading && posts.length === 0 && (
              <p className="text-center text-gray-500 py-10">Ainda não há publicações. Que tal ser o primeiro a postar algo?</p>
            )}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center mx-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </div>
        </div>
      </div>
      <ShareMenu open={showShareMenu} onOpenChange={setShowShareMenu} post={postToShare} />
    </>
  );
};

export default FeedPage;