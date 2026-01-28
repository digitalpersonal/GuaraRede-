import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a direct URL to a post (clean, user-friendly)
 * Used for display purposes in the UI
 */
export function getDirectUrl(postId) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/post/${postId}`;
}

/**
 * Generate a social share URL optimized for crawlers
 * This URL is designed for social media previews with proper meta tags
 */
export function getSocialShareUrl(postId) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/post-preview/${postId}`;
}

/**
 * Generate a general share URL for a post
 * This is the primary function used for sharing actions
 */
export function getShareUrl(postId) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/post/${postId}`;
}

/**
 * Generate share text for social media
 */
export function getShareText(post) {
  const userName = post?.profiles?.name || 'um usuário';
  const content = post?.content 
    ? (post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content)
    : 'Confira esta publicação';
  
  return `${userName} compartilhou: ${content}`;
}

/**
 * Generate formatted WhatsApp share URL
 * Includes Title, Author, and Link (using social preview link for OG tags)
 */
export function getWhatsAppShareUrl(post) {
  if (!post) return '';
  
  const author = post.profiles?.name || 'RedeGuara';
  const rawContent = post.content || 'Confira esta publicação';
  // Truncate content for cleaner message
  const content = rawContent.length > 160 ? rawContent.substring(0, 160) + '...' : rawContent;
  
  // Use the social share URL (post-preview) to ensure the image card renders in WhatsApp
  const link = getSocialShareUrl(post.id);
  
  // Format:
  // *[Author]* na RedeGuara:
  //
  // [Content]
  //
  // [Link]
  const message = `*${author}* na RedeGuara:\n\n${content}\n\n${link}`;
  
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Optimizes a Supabase Storage image URL using their image transformation API
 * @param {string} url - The original image URL
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {number} quality - Image quality (0-100)
 * @param {string} resize - Resize mode ('cover', 'contain', 'fill')
 * @returns {string} - The optimized URL
 */
export function optimizeSupabaseImage(url, width, height, quality = 75, resize = 'cover') {
  if (!url) return null;
  
  // Check if it's a Supabase Storage URL
  if (!url.includes('supabase.co/storage/v1/object/public')) {
    return url;
  }

  // If it's already a transformed URL (contains /render/image), just return it or append params if needed
  // But usually we are dealing with the raw public URL
  
  // Supabase Image Transformation works by appending query parameters to a specific endpoint
  // or by using the /render/image/public endpoint instead of /object/public
  
  // Replace /object/public/ with /render/image/public/
  let optimizedUrl = url.replace('/object/public/', '/render/image/public/');
  
  const params = [];
  
  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (quality) params.push(`quality=${quality}`);
  if (resize && resize !== 'none') params.push(`resize=${resize}`);
  
  if (params.length > 0) {
    const separator = optimizedUrl.includes('?') ? '&' : '?';
    optimizedUrl = `${optimizedUrl}${separator}${params.join('&')}`;
  }
  
  return optimizedUrl;
}