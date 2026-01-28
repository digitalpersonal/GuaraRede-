import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const PostPreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Detect bot/crawler or specific debug mode
    const isBot = /bot|facebook|embed|got|CLP|crawl|discord|ember|feed|slurp|terry|ua|preview|whatsapp|rig|get|curl|wget|seo|bing|yahoo|google|yandex|spider|twitter/i.test(navigator.userAgent);
    const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';

    const fetchPost = async () => {
      console.log(`[Preview] Fetching post data for ID: ${id}`);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('content, image_url, media_urls, video_url, profiles(name)')
          .eq('id', id)
          .single();

        if (error) {
          console.error('[Preview] Error fetching post:', error);
          throw error;
        }

        if (data) {
          console.log('[Preview] Post loaded successfully:', data);
          setPost(data);
        } else {
          console.warn('[Preview] Post not found');
          throw new Error("Post não encontrado.");
        }
      } catch (err) {
        console.error('[Preview] Catch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);
  
  // Navigation logic separated to avoid conflicts during render
  useEffect(() => {
    if (loading || !post) return;

    const isBot = /bot|facebook|embed|got|CLP|crawl|discord|ember|feed|slurp|terry|ua|preview|whatsapp|rig|get|curl|wget|seo|bing|yahoo|google|yandex|spider|twitter/i.test(navigator.userAgent);
    const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';

    // If it's a regular user (not a bot) and not debugging, redirect to the actual post
    if (!isBot && !isDebug) {
      console.log('[Preview] Redirecting to full post page...');
      navigate(`/post/${id}`, { replace: true });
    }
  }, [loading, post, id, navigate]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center min-h-screen">
        <Helmet>
          <title>Erro - RedeGuara</title>
        </Helmet>
        <h2 className="text-2xl font-bold mb-4">Erro ao Carregar Post</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!post) return null;
  
  const title = `Post de ${post.profiles?.name || 'usuário'} na RedeGuara`;
  // Truncate description to avoid excessive length
  const description = post.content 
    ? (post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content)
    : "Veja esta publicação na RedeGuara.";
    
  const url = `${window.location.origin}/post/${id}`;
  
  // Logic to determine main image for OG tags
  let imageUrl = post.image_url;
  if (!imageUrl && post.media_urls && post.media_urls.length > 0) {
      imageUrl = post.media_urls[0];
  }

  // Validation for Image URL
  if (imageUrl) {
    if (!imageUrl.startsWith('http')) {
        console.warn('[Preview] Image URL appears to be relative or invalid:', imageUrl);
    }
    imageUrl = imageUrl.trim();
  }

  console.log('[Preview] Generated Meta Tags:', { 
    title, 
    description, 
    url, 
    imageUrl: imageUrl || 'No image' 
  });

  // Debug View for Developers/Tools
  const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content="RedeGuara" />
        <meta property="og:locale" content="pt_BR" />
        
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        {imageUrl && <meta property="og:image:secure_url" content={imageUrl} />}
        {imageUrl && <meta property="og:image:type" content="image/jpeg" />} 
        {imageUrl && <meta property="og:image:alt" content={description} />}
        
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Video Tag for OG if video exists */}
        {post.video_url && <meta property="og:video" content={post.video_url} />}
        {post.video_url && <meta property="og:video:secure_url" content={post.video_url} />}
        {post.video_url && <meta property="og:video:type" content="video/mp4" />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:domain" content={window.location.hostname} />
        <meta name="twitter:url" content={url} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      </Helmet>

      {/* Only visible in debug mode or to bots (if they render HTML) */}
      {isDebug && (
        <div className="p-8 max-w-2xl mx-auto font-sans">
          <h1 className="text-2xl font-bold mb-4">Preview Debug Mode</h1>
          <div className="space-y-4 border p-4 rounded bg-gray-50">
            <div><strong>Title:</strong> {title}</div>
            <div><strong>Description:</strong> {description}</div>
            <div><strong>URL:</strong> {url}</div>
            <div><strong>Image URL:</strong> {imageUrl || 'None'}</div>
            <div><strong>Video URL:</strong> {post.video_url || 'None'}</div>
            {imageUrl ? (
              <div>
                <strong>Image Preview:</strong>
                <div className="mt-2 border rounded overflow-hidden bg-gray-200">
                  <img src={imageUrl} alt="Preview" className="max-w-full h-auto mx-auto" />
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-4">
             <button onClick={() => navigate(`/post/${id}`)} className="text-blue-500 underline">
               Ir para a postagem real
             </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PostPreviewPage;