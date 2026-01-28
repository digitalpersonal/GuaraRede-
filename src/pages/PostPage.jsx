import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Loader2, Trash2, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import OptimizedImage from '@/components/OptimizedImage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import PostMedia from '@/components/PostMedia';
import { getSocialShareUrl, getWhatsAppShareUrl } from '@/lib/utils';
import ShareMenu from '@/components/ShareMenu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Facebook, Instagram, Twitter } from 'lucide-react';

// Ícone customizado para manter consistência se necessário
const TikTokIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 1 0 7.73 7.74 6.76 6.76 0 0 0 .08-1.09V8.41a8.7 8.7 0 0 0 2.8 1.46v-3.18z" />
  </svg>
);

const PostPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  
  const [showShareMenu, setShowShareMenu] = useState(false);

  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchPostAndComments = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setLoadingComments(true);
    try {
      // Buscar post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*, profiles(name, avatar_url, user_id), post_likes(user_id)')
        .eq('id', id)
        .single();

      if (postError) {
        // Se não encontrar o post (ex: erro PGROST exception ou null), lançar erro
        if (postError.code === 'PGRST116' || postError.message.includes('row')) {
           console.warn("Post não encontrado:", id);
           setPost(null);
           return; // Saída antecipada segura
        }
        throw postError;
      }

      if (!postData) {
        setPost(null);
        return;
      }

      // Processamento seguro dos dados para evitar undefined access
      const postLikes = postData.post_likes || [];
      const userHasLiked = user ? postLikes.some(like => like && like.user_id === user.user_id) : false;
      
      // Fallback para mídias (suporte legado para image_url)
      let processedMediaUrls = [];
      if (postData.media_urls && Array.isArray(postData.media_urls) && postData.media_urls.length > 0) {
        processedMediaUrls = postData.media_urls;
      } else if (postData.image_url) {
        processedMediaUrls = [postData.image_url];
      }

      const processedPost = {
        ...postData,
        user_has_liked: userHasLiked,
        likes_count: postLikes.length,
        media_urls: processedMediaUrls,
        profiles: postData.profiles || { name: 'Usuário Desconhecido', avatar_url: null, user_id: null }
      };
      
      setPost(processedPost);
      setEditingPostContent(processedPost.content || '');

      // Buscar comentários
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('*, profiles(name, avatar_url, user_id)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) {
         console.error("Erro ao carregar comentários:", commentsError);
         // Não falhar a página inteira se apenas os comentários falharem
         setComments([]);
      } else {
         setComments(commentsData || []);
      }

    } catch (error) {
      console.error("Erro crítico ao carregar post:", error);
      setPost(null);
      toast({
        variant: "destructive",
        title: "Erro ao carregar post",
        description: "Não foi possível carregar o conteúdo. Tente novamente."
      });
    } finally {
      setLoading(false);
      setLoadingComments(false);
    }
  }, [id, user, toast]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Você precisa estar logado para curtir.", variant: "destructive" });
      return;
    }
    
    if (!post) return;

    const currentlyLiked = post.user_has_liked;
    const currentLikes = post.likes_count || 0;
    const newLikesCount = currentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    
    // Otimistic update
    setPost({ ...post, user_has_liked: !currentlyLiked, likes_count: newLikesCount });

    try {
      if (currentlyLiked) {
        await supabase.from('post_likes').delete().match({ user_id: user.user_id, post_id: id });
      } else {
        await supabase.from('post_likes').insert({ user_id: user.user_id, post_id: id });
      }
    } catch (error) {
       // Revert on error
       setPost({ ...post, user_has_liked: currentlyLiked, likes_count: currentLikes });
       toast({ title: "Erro ao curtir", variant: "destructive" });
    }
  };

  const handleQuickShare = (platform) => {
    if (!post) return;
    
    const shareUrl = getSocialShareUrl(id);
    const safeName = post.profiles?.name || 'Usuário da RedeGuara';
    const postTitle = `Confira este post de ${safeName} na RedeGuara!`;
    const encodedUrl = encodeURIComponent(shareUrl);

    if (platform === 'whatsapp') {
       window.open(getWhatsAppShareUrl(post), '_blank');
    } else if (platform === 'facebook') {
       window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
    } else if (platform === 'instagram' || platform === 'tiktok') {
       navigator.clipboard.writeText(shareUrl);
       toast({
          title: "Link copiado!",
          description: `Cole o link no ${platform === 'instagram' ? 'Instagram' : 'TikTok'} para compartilhar!`,
          duration: 4000,
       });
    }
  };

  const handleSharePost = async () => {
    if (!post) return;

    const shareUrl = getSocialShareUrl(id);
    const safeName = post.profiles?.name || 'Usuário';
    const safeContent = post.content ? post.content.substring(0, 150) : 'Confira esta publicação!';

    const shareData = {
      title: `Veja este post de ${safeName} na RedeGuara!`,
      text: safeContent,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Você precisa estar logado para comentar.", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ user_id: user.user_id, post_id: id, content: newComment })
        .select('*, profiles(name, avatar_url, user_id)')
        .single();
        
      if (error) throw error;
      
      setComments([...comments, data]);
      setNewComment('');
      
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao comentar", description: error.message });
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
      if (error) throw error;
      setComments(comments.filter(c => c.id !== commentId));
      toast({ title: "Sucesso", description: "Comentário removido." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao remover comentário", description: error.message });
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentContent.trim()) return;
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .update({ content: editingCommentContent, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select('*, profiles(name, avatar_url, user_id)')
        .single();
      if (error) throw error;
      setComments(comments.map(c => c.id === commentId ? data : c));
      setEditingCommentId(null);
      setEditingCommentContent('');
      toast({ title: "Sucesso", description: "Comentário atualizado." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar comentário", description: error.message });
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPostContent.trim()) return;
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ content: editingPostContent, updated_at: new Date().toISOString() })
        .eq('id', post.id)
        .select('*, profiles(name, avatar_url, user_id), post_likes(user_id)')
        .single();

      if (error) throw error;
      
      // Reprocessar dados atualizados
      const postLikes = data.post_likes || [];
      const userHasLiked = user ? postLikes.some(like => like.user_id === user.user_id) : false;
      
      let processedMediaUrls = [];
      if (data.media_urls && Array.isArray(data.media_urls) && data.media_urls.length > 0) {
        processedMediaUrls = data.media_urls;
      } else if (data.image_url) {
        processedMediaUrls = [data.image_url];
      }

      const processedPost = {
        ...data,
        user_has_liked: userHasLiked,
        likes_count: postLikes.length,
        media_urls: processedMediaUrls,
        profiles: data.profiles || post.profiles // Manter profile anterior se por acaso falhar
      };
      
      setPost(processedPost);
      setIsEditingPost(false);
      toast({ title: "Sucesso", description: "Post atualizado." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar post", description: error.message });
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    setIsDeletingPost(true);
    try {
      // Trigger de cascade deve lidar com isso, mas por segurança:
      await supabase.from('post_comments').delete().eq('post_id', post.id);
      await supabase.from('post_likes').delete().eq('post_id', post.id);
      
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Post removido." });
      navigate('/feed');
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao remover post", description: error.message });
    } finally {
      setIsDeletingPost(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
           <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
           <p className="text-gray-500 text-sm">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center min-h-screen bg-gray-50 px-4">
        <Helmet>
          <title>Post não encontrado - RedeGuara</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <X className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Post não disponível</h2>
          <p className="text-gray-600 mb-6">O link que você acessou pode estar quebrado ou a postagem pode ter sido removida.</p>
          <Button onClick={() => navigate('/feed')} className="w-full">Voltar para o Feed</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.user_id && post.profiles?.user_id === user.user_id;
  const safeProfileName = post.profiles?.name || 'Usuário RedeGuara';
  const pageTitle = `${safeProfileName} no RedeGuara`;
  const description = post.content ? post.content.substring(0, 160).replace(/\n/g, ' ') : 'Confira esta publicação na RedeGuara.';
  
  // Garantir URL de imagem válida para metatags
  const ogImage = (post.media_urls && post.media_urls.length > 0) 
    ? post.media_urls[0] 
    : (post.profiles?.avatar_url || 'https://redeguara.com/og-default.png');
    
  const pageUrl = getSocialShareUrl(post.id);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={pageUrl} />
      </Helmet>

      <div className="bg-gray-100 min-h-screen py-4 sm:py-8">
        <div className="container mx-auto px-2 sm:px-4 max-w-3xl">
          <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4 hover:bg-white/50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          
          <motion.div
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 sm:p-6 pb-2">
              {/* Header do Post */}
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center">
                  <Link to={`/profile/${post.profiles?.user_id}`} className="flex-shrink-0">
                    <OptimizedImage
                      alt={safeProfileName}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mr-3 sm:mr-4 bg-gray-200 object-cover border border-gray-100"
                      src={post.profiles?.avatar_url}
                    />
                  </Link>
                  <div>
                    <Link to={`/profile/${post.profiles?.user_id}`} className="font-bold text-base sm:text-lg text-gray-800 hover:underline line-clamp-1">
                      {safeProfileName}
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {post.created_at ? new Date(post.created_at).toLocaleString('pt-BR') : 'Data desconhecida'}
                    </p>
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-1 sm:gap-2">
                    {isEditingPost ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={handleUpdatePost} className="h-8 w-8 sm:h-10 sm:w-10"><Save className="w-4 h-4 text-green-500" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditingPost(false)} className="h-8 w-8 sm:h-10 sm:w-10"><X className="w-4 h-4 text-gray-500" /></Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditingPost(true)} className="h-8 w-8 sm:h-10 sm:w-10"><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="h-8 w-8 sm:h-10 sm:w-10"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Conteúdo Visual - Updated implementation for full visibility */}
              <div className="w-full">
                <PostMedia 
                   mediaUrls={post.media_urls || []} 
                   videoUrl={post.video_url} 
                   // Explicitly false for detail view to allow larger size
                   feedMode={false}
                />
              </div>

              {/* Texto do Post */}
              {isEditingPost ? (
                <Textarea 
                  value={editingPostContent}
                  onChange={(e) => setEditingPostContent(e.target.value)}
                  className="text-gray-800 text-base sm:text-lg mt-4 min-h-[150px]"
                />
              ) : (
                <div className="text-gray-800 text-base sm:text-lg my-4 break-words">
                  <MarkdownRenderer content={post.content || ''} />
                </div>
              )}
            </div>

            {/* Botões de Ação Rápida (Mobile Friendly) */}
            <div className="px-4 sm:px-6 pb-4">
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Compartilhe:</p>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button onClick={() => handleQuickShare('whatsapp')} className="flex-1 min-w-[100px] bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md text-sm font-medium">
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                   <span className="hidden sm:inline">WhatsApp</span>
                </button>
                
                <button onClick={() => handleQuickShare('facebook')} className="flex-1 min-w-[100px] bg-[#1877F2] hover:bg-[#166fe5] text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md text-sm font-medium">
                  <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Facebook</span>
                </button>

                <button onClick={() => handleQuickShare('instagram')} className="flex-1 min-w-[100px] bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#285AEB] hover:opacity-90 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-opacity shadow-sm hover:shadow-md text-sm font-medium">
                   <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                   <span className="hidden sm:inline">Insta</span>
                </button>

                <button onClick={() => handleQuickShare('tiktok')} className="flex-1 min-w-[100px] bg-black hover:bg-gray-900 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md text-sm font-medium">
                   <TikTokIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                   <span className="hidden sm:inline">TikTok</span>
                </button>
              </div>
            </div>
            
            {/* Barra de Ações (Likes/Comentários) */}
            <div className="px-4 sm:px-6 py-4 border-t border-b border-gray-200">
              <div className="flex items-center justify-between text-gray-600">
                <div className="flex gap-4 sm:gap-6">
                   <button onClick={handleLikeToggle} className={`flex items-center gap-2 hover:text-red-500 transition-colors ${post.user_has_liked ? 'text-red-500' : ''}`}>
                     <Heart size={22} fill={post.user_has_liked ? 'currentColor' : 'none'} />
                     <span className="font-semibold text-sm sm:text-base">{post.likes_count || 0} <span className="hidden sm:inline">Curtidas</span></span>
                   </button>
                   <div className="flex items-center gap-2">
                     <MessageCircle size={22} />
                     <span className="font-semibold text-sm sm:text-base">{comments.length} <span className="hidden sm:inline">Comentários</span></span>
                   </div>
                </div>
                <button onClick={handleSharePost} className="flex items-center gap-2 hover:text-green-500 transition-colors">
                  <Share2 size={22} />
                  <span className="font-semibold text-sm sm:text-base hidden sm:inline">Outros</span>
                </button>
              </div>
            </div>
            
            {/* Área de Comentários */}
            <div className="p-4 sm:p-6 space-y-4 bg-gray-50/50">
              <h3 className="font-bold text-lg sm:text-xl text-gray-800">Comentários</h3>
              
              {isAuthenticated ? (
                <div className="flex gap-2 sm:gap-4">
                  <Link to={`/profile/${user?.user_id}`} className="hidden sm:block flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {/* Placeholder simples se avatar não existir para evitar crash */}
                      {user?.user_metadata?.avatar_url ? 
                        <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="Meu avatar" /> :
                        <div className="w-full h-full bg-blue-100" />
                      }
                    </div>
                  </Link>
                  <div className="flex-grow flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva um comentário..."
                      className="flex-grow min-h-[40px] py-2 resize-none"
                      rows={1}
                    />
                    <Button onClick={handleAddComment} disabled={postingComment} size="icon">
                      {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <Link to="/login" className="font-bold underline">Faça login</Link> para participar da conversa.
                  </p>
                </div>
              )}
              
              {loadingComments ? (
                <div className="text-center py-4"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></div>
              ) : comments.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Link to={`/profile/${comment.user_id}`} className="flex-shrink-0">
                        <OptimizedImage
                          alt={comment.profiles?.name || 'Usuário'}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mt-1 bg-gray-200 object-cover"
                          src={comment.profiles?.avatar_url}
                        />
                      </Link>
                      <div className="flex-grow bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start">
                          <Link to={`/profile/${comment.user_id}`} className="font-bold text-sm text-gray-800 hover:underline">
                            {comment.profiles?.name || 'Usuário'}
                          </Link>
                          {user?.user_id === comment.user_id && (
                            <div className="flex gap-1 -mr-1 -mt-1">
                              {editingCommentId === comment.id ? (
                                 <>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdateComment(comment.id)}><Save className="w-3 h-3 text-green-500" /></Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingCommentId(null)}><X className="w-3 h-3 text-gray-500" /></Button>
                                 </>
                              ) : (
                                 <>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingCommentId(comment.id); setEditingCommentContent(comment.content);}}><Edit className="w-3 h-3 text-gray-400 hover:text-blue-500" /></Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteComment(comment.id)}><Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" /></Button>
                                 </>
                              )}
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <Textarea value={editingCommentContent} onChange={(e) => setEditingCommentContent(e.target.value)} className="text-sm mt-2" />
                        ) : (
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
                        )}
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-2">
                          {new Date(comment.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                  <MessageCircle className="w-8 h-8 mb-2 text-gray-300" />
                  <p>Seja o primeiro a comentar!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

         <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente sua postagem e todos os seus comentários.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost} disabled={isDeletingPost} className="bg-red-500 hover:bg-red-600 text-white">
                {isDeletingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deletar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
      <ShareMenu open={showShareMenu} onOpenChange={setShowShareMenu} post={post} />
    </>
  );
};

export default PostPage;