import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Users, UserPlus, ArrowLeft, Lock, Globe, Building, ImagePlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '@/components/OptimizedImage';
import imageCompression from 'browser-image-compression';

const LoadingPlaceholder = () => (
  <div className="relative overflow-hidden rounded-lg shadow-md bg-gray-200 animate-pulse">
    <div className="h-32 bg-gray-300"></div>
    <div className="p-6">
      <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-300 rounded w-full mb-4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-9 bg-gray-300 rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

const CreateGroupDialog = ({ open, onOpenChange, onGroupCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('public');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true
      }
      try {
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao comprimir imagem." });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Nome do grupo é obrigatório", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const fileName = `${user.user_id}/group_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('groups')
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('groups').getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
      }

      const { data: groupData, error } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          type,
          creator_id: user.user_id,
          member_count: 1,
          image_url: imageUrl,
        })
        .select(`*, creator:profiles ( name, avatar_url, user_id ), companies ( name, logo_url )`)
        .single();

      if (error) throw error;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.user_id,
          role: 'admin',
        });
      
      if (memberError) throw memberError;

      toast({ title: "Grupo criado com sucesso!" });
      onGroupCreated(groupData);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({ title: "Erro ao criar grupo", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
          <DialogDescription>Conecte-se com pessoas com os mesmos interesses.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="group-name">Nome do Grupo</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Amantes de Café de Guaranésia" />
          </div>
          <div>
            <Label htmlFor="group-description">Descrição</Label>
            <Input id="group-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sobre o que é este grupo?" />
          </div>
          <div>
            <Label>Imagem de Capa</Label>
            {imagePreview ? (
              <div className="mt-2 relative w-full h-40">
                <img src={imagePreview} alt="Preview" className="rounded-md object-cover w-full h-full" />
                <Button type="button" variant="destructive" size="icon" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 h-7 w-7">&times;</Button>
              </div>
            ) : (
              <label htmlFor="image-upload-group" className="mt-2 cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                <ImagePlus className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">Adicionar imagem</span>
                <input id="image-upload-group" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
          <div>
            <Label>Tipo de Grupo</Label>
            <div className="flex gap-4 mt-2">
              <Button type="button" variant={type === 'public' ? 'default' : 'outline'} onClick={() => setType('public')} className="flex-1">
                <Globe className="mr-2 h-4 w-4" /> Público
              </Button>
              <Button type="button" variant={type === 'private' ? 'default' : 'outline'} onClick={() => setType('private')} className="flex-1">
                <Lock className="mr-2 h-4 w-4" /> Privado
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isSubmitting ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GroupsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('groups')
        .select(`*, creator:profiles ( name, avatar_url, user_id ), companies ( name, logo_url )`);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      setGroups(data || []);

    } catch (error) {
      toast({ title: "Erro ao buscar grupos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchGroups();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchGroups]);

  const handleCreateGroup = () => {
    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Você precisa estar logado para criar um grupo.", variant: "destructive" });
      return;
    }
    setIsCreateOpen(true);
  };

  const handleJoinGroup = (group) => {
    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Você precisa estar logado para entrar em um grupo.", variant: "destructive" });
      return;
    }
    toast({ title: `Pedido para entrar no grupo "${group.name}" enviado!`, description: "🚧 Esta funcionalidade ainda não foi implementada. Você pode solicitá-la no próximo prompt!" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Grupos da Comunidade</h1>
          <p className="text-gray-600 text-lg">Conecte-se com pessoas que compartilham seus interesses.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-md p-4 mb-8 sticky top-24 z-40">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Buscar grupos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow" />
            </div>
            <Button onClick={handleCreateGroup} className="flex items-center space-x-2 w-full md:w-auto">
              <Plus className="w-5 h-5" />
              <span>Criar Grupo</span>
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <LoadingPlaceholder key={i} />)
          ) : groups.length > 0 ? (
            groups.map((group, index) => (
              <motion.div key={group.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: index * 0.05 }} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <div className="h-40 bg-gray-200 relative">
                  <OptimizedImage alt={group.name} className="w-full h-full object-cover" src={group.image_url} width={600} height={300} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-gray-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    {group.type === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                    <span>{group.type === 'private' ? 'Privado' : 'Público'}</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-gray-800 text-xl mb-2">{group.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{group.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    {group.companies ? (
                      <span className="flex items-center gap-2">
                        <Building size={14} /> Grupo oficial de <strong>{group.companies.name}</strong>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserPlus size={14} /> Criado por <strong>{group.creator?.name || 'Usuário'}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{group.member_count || 0} membros</span>
                    </div>
                    <Button onClick={() => handleJoinGroup(group)} size="sm" className="flex items-center space-x-1">
                      <UserPlus className="w-4 h-4" />
                      <span>Entrar</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-12">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum grupo encontrado</h3>
                <p className="text-gray-600 mb-4">Seja o primeiro a criar um grupo na comunidade!</p>
                <Button onClick={handleCreateGroup}>Criar Meu Grupo</Button>
              </div>
            </motion.div>
          )}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center mx-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
      <CreateGroupDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onGroupCreated={(newGroup) => setGroups(prev => [newGroup, ...prev])} />
    </div>
  );
};

export default GroupsPage;