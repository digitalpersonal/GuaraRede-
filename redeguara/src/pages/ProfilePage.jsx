import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { User, Mail, Calendar, Crown, Loader2, ArrowLeft, Newspaper, Heart, MessageCircle, Link as LinkIcon, Users, ShoppingBag, Edit } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import OptimizedImage from '@/components/OptimizedImage';
import imageCompression from 'browser-image-compression';
import PostMedia from '@/components/PostMedia'; // Import PostMedia

const ProfilePage = () => {
  const { user: authUser, loading: authLoading, fetchUserProfile } = useAuth();
  const { id: profileUserId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '', website: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwnProfile = authUser?.user_id === profileUserId;

  const fetchProfileData = useCallback(async () => {
    if (!profileUserId) {
      toast({ variant: "destructive", title: "Erro", description: "ID de perfil inválido." });
      navigate('/');
      return;
    }
    setLoading(true);
    try {
      let targetProfile;
      if (isOwnProfile && authUser) {
        targetProfile = authUser;
      } else {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', profileUserId)
          .single();

        if (profileError || !profileData) {
          throw new Error(profileError?.message || "Perfil não encontrado.");
        }
        targetProfile = profileData;
      }
      setProfile(targetProfile);
      setEditData({ name: targetProfile.name || '', bio: targetProfile.bio || '', website: targetProfile.website || '' });
      setAvatarPreview(targetProfile.avatar_url);

      const [postsRes, groupsRes, productsRes] = await Promise.all([
        supabase.from('posts').select('*, profiles(name, avatar_url), post_likes(user_id)').eq('user_id', profileUserId).order('created_at', { ascending: false }),
        supabase.from('group_members').select('groups!inner(*)').eq('user_id', profileUserId),
        supabase.from('products').select('*').eq('user_id', profileUserId).order('created_at', { ascending: false })
      ]);

      if (postsRes.error) throw postsRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (productsRes.error) throw productsRes.error;
      
      const processedPosts = (postsRes.data || []).map(post => ({
        ...post,
        user_has_liked: authUser ? post.post_likes.some(like => like.user_id === authUser.id) : false,
        likes_count: post.post_likes.length,
        comments_count: post.comments_count || 0,
        media_urls: (post.media_urls && post.media_urls.length > 0) ? post.media_urls : (post.image_url ? [post.image_url] : [])
      }));
      setPosts(processedPosts);
      setGroups(groupsRes.data.map(g => g.groups) || []);
      setProducts(productsRes.data || []);

    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao carregar perfil", description: error.message });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [profileUserId, navigate, toast, authUser, isOwnProfile]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfileData();
    }
  }, [profileUserId, authLoading, fetchProfileData]);

  const handleFeatureClick = (feature) => {
    toast({
      title: `🚧 ${feature || 'Esta funcionalidade'} não está implementada ainda—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀`
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
      try {
        const compressedFile = await imageCompression(file, options);
        setAvatarFile(compressedFile);
        setAvatarPreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao comprimir imagem", description: "Tente uma imagem menor." });
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!isOwnProfile) return;
    setIsUpdating(true);
    try {
      let avatar_url = profile.avatar_url;
      if (avatarFile) {
        const fileName = `${authUser.user_id}/${Date.now()}_${avatarFile.name}`;
        
        if (profile.avatar_url) {
          const oldFileName = profile.avatar_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('avatars').remove([`${authUser.user_id}/${oldFileName}`]);
          }
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
        avatar_url = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...editData, avatar_url })
        .eq('user_id', authUser.user_id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchUserProfile(authUser);
      setProfile(data);
      setIsEditing(false);
      toast({ title: "Sucesso!", description: "Seu perfil foi atualizado." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'ouro': return 'text-yellow-600 bg-yellow-100';
      case 'prata': return 'text-gray-600 bg-gray-100';
      case 'bronze': return 'text-orange-600 bg-orange-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getPlanName = (plan) => {
    switch (plan) {
      case 'ouro': return 'Ouro';
      case 'prata': return 'Prata';
      case 'bronze': return 'Bronze';
      default: return 'Grátis';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Carregando Perfil...</h2>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Perfil não encontrado</h2>
          <p className="text-gray-600">Não foi possível carregar os dados deste perfil. Tente novamente mais tarde.</p>
          <Button variant="outline" onClick={() => navigate('/')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-green-500 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                <OptimizedImage src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-center md:text-left flex-1 min-w-0">
                <h1 className="text-3xl font-bold truncate">{profile.name}</h1>
                {/* Updated biography to allow multiple lines */}
                <p className="text-blue-100 mt-1 break-words">{profile.bio || 'Membro da RedeGuara'}</p>
                <div className="flex items-center justify-center md:justify-start flex-wrap gap-4 mt-2">
                  <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(profile.plan_type)}`}>
                    <Crown className="w-4 h-4" />
                    <span>Plano {getPlanName(profile.plan_type)}</span>
                  </div>
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-100 hover:text-white break-all">
                      <LinkIcon size={14} />
                      <span className="text-sm font-medium truncate">{profile.website}</span>
                    </a>
                  )}
                </div>
              </div>
              {!isOwnProfile && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" className="bg-white/20 text-white border-white/50 hover:bg-white/30" onClick={() => handleFeatureClick('Seguir')}>
                    Seguir
                  </Button>
                   <Button variant="outline" className="bg-white/20 text-white border-white/50 hover:bg-white/30" onClick={() => handleFeatureClick('Enviar Mensagem')}>
                    Mensagem
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Informações</h2>
                <div className="space-y-4">
                  <InfoItem icon={Mail} label="Email" value={profile.email} />
                  <InfoItem icon={Calendar} label="Membro desde" value={new Date(profile.created_at).toLocaleDateString('pt-BR')} />
                </div>
                {isOwnProfile && (
                  <div className="mt-6 flex flex-col gap-2">
                    <Button onClick={() => setIsEditing(true)} className="bg-blue-500 hover:bg-blue-600 w-full">
                      <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                    </Button>
                    <Button onClick={() => navigate('/plans')} variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 w-full">
                      <Crown className="mr-2 h-4 w-4" /> Ver Planos
                    </Button>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Tabs sections={[
                  { title: 'Posts', icon: Newspaper, data: posts, component: PostList },
                  { title: 'Grupos', icon: Users, data: groups, component: GroupList },
                  { title: 'Produtos', icon: ShoppingBag, data: products, component: ProductList },
                ]} isOwnProfile={isOwnProfile} profileName={profile.name.split(' ')[0]} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <OptimizedImage src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover" />
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                  <Edit size={16} />
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>
            <Input
              id="name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="Seu nome"
            />
            <Textarea
              id="bio"
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              placeholder="Sua bio"
            />
            <Input
              id="website"
              value={editData.website}
              onChange={(e) => setEditData({ ...editData, website: e.target.value })}
              placeholder="https://seu-site.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start space-x-3 min-w-0">
    <Icon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 break-words">{value}</p>
    </div>
  </div>
);

const Tabs = ({ sections, isOwnProfile, profileName }) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div>
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {sections.map((section, index) => (
            <button
              key={section.title}
              onClick={() => setActiveTab(index)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <section.icon size={16} /> {section.title} ({section.data.length})
            </button>
          ))}
        </nav>
      </div>
      <div>
        {sections.map((section, index) => (
          <div key={section.title} className={activeTab === index ? 'block' : 'hidden'}>
            <section.component data={section.data} isOwnProfile={isOwnProfile} profileName={profileName} />
          </div>
        ))}
      </div>
    </div>
  );
};

const PostList = ({ data, isOwnProfile, profileName }) => {
  const navigate = useNavigate();
  if (data.length === 0) return <EmptyState message={isOwnProfile ? 'Você ainda não fez nenhum post.' : `${profileName} ainda não fez nenhum post.`} buttonText="Criar seu primeiro post" onButtonClick={() => navigate('/feed')} showButton={isOwnProfile} />;
  return (
    <div className="space-y-6">
      {data.map((post) => (
        <div key={post.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
          {/* Using PostMedia component for images and videos with spacing */}
          {(post.media_urls.length > 0 || post.video_url) && (
            <div className="mb-4"> {/* Added a div to provide margin-bottom for spacing */}
                <PostMedia mediaUrls={post.media_urls} videoUrl={post.video_url} contentMode={true} />
            </div>
          )}
          <div className="flex justify-between items-center text-gray-500 text-sm">
            <span>{new Date(post.created_at).toLocaleString('pt-BR')}</span>
            <div className="flex gap-4 items-center">
              <span className="flex items-center gap-1.5"><Heart size={16} /> {post.likes_count}</span>
              <span className="flex items-center gap-1.5"><MessageCircle size={16} /> {post.comments_count}</span>
              <Link to={`/post/${post.id}`} className="font-semibold text-blue-600 hover:underline">Ver Post</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const GroupList = ({ data, isOwnProfile, profileName }) => {
  const navigate = useNavigate();
  if (data.length === 0) return <EmptyState message={isOwnProfile ? 'Você não participa de nenhum grupo.' : `${profileName} não participa de nenhum grupo.`} buttonText="Explorar Grupos" onButtonClick={() => navigate('/groups')} showButton={true} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.map((group) => (
        <Link to={`/groups`} key={group.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4">
          <OptimizedImage src={group.image_url} alt={group.name} className="w-16 h-16 rounded-md object-cover bg-gray-200" />
          <div>
            <h4 className="font-bold text-gray-800">{group.name}</h4>
            <p className="text-sm text-gray-500">{group.member_count || 0} membros</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

const ProductList = ({ data, isOwnProfile, profileName }) => {
  const navigate = useNavigate();
  if (data.length === 0) return <EmptyState message={isOwnProfile ? 'Você não tem produtos à venda.' : `${profileName} não tem produtos à venda.`} buttonText="Anunciar Produto" onButtonClick={() => navigate('/my-products')} showButton={isOwnProfile} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.map((product) => (
        <Link to={`/marketplace`} key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4">
          <OptimizedImage src={product.image_url} alt={product.name} className="w-16 h-16 rounded-md object-cover bg-gray-200" />
          <div>
            <h4 className="font-bold text-gray-800">{product.name}</h4>
            <p className="text-sm text-green-600 font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

const EmptyState = ({ message, buttonText, onButtonClick, showButton }) => (
  <div className="bg-gray-50 rounded-lg p-8 text-center">
    <p className="text-gray-500">{message}</p>
    {showButton && <Button onClick={onButtonClick} className="mt-4">{buttonText}</Button>}
  </div>
);

export default ProfilePage;