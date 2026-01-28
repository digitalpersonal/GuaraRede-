import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ImagePlus, Video, Loader2, X, AlertCircle } from 'lucide-react'; 
import { supabase } from '@/lib/customSupabaseClient';

const CreatePost = ({ onNewPost }) => {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const MAX_IMAGES = 4;
  const MAX_IMG_SIZE_MB = 15; // Increased from 5MB to 15MB
  const MAX_VIDEO_SIZE_MB = 80; // Increased from 50MB to 80MB
  const MAX_VIDEO_DURATION_SEC = 45; // Increased from 30 to 45 seconds

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    if (files.length + imageFiles.length > MAX_IMAGES) {
      toast({ variant: "destructive", title: "Limite excedido", description: `Você só pode enviar até ${MAX_IMAGES} imagens.` });
      return;
    }

    setCompressing(true);

    // Dynamic import for performance
    let imageCompression;
    try {
      const module = await import('browser-image-compression');
      imageCompression = module.default;
    } catch (err) {
      console.error("Failed to load compression library", err);
      setCompressing(false);
      return;
    }

    const newFiles = [];
    const newPreviews = [];

    const compressionOptions = {
      maxSizeMB: 1, // Compress aggressively for web display
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };

    for (const file of files) {
      if (file.size > MAX_IMG_SIZE_MB * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande", description: `${file.name} excede ${MAX_IMG_SIZE_MB}MB.` });
        continue;
      }
      
      try {
        const compressedFile = await imageCompression(file, compressionOptions);
        newFiles.push(compressedFile);
        newPreviews.push(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error('Compression error:', error);
        toast({ variant: "destructive", title: "Erro na imagem", description: `Erro ao processar ${file.name}` });
      }
    }

    setImageFiles([...imageFiles, ...newFiles]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
    setCompressing(false);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset current video
    setVideoFile(null);
    setVideoPreview(null);

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        toast({ variant: "destructive", title: "Vídeo muito grande", description: `O vídeo deve ter no máximo ${MAX_VIDEO_SIZE_MB}MB.` });
        return;
    }

    // Check duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > MAX_VIDEO_DURATION_SEC + 1) { // +1 tolerance
         toast({ variant: "destructive", title: "Vídeo muito longo", description: `O vídeo excede ${MAX_VIDEO_DURATION_SEC} segundos e foi rejeitado.` });
         return;
      }
      
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    };
    video.onerror = () => {
      toast({ variant: "destructive", title: "Erro", description: "Arquivo de vídeo inválido." });
    }
    video.src = URL.createObjectURL(file);
  };

  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    URL.revokeObjectURL(newPreviews[index]); // Clean up memory
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && imageFiles.length === 0 && !videoFile) {
      toast({ title: "Oops!", description: "Escreva algo ou adicione mídia.", variant: "destructive" });
      return;
    }

    if (!user?.user_id) {
      toast({ title: "Erro", description: "Faça login novamente.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Images
      const uploadedImageUrls = [];
      for (const file of imageFiles) {
        const fileName = `${user.user_id}/${Date.now()}_img_${Math.random().toString(36).substr(2, 9)}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(uploadData.path);
        uploadedImageUrls.push(urlData.publicUrl);
      }

      // 2. Upload Video
      let uploadedVideoUrl = null;
      if (videoFile) {
        const fileName = `${user.user_id}/${Date.now()}_vid_${Math.random().toString(36).substr(2, 9)}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('post-videos').getPublicUrl(uploadData.path);
        uploadedVideoUrl = urlData.publicUrl;
      }

      // 3. Create Post
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.user_id,
            content: content,
            image_url: uploadedImageUrls[0] || null, // Legacy support / Main image
            media_urls: uploadedImageUrls,
            video_url: uploadedVideoUrl,
            status: 'approved',
          },
        ])
        .select('*, profiles(name, avatar_url, user_id)');

      if (error) throw error;

      if (data && data.length > 0) {
        onNewPost(data[0]);
        // Reset Form
        setContent('');
        setImageFiles([]);
        setImagePreviews([]);
        setVideoFile(null);
        setVideoPreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';

        toast({ title: "Sucesso!", description: "Postagem publicada!" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao postar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-5 rounded-xl shadow-md mb-8 border border-gray-100"
    >
      <div className="mb-4 bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Você pode enviar até <strong>4 imagens</strong> (JPG ou PNG, até {MAX_IMG_SIZE_MB} MB cada) e <strong>1 vídeo</strong> (MP4 ou MOV, até {MAX_VIDEO_DURATION_SEC} segundos ou {MAX_VIDEO_SIZE_MB} MB).
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Previews Area */}
        <div className="mb-4 space-y-3">
            {videoPreview && (
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video group">
                    <video src={videoPreview} className="w-full h-full object-contain" controls playsInline />
                    <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-80 hover:opacity-100 transition-opacity shadow-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {compressing && (
              <div className="flex items-center justify-center p-4 text-sm text-gray-500 gap-2 bg-gray-50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" /> Otimizando imagens...
              </div>
            )}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-gray-700 placeholder:text-gray-400"
          placeholder={`No que você está pensando hoje, ${user?.name?.split(' ')[0] || 'usuário'}?`}
          rows="3"
        ></textarea>
        
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input 
                type="file" 
                multiple 
                accept="image/png, image/jpeg" 
                className="hidden" 
                ref={imageInputRef}
                onChange={handleImageChange}
            />
            <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageFiles.length >= MAX_IMAGES || compressing}
            >
                <ImagePlus className="w-5 h-5 mr-2" />
                Fotos ({imageFiles.length}/{MAX_IMAGES})
            </Button>

            <input 
                type="file" 
                accept="video/mp4, video/quicktime" 
                className="hidden" 
                ref={videoInputRef}
                onChange={handleVideoChange}
            />
            <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-green-600 hover:bg-green-50"
                onClick={() => videoInputRef.current?.click()}
                disabled={!!videoFile || compressing}
            >
                <Video className="w-5 h-5 mr-2" />
                Vídeo
            </Button>
          </div>

          <Button type="submit" disabled={loading || compressing || (!content.trim() && imageFiles.length === 0 && !videoFile)} className="bg-blue-600 hover:bg-blue-700 px-6 rounded-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreatePost;