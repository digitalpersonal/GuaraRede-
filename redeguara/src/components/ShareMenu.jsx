import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Share2, Facebook, MessageCircle, Check, Instagram, Image as ImageIcon, Video } from 'lucide-react';
import { getDirectUrl, getSocialShareUrl, getWhatsAppShareUrl } from '@/lib/utils';
import OptimizedImage from '@/components/OptimizedImage';

const TikTokIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 1 0 7.73 7.74 6.76 6.76 0 0 0 .08-1.09V8.41a8.7 8.7 0 0 0 2.8 1.46v-3.18z" />
  </svg>
);

const ShareMenu = ({ open, onOpenChange, post }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  // Link for display (clean)
  const displayUrl = getDirectUrl(post.id);
  
  // Link for crawlers (OG tags)
  const functionalUrl = getSocialShareUrl(post.id);
  
  // Media info
  const mediaUrls = post.media_urls || [];
  const hasMedia = mediaUrls.length > 0;
  const hasVideo = !!post.video_url;
  const previewImage = hasMedia ? mediaUrls[0] : (post.profiles?.avatar_url || null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(functionalUrl);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Link pronto para colar em qualquer rede social.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLinkAction = (network) => {
    navigator.clipboard.writeText(functionalUrl);
    toast({
      title: "Link copiado!",
      description: `Cole o link no ${network} para compartilhar a postagem.`,
      duration: 4000,
    });
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <MessageCircle className="w-6 h-6 text-white" />,
      bg: "bg-[#25D366]",
      action: () => window.open(getWhatsAppShareUrl(post), '_blank'),
      highlight: true
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-6 h-6 text-white" />,
      bg: "bg-[#1877F2]",
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(functionalUrl)}`, '_blank'),
    },
    {
      name: "Instagram",
      icon: <Instagram className="w-6 h-6 text-white" />,
      bg: "bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#285AEB]",
      action: () => handleCopyLinkAction("Instagram"),
    },
    {
      name: "TikTok",
      icon: <TikTokIcon className="w-6 h-6 text-white" />,
      bg: "bg-black",
      action: () => handleCopyLinkAction("TikTok"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <DialogHeader className="pb-2 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Share2 className="w-5 h-5 text-blue-500" />
            Compartilhar Postagem
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
             Escolha uma rede para compartilhar.
          </DialogDescription>
        </DialogHeader>

        {/* Preview Card */}
        <div className="bg-gray-50 p-4 rounded-lg my-2 border border-gray-100">
            <div className="flex gap-3">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden relative">
                    {previewImage ? (
                        <OptimizedImage 
                            src={previewImage} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            width={64}
                            height={64}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Share2 className="w-6 h-6" />
                        </div>
                    )}
                    {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                    )}
                </div>
                <div className="flex-grow min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {post.profiles?.name || 'Autor'}
                    </p>
                    <p className="text-sm text-gray-800 line-clamp-2 font-medium">
                        {post.content || 'Sem descrição'}
                    </p>
                    {hasMedia && (
                        <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Mídia incluída no link
                        </p>
                    )}
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 pt-4">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className="flex flex-col items-center gap-2 text-gray-600 hover:scale-105 transition-all duration-200 group relative"
            >
              <div className={`p-3 rounded-full shadow-sm ${option.bg} transition-shadow hover:shadow-md ${option.highlight ? 'ring-2 ring-offset-2 ring-green-100' : ''}`}>
                {option.icon}
              </div>
              <span className="text-xs font-medium">{option.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 pt-6 border-t mt-4">
          <div className="relative flex-1">
            <Input
              id="link"
              value={displayUrl}
              readOnly
              className="bg-gray-50 border-gray-200 text-xs text-gray-500 pr-10 font-mono h-9"
            />
          </div>
          <Button 
            type="button" 
            size="sm" 
            onClick={copyToClipboard} 
            className={copied ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareMenu;