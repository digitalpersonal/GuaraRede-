import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Plus, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import OptimizedImage from '@/components/OptimizedImage';

const BannerManagementPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [newBanner, setNewBanner] = useState({
    title: '',
    link_url: '',
    image_file: null,
    position: 'footer',
    is_active: true
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.user_type !== 'admin') {
        toast({
          variant: "destructive",
          title: "Acesso negado",
          description: "Apenas administradores podem acessar esta página."
        });
        navigate('/');
        return;
      }
      fetchBanners();
    }
  }, [user, authLoading, navigate, toast]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os banners."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewBanner({ ...newBanner, image_file: file });
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBanner.image_file || !newBanner.title) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, forneça um título e uma imagem."
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = newBanner.image_file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(filePath, newBanner.image_file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banner-images')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('banners')
        .insert([{
          user_id: user.user_id,
          title: newBanner.title,
          link_url: newBanner.link_url,
          image_url: publicUrl,
          position: newBanner.position,
          is_active: newBanner.is_active
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Sucesso!",
        description: "Banner adicionado com sucesso."
      });

      setNewBanner({
        title: '',
        link_url: '',
        image_file: null,
        position: 'footer',
        is_active: true
      });
      
      const fileInput = document.getElementById('banner-image-input');
      if (fileInput) fileInput.value = '';

      fetchBanners();
    } catch (error) {
      console.error('Error adding banner:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao adicionar banner. Tente novamente."
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!bannerToDelete) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerToDelete);

      if (error) throw error;

      toast({
        title: "Excluído",
        description: "Banner removido com sucesso."
      });
      setBanners(banners.filter(b => b.id !== bannerToDelete));
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir banner."
      });
    }
  };

  const toggleBannerStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setBanners(banners.map(b => 
        b.id === id ? { ...b, is_active: !currentStatus } : b
      ));
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar status do banner."
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-4">
          <Link to="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Banners</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Banner</CardTitle>
              <CardDescription>Upload de imagem para publicidade</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBanner} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Anunciante</Label>
                  <Input 
                    id="title"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({...newBanner, title: e.target.value})}
                    placeholder="Ex: Supermercado Central"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="link_url">Link de Redirecionamento (Opcional)</Label>
                  <Input 
                    id="link_url"
                    value={newBanner.link_url}
                    onChange={(e) => setNewBanner({...newBanner, link_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-image-input">Imagem do Banner</Label>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="banner-image-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-xs text-gray-500">Clique para selecionar</p>
                      </div>
                      <input 
                        id="banner-image-input" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  {newBanner.image_file && (
                    <p className="text-xs text-green-600 mt-1">
                      Selecionado: {newBanner.image_file.name}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Banner
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Banners Ativos ({banners.length})</CardTitle>
              <CardDescription>Lista de todos os banners cadastrados. Sem limite de quantidade.</CardDescription>
            </CardHeader>
            <CardContent>
              {banners.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum banner cadastrado ainda.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Imagem</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {banners.map((banner) => (
                        <TableRow key={banner.id}>
                          <TableCell>
                            <div className="w-16 h-10 rounded overflow-hidden bg-gray-100">
                              <OptimizedImage 
                                src={banner.image_url} 
                                alt={banner.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{banner.title}</div>
                            {banner.link_url && (
                              <a href={banner.link_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[150px] block">
                                {banner.link_url}
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                checked={banner.is_active} 
                                onCheckedChange={() => toggleBannerStatus(banner.id, banner.is_active)}
                              />
                              <span className="text-xs text-gray-500">{banner.is_active ? 'Ativo' : 'Inativo'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setBannerToDelete(banner.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBanner} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BannerManagementPage;