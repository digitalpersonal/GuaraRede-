import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users, Search, Edit, Trash2, MoreVertical, BarChart, UserPlus, Building, FileText, Image as ImageIcon, CheckCircle, XCircle, Clock, PlusCircle, ClipboardList, KeyRound, Plus, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx';
import OptimizedImage from '@/components/OptimizedImage';
import imageCompression from 'browser-image-compression';

const AdminPage = () => {
  const { user: authUser, loading: authLoading, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [editingUser, setEditingUser] = useState(null);
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', plan_type: 'gratis', user_type: 'user' });

  const [editingBanner, setEditingBanner] = useState(null);
  const [isAddBannerDialogOpen, setAddBannerDialogOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', link_url: '', position: 'topo', is_active: true });
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);

  const [editingCompany, setEditingCompany] = useState(null);
  const [isAddCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '', whatsapp_number: '', category_id: '', status: 'approved', whatsapp_numbers: [{ name: '', number: '' }] });
  const [companyImageFile, setCompanyImageFile] = useState(null);
  const [companyImagePreview, setCompanyImagePreview] = useState(null);

  const [editingPost, setEditingPost] = useState(null);
  const [isAddPostDialogOpen, setAddPostDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', status: 'approved' });
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', whatsapp_number: '', status: 'approved' });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);

  const [editingCategory, setEditingCategory] = useState(null);
  const [isAddCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '' });

  const isNewCompanyPassengerTransport = useMemo(() => {
    const category = categories.find(c => String(c.id) === String(newCompany.category_id));
    return category?.name === 'Transporte de Passageiros';
  }, [newCompany.category_id, categories]);

  const isEditingCompanyPassengerTransport = useMemo(() => {
    if (!editingCompany) return false;
    const category = categories.find(c => String(c.id) === String(editingCompany.category_id));
    return category?.name === 'Transporte de Passageiros';
  }, [editingCompany?.category_id, categories]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: statsData, error: statsError },
        { data: usersData, error: usersError },
        { data: companiesData, error: companiesError },
        { data: postsData, error: postsError },
        { data: productsData, error: productsError },
        { data: bannersData, error: bannersError },
        { data: categoriesData, error: categoriesError }
      ] = await Promise.all([
        supabase.rpc('get_admin_stats'),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('companies').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, profiles(name, user_id)').order('created_at', { ascending: false }),
        supabase.from('products').select('*, profiles:user_id(name, user_id)').order('created_at', { ascending: false }),
        supabase.from('banners').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ]);

      if (statsError) throw statsError;
      if (usersError) throw usersError;
      if (companiesError) throw companiesError;
      if (postsError) throw postsError;
      if (productsError) throw productsError;
      if (bannersError) throw bannersError;
      if (categoriesError) throw categoriesError;

      setStats(statsData);
      setUsers(usersData || []);
      setCompanies(companiesData || []);
      setPosts(postsData || []);
      setProducts(productsData || []);
      setBanners(bannersData || []);
      setCategories(categoriesData || []);

    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao carregar dados", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser || authUser.user_type !== 'admin') {
        toast({ variant: "destructive", title: "Acesso Negado", description: "Você não tem permissão para acessar esta página." });
        navigate('/');
      } else {
        fetchData();
      }
    }
  }, [authUser, authLoading, navigate, toast, fetchData]);

  const handleImageChange = async (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true
      }
      try {
        const compressedFile = await imageCompression(file, options);
        setFile(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao comprimir imagem", description: "Tente uma imagem menor." });
        setFile(null);
        setPreview(null);
      }
    }
  };

  const uploadImage = async (file, bucket) => {
    if (!file) return null;
    const fileName = `${authUser.user_id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
    return urlData.publicUrl;
  };

  const handleAddUser = async () => {
    const { email, password, name, plan_type, user_type } = newUser;
    if (!email || !password || !name) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos obrigatórios." });
      return;
    }

    const { data: signUpData, error: signUpError } = await signUp(email, password, {
      data: { name, plan_type, user_type }
    });

    if (signUpError) {
      toast({ variant: "destructive", title: "Erro ao criar usuário", description: signUpError.message });
      return;
    }
    
    if (user_type === 'admin' && signUpData.user) {
        const { error: updateError } = await supabase.from('profiles').update({ user_type: 'admin' }).eq('user_id', signUpData.user.id);
        if (updateError) {
             toast({ variant: "destructive", title: "Erro ao definir tipo de usuário", description: updateError.message });
        }
    }

    toast({ title: "Sucesso", description: "Usuário criado com sucesso. Peça para ele verificar o email." });
    setAddUserDialogOpen(false);
    setNewUser({ email: '', password: '', name: '', plan_type: 'gratis', user_type: 'user' });
    fetchData();
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      setUsers(prevUsers =>
        prevUsers.map(u => (u.user_id === userId ? data : u))
      );
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso." });
      setEditingUser(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: `Falha ao atualizar usuário: ${error.message}` });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === authUser.user_id) {
      toast({ variant: "destructive", title: "Ação não permitida", description: "Você não pode deletar a si mesmo." });
      return;
    }
    if (!window.confirm("Tem certeza que deseja deletar este usuário? Esta ação é irreversível.")) return;
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });
      if (error) throw error;
      setUsers(prevUsers => prevUsers.filter(u => u.user_id !== userId));
      toast({ title: "Sucesso", description: "Usuário deletado com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: `Falha ao deletar usuário: ${error.message}` });
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm("Tem certeza que deseja enviar um link de redefinição de senha para este usuário?")) return;
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId },
      });
      if (error) throw error;
      toast({ title: "Sucesso", description: data.message });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: `Falha ao redefinir senha: ${error.message}` });
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.category_id) {
        toast({ variant: "destructive", title: "Erro", description: "Nome e Categoria são obrigatórios." });
        return;
    }

    const filledWhatsappNumbers = (newCompany.whatsapp_numbers || []).filter(w => w.name && w.number).map(w => ({ ...w, number: `+55${w.number}` }));

    if (isNewCompanyPassengerTransport) {
        if (filledWhatsappNumbers.length === 0) {
            toast({ variant: "destructive", title: "Erro", description: "Adicione ao menos um contato de WhatsApp completo (nome e número)." });
            return;
        }
    } else {
        if (!newCompany.whatsapp_number) {
            toast({ variant: "destructive", title: "Erro", description: "O número do WhatsApp é obrigatório." });
            return;
        }
    }

    try {
        const logo_url = await uploadImage(companyImageFile, 'company-logos');
        
        const payload = {
            ...newCompany,
            user_id: authUser.user_id,
            logo_url,
        };

        if (isNewCompanyPassengerTransport) {
            payload.whatsapp_numbers = filledWhatsappNumbers;
            payload.whatsapp_number = null; 
        } else {
            payload.whatsapp_number = `+55${newCompany.whatsapp_number}`;
            payload.whatsapp_numbers = [];
        }

        const { data, error } = await supabase.from('companies').insert([payload]).select('*, categories(name)').single();
        if (error) throw error;
        setCompanies(prev => [data, ...prev]);
        toast({ title: "Sucesso", description: "Empresa adicionada com sucesso." });
        setAddCompanyDialogOpen(false);
        setNewCompany({ name: '', description: '', whatsapp_number: '', category_id: '', status: 'approved', whatsapp_numbers: [{ name: '', number: '' }] });
        setCompanyImageFile(null);
        setCompanyImagePreview(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao adicionar empresa", description: error.message });
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;

    const filledWhatsappNumbers = (editingCompany.whatsapp_numbers || []).filter(w => w.name && w.number).map(w => ({ ...w, number: w.number.startsWith('+55') ? w.number : `+55${w.number}` }));

    if (isEditingCompanyPassengerTransport) {
        if (filledWhatsappNumbers.length === 0) {
            toast({ variant: "destructive", title: "Erro", description: "Adicione ao menos um contato de WhatsApp completo (nome e número)." });
            return;
        }
    } else {
        if (!editingCompany.whatsapp_number) {
            toast({ variant: "destructive", title: "Erro", description: "O número do WhatsApp é obrigatório." });
            return;
        }
    }

    try {
      let logo_url = editingCompany.logo_url;
      if (companyImageFile) {
        logo_url = await uploadImage(companyImageFile, 'company-logos');
      }
      
      const updateData = { ...editingCompany, logo_url };
      delete updateData.categories; 

      if (isEditingCompanyPassengerTransport) {
        updateData.whatsapp_numbers = filledWhatsappNumbers;
        updateData.whatsapp_number = null;
      } else {
        const whatsapp = editingCompany.whatsapp_number || '';
        updateData.whatsapp_number = whatsapp.startsWith('+55') ? whatsapp : `+55${whatsapp}`;
        updateData.whatsapp_numbers = [];
      }

      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', editingCompany.id)
        .select('*, categories(name)')
        .single();
      if (error) throw error;
      setCompanies(prev => prev.map(c => c.id === editingCompany.id ? data : c));
      toast({ title: "Sucesso", description: "Empresa atualizada com sucesso." });
      setEditingCompany(null);
      setCompanyImageFile(null);
      setCompanyImagePreview(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar empresa", description: error.message });
    }
  };

  const handleUpdateCompanyStatus = async (companyId, status) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ status })
        .eq('id', companyId)
        .select('*, categories(name)')
        .single();

      if (error) throw error;

      setCompanies(prev => prev.map(c => c.id === companyId ? data : c));
      toast({ title: "Sucesso", description: `Status da empresa atualizado para ${status}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: `Falha ao atualizar status: ${error.message}` });
    }
  };
  
  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm("Tem certeza que deseja deletar esta empresa? Esta ação é irreversível e removerá todos os dados associados.")) return;
    try {
      const { error } = await supabase.from('companies').delete().eq('id', companyId);
      if (error) throw error;
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      toast({ title: "Sucesso", description: "Empresa deletada com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao deletar empresa", description: error.message });
    }
  };

  const handleAddPost = async () => {
    if (!newPost.content) {
        toast({ variant: "destructive", title: "Erro", description: "O conteúdo do post é obrigatório." });
        return;
    }
    try {
        const image_url = await uploadImage(postImageFile, 'post-images');
        const { data, error } = await supabase.from('posts').insert([{ ...newPost, user_id: authUser.user_id, image_url }]).select('*, profiles(name, user_id)').single();
        if (error) throw error;
        setPosts(prev => [data, ...prev]);
        toast({ title: "Sucesso", description: "Post adicionado com sucesso." });
        setAddPostDialogOpen(false);
        setNewPost({ content: '', status: 'approved' });
        setPostImageFile(null);
        setPostImagePreview(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao adicionar post", description: error.message });
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    try {
      let image_url = editingPost.image_url;
      if (postImageFile) {
        image_url = await uploadImage(postImageFile, 'post-images');
      }
      
      const updateData = { ...editingPost };
      delete updateData.profiles; 

      const { data, error } = await supabase
        .from('posts')
        .update({ ...updateData, image_url })
        .eq('id', editingPost.id)
        .select('*, profiles(name, user_id)')
        .single();
      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === editingPost.id ? data : p));
      toast({ title: "Sucesso", description: "Post atualizado com sucesso." });
      setEditingPost(null);
      setPostImageFile(null);
      setPostImagePreview(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar post", description: error.message });
    }
  };

  const handleUpdatePostStatus = async (postId, status) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ status })
        .eq('id', postId)
        .select('*, profiles(name, user_id)')
        .single();

      if (error) throw error;

      setPosts(prev => prev.map(p => p.id === postId ? data : p));
      toast({ title: "Sucesso", description: `Status do post atualizado para ${status}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: `Falha ao atualizar status: ${error.message}` });
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Tem certeza que deseja deletar este post?")) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      toast({ title: "Sucesso", description: "Post deletado com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao deletar post", description: error.message });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.whatsapp_number) {
        toast({ variant: "destructive", title: "Erro", description: "Nome, Preço e WhatsApp são obrigatórios." });
        return;
    }
    try {
        const image_url = await uploadImage(productImageFile, 'product-images');
        const finalWhatsappNumber = `+55${newProduct.whatsapp_number}`;
        const { data, error } = await supabase.from('products').insert([{ ...newProduct, user_id: authUser.user_id, price: parseFloat(newProduct.price), image_url, whatsapp_number: finalWhatsappNumber }]).select('*, profiles:user_id(name, user_id)').single();
        if (error) throw error;
        setProducts(prev => [data, ...prev]);
        toast({ title: "Sucesso", description: "Produto adicionado com sucesso." });
        setAddProductDialogOpen(false);
        setNewProduct({ name: '', description: '', price: '', whatsapp_number: '', status: 'approved' });
        setProductImageFile(null);
        setProductImagePreview(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao adicionar produto", description: error.message });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      let image_url = editingProduct.image_url;
      if (productImageFile) {
        image_url = await uploadImage(productImageFile, 'product-images');
      }
      
      const updateData = { ...editingProduct };
      delete updateData.profiles;
      const whatsapp = editingProduct.whatsapp_number || '';
      const finalWhatsappNumber = whatsapp.startsWith('+55') ? whatsapp : `+55${whatsapp}`;

      const { data, error } = await supabase
        .from('products')
        .update({ ...updateData, image_url, price: parseFloat(editingProduct.price), whatsapp_number: finalWhatsappNumber })
        .eq('id', editingProduct.id)
        .select('*, profiles:user_id(name, user_id)')
        .single();
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? data : p));
      toast({ title: "Sucesso", description: "Produto atualizado com sucesso." });
      setEditingProduct(null);
      setProductImageFile(null);
      setProductImagePreview(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar produto", description: error.message });
    }
  };

  const handleUpdateProductStatus = async (productId, status) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ status })
        .eq('id', productId)
        .select('*, profiles:user_id(name, user_id)')
        .single();

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === productId ? data : p));
      toast({ title: "Sucesso", description: `Status do produto atualizado para ${status}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: `Falha ao atualizar status: ${error.message}` });
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Tem certeza que deseja deletar este produto?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      toast({ title: "Sucesso", description: "Produto deletado com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao deletar produto", description: error.message });
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner.title || !bannerImageFile || !newBanner.position) {
        toast({ variant: "destructive", title: "Erro", description: "Título, Imagem e Posição são obrigatórios." });
        return;
    }
    try {
        const image_url = await uploadImage(bannerImageFile, 'banner-images');
        const { data, error } = await supabase.from('banners').insert([{ ...newBanner, user_id: authUser.user_id, image_url }]).select().single();
        if (error) throw error;
        setBanners(prev => [data, ...prev]);
        toast({ title: "Sucesso", description: "Banner adicionado com sucesso." });
        setAddBannerDialogOpen(false);
        setNewBanner({ title: '', link_url: '', position: 'topo', is_active: true });
        setBannerImageFile(null);
        setBannerImagePreview(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao adicionar banner", description: error.message });
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner || !editingBanner.title || !editingBanner.position) {
        toast({ variant: "destructive", title: "Erro", description: "Título e Posição são obrigatórios." });
        return;
    }

    try {
      let image_url = editingBanner.image_url;
      if (bannerImageFile) {
        image_url = await uploadImage(bannerImageFile, 'banner-images');
      }

      if (!image_url) {
        toast({ variant: "destructive", title: "Erro", description: "A imagem do banner é obrigatória." });
        return;
      }

      const updatePayload = {
        title: editingBanner.title,
        link_url: editingBanner.link_url,
        position: editingBanner.position,
        is_active: editingBanner.is_active,
        image_url: image_url,
      };

      const { data, error } = await supabase
        .from('banners')
        .update(updatePayload)
        .eq('id', editingBanner.id)
        .select()
        .single();

      if (error) throw error;

      setBanners(prev => prev.map(b => b.id === editingBanner.id ? data : b));
      toast({ title: "Sucesso", description: "Banner atualizado com sucesso." });
      setEditingBanner(null);
      setBannerImageFile(null);
      setBannerImagePreview(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: `Falha ao atualizar banner: ${error.message}` });
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Tem certeza que deseja deletar este banner?")) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', bannerId);
      if (error) throw error;
      setBanners(prevBanners => prevBanners.filter(b => b.id !== bannerId));
      toast({ title: "Sucesso", description: "Banner deletado com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao deletar banner", description: error.message });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
        toast({ variant: "destructive", title: "Erro", description: "O nome da categoria é obrigatório." });
        return;
    }
    try {
        const { data, error } = await supabase.from('categories').insert([newCategory]).select().single();
        if (error) throw error;
        setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: "Sucesso", description: "Categoria adicionada com sucesso." });
        setAddCategoryDialogOpen(false);
        setNewCategory({ name: '' });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao adicionar categoria", description: error.message });
    }
  };
  
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name) {
        toast({ variant: "destructive", title: "Erro", description: "O nome da categoria é obrigatório." });
        return;
    }
    try {
        const { data, error } = await supabase.from('categories').update({ name: editingCategory.name }).eq('id', editingCategory.id).select().single();
        if (error) throw error;
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? data : c).sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: "Sucesso", description: "Categoria atualizada com sucesso." });
        setEditingCategory(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar categoria", description: error.message });
    }
  };
  
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Tem certeza que deseja deletar esta categoria? Isso pode afetar empresas associadas.")) return;
    try {
        const { error } = await supabase.from('categories').delete().eq('id', categoryId);
        if (error) throw error;
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        toast({ title: "Sucesso", description: "Categoria deletada com sucesso." });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao deletar categoria", description: error.message });
    }
  };

  const handleCompanyWhatsappChange = (index, field, value, isEditing) => {
    if (isEditing) {
        const newNumbers = [...(editingCompany.whatsapp_numbers || [{ name: '', number: '' }])];
        newNumbers[index] = { ...newNumbers[index], [field]: value };
        setEditingCompany(prev => ({ ...prev, whatsapp_numbers: newNumbers }));
    } else {
        const newNumbers = [...(newCompany.whatsapp_numbers || [{ name: '', number: '' }])];
        newNumbers[index] = { ...newNumbers[index], [field]: value };
        setNewCompany(prev => ({ ...prev, whatsapp_numbers: newNumbers }));
    }
  };

  const addCompanyWhatsappField = (isEditing) => {
    if (isEditing) {
        if ((editingCompany.whatsapp_numbers || []).length < 15) {
            setEditingCompany(prev => ({ ...prev, whatsapp_numbers: [...(prev.whatsapp_numbers || []), { name: '', number: '' }] }));
        }
    } else {
        if ((newCompany.whatsapp_numbers || []).length < 15) {
            setNewCompany(prev => ({ ...prev, whatsapp_numbers: [...(prev.whatsapp_numbers || []), { name: '', number: '' }] }));
        }
    }
  };

  const removeCompanyWhatsappField = (index, isEditing) => {
    if (isEditing) {
        const newNumbers = (editingCompany.whatsapp_numbers || []).filter((_, i) => i !== index);
        setEditingCompany(prev => ({ ...prev, whatsapp_numbers: newNumbers.length > 0 ? newNumbers : [{ name: '', number: '' }] }));
    } else {
        const newNumbers = (newCompany.whatsapp_numbers || []).filter((_, i) => i !== index);
        setNewCompany(prev => ({ ...prev, whatsapp_numbers: newNumbers.length > 0 ? newNumbers : [{ name: '', number: '' }] }));
    }
  };

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

  if (loading || authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const getBannerPositionDisplayName = (position) => {
    switch (position) {
      case 'topo': return 'Topo';
      case 'intermediario': return 'Intermediário';
      default: return position;
    }
  };

  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Total de Usuários" value={stats?.total_users || 0} color="blue" />
        <StatCard icon={Building} title="Total de Empresas" value={stats?.total_companies || 0} color="purple" />
        <StatCard icon={FileText} title="Total de Posts" value={stats?.total_posts || 0} color="green" />
        <StatCard icon={ImageIcon} title="Banners Ativos" value={stats?.active_banners || 0} color="yellow" />
      </div>
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Usuários por Plano</h3>
        {stats?.users_by_plan ? (
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats.users_by_plan).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <span className="font-semibold capitalize">{plan}</span>
                <span className="px-2 py-0.5 bg-blue-500 text-white rounded-full text-sm font-bold">{count}</span>
              </div>
            ))}
          </div>
        ) : <p>Carregando...</p>}
      </div>
    </motion.div>
  );

  const renderUserManagement = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h2>
        <Button onClick={() => setAddUserDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
        </Button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Usuário</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Plano</th>
              <th scope="col" className="px-6 py-3">Tipo</th>
              <th scope="col" className="px-6 py-3">Data de Cadastro</th>
              <th scope="col" className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3">
                  <OptimizedImage src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  {user.name}
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanBadge(user.plan_type)}`}>
                    {user.plan_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.user_type === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.user_type}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user.user_id)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Redefinir Senha
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteUser(user.user_id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Alterar plano e tipo do usuário {editingUser.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="plan_type" className="text-right">Plano</label>
                <select
                  id="plan_type"
                  defaultValue={editingUser.plan_type}
                  onChange={(e) => setEditingUser({ ...editingUser, plan_type: e.target.value })}
                  className="col-span-3 p-2 border rounded-md"
                >
                  <option value="gratis">Grátis</option>
                  <option value="bronze">Bronze</option>
                  <option value="prata">Prata</option>
                  <option value="ouro">Ouro</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="user_type" className="text-right">Tipo</label>
                <select
                  id="user_type"
                  defaultValue={editingUser.user_type}
                  onChange={(e) => setEditingUser({ ...editingUser, user_type: e.target.value })}
                  className="col-span-3 p-2 border rounded-md"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
              <Button onClick={() => handleUpdateUser(editingUser.user_id, { plan_type: editingUser.plan_type, user_type: editingUser.user_type })}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>Crie uma nova conta de usuário. Uma verificação por e-mail será necessária.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="Nome Completo" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                <Input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                <Input type="password" placeholder="Senha Temporária" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                <select value={newUser.plan_type} onChange={(e) => setNewUser({...newUser, plan_type: e.target.value})} className="p-2 border rounded-md">
                    <option value="gratis">Grátis</option>
                    <option value="bronze">Bronze</option>
                    <option value="prata">Prata</option>
                    <option value="ouro">Ouro</option>
                </select>
                <select value={newUser.user_type} onChange={(e) => setNewUser({...newUser, user_type: e.target.value})} className="p-2 border rounded-md">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddUser}>Adicionar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  const renderCompanyManagement = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciamento de Empresas</h2>
        <Button onClick={() => setAddCompanyDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Empresa
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Empresa</th>
              <th scope="col" className="px-6 py-3">Categoria</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Data de Cadastro</th>
              <th scope="col" className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3">
                  <OptimizedImage src={company.logo_url} alt={company.name} className="w-10 h-10 rounded-full object-cover" />
                  {company.name}
                </td>
                <td className="px-6 py-4">{company.categories?.name || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(company.status)}`}>
                    {company.status}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(company.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const companyToEdit = {
                          ...company,
                          whatsapp_number: company.whatsapp_number ? company.whatsapp_number.replace(/^\+55/, '') : '',
                          whatsapp_numbers: company.whatsapp_numbers && company.whatsapp_numbers.length > 0 ? company.whatsapp_numbers.map(n => ({...n, number: n.number.replace(/^\+55/, '')})) : [{ name: '', number: '' }],
                        };
                        setEditingCompany(companyToEdit);
                      }}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateCompanyStatus(company.id, 'approved')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Aprovar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateCompanyStatus(company.id, 'rejected')}>
                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> Rejeitar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateCompanyStatus(company.id, 'pending')}>
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Marcar como Pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCompany(company.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={isAddCompanyDialogOpen} onOpenChange={setAddCompanyDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Adicionar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="Nome da Empresa" value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} />
                <Textarea placeholder="Descrição" value={newCompany.description} onChange={(e) => setNewCompany({...newCompany, description: e.target.value})} />
                <select value={newCompany.category_id} onChange={(e) => setNewCompany({...newCompany, category_id: e.target.value})} className="p-2 border rounded-md">
                    <option value="">Selecione uma Categoria</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                
                {isNewCompanyPassengerTransport ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contatos de WhatsApp</label>
                        {(newCompany.whatsapp_numbers || []).map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input placeholder="Nome" value={item.name} onChange={(e) => handleCompanyWhatsappChange(index, 'name', e.target.value, false)} />
                                <div className="relative flex-1">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">+55</span>
                                    <Input placeholder="35..." value={item.number} onChange={(e) => handleCompanyWhatsappChange(index, 'number', e.target.value, false)} className="pl-12" />
                                </div>
                                <Button size="icon" variant="destructive" onClick={() => removeCompanyWhatsappField(index, false)} disabled={(newCompany.whatsapp_numbers || []).length <= 1}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button onClick={() => addCompanyWhatsappField(false)} disabled={(newCompany.whatsapp_numbers || []).length >= 15}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        <label className="text-sm font-medium">WhatsApp</label>
                        <span className="absolute bottom-0 left-0 flex items-center pl-3 pb-2 text-gray-500">+55</span>
                        <Input placeholder="35..." value={newCompany.whatsapp_number} onChange={(e) => setNewCompany({...newCompany, whatsapp_number: e.target.value})} className="pl-12" />
                    </div>
                )}

                <div>
                  <label htmlFor="company-logo-upload" className="text-sm font-medium">Logo da Empresa</label>
                  {companyImagePreview && <img src={companyImagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-md my-2" />}
                  <Input id="company-logo-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setCompanyImageFile, setCompanyImagePreview)} className="mt-1" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAddCompanyDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddCompany}>Adicionar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      {editingCompany && (
        <Dialog open={!!editingCompany} onOpenChange={() => { setEditingCompany(null); setCompanyImagePreview(null); setCompanyImageFile(null); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>Editar Empresa</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <Input placeholder="Nome da Empresa" value={editingCompany.name} onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})} />
                  <Textarea placeholder="Descrição" value={editingCompany.description} onChange={(e) => setEditingCompany({...editingCompany, description: e.target.value})} />
                  <select value={editingCompany.category_id} onChange={(e) => setEditingCompany({...editingCompany, category_id: e.target.value})} className="p-2 border rounded-md">
                      <option value="">Selecione uma Categoria</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>

                  {isEditingCompanyPassengerTransport ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contatos de WhatsApp</label>
                        {(editingCompany.whatsapp_numbers || []).map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input placeholder="Nome" value={item.name || ''} onChange={(e) => handleCompanyWhatsappChange(index, 'name', e.target.value, true)} />
                                <div className="relative flex-1">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">+55</span>
                                    <Input placeholder="35..." value={item.number || ''} onChange={(e) => handleCompanyWhatsappChange(index, 'number', e.target.value, true)} className="pl-12" />
                                </div>
                                <Button size="icon" variant="destructive" onClick={() => removeCompanyWhatsappField(index, true)} disabled={(editingCompany.whatsapp_numbers || []).length <= 1}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button onClick={() => addCompanyWhatsappField(true)} disabled={(editingCompany.whatsapp_numbers || []).length >= 15}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
                        </Button>
                    </div>
                  ) : (
                    <div className="relative">
                        <label className="text-sm font-medium">WhatsApp</label>
                        <span className="absolute bottom-0 left-0 flex items-center pl-3 pb-2 text-gray-500">+55</span>
                        <Input placeholder="35..." value={editingCompany.whatsapp_number || ''} onChange={(e) => setEditingCompany({...editingCompany, whatsapp_number: e.target.value})} className="pl-12" />
                    </div>
                  )}

                  <div>
                    <label htmlFor="edit-company-logo-upload" className="text-sm font-medium">Logo da Empresa</label>
                    <OptimizedImage src={companyImagePreview || editingCompany.logo_url} alt="Preview" className="w-24 h-24 object-cover rounded-md my-2" />
                    <Input id="edit-company-logo-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setCompanyImageFile, setCompanyImagePreview)} className="mt-1" />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => { setEditingCompany(null); setCompanyImagePreview(null); setCompanyImageFile(null); }}>Cancelar</Button>
                  <Button onClick={handleUpdateCompany}>Salvar</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );

  const renderContentManagement = (title, data, onStatusUpdate, onDelete, type) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        <Button onClick={() => type === 'post' ? setAddPostDialogOpen(true) : setAddProductDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar {type === 'post' ? 'Post' : 'Produto'}
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Conteúdo</th>
              <th scope="col" className="px-6 py-3">Autor</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Data</th>
              <th scope="col" className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                  {type === 'post' ? item.content : item.name}
                </td>
                <td className="px-6 py-4">{item.profiles?.name || item.profiles?.user?.name || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const itemToEdit = type === 'post' ? item : { ...item, whatsapp_number: item.whatsapp_number ? item.whatsapp_number.replace(/^\+55/, '') : '' };
                        type === 'post' ? setEditingPost(itemToEdit) : setEditingProduct(itemToEdit);
                      }}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'approved')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Aprovar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'rejected')}>
                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> Rejeitar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'pending')}>
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Marcar como Pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={isAddPostDialogOpen} onOpenChange={setAddPostDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Adicionar Novo Post</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Textarea placeholder="O que está acontecendo?" value={newPost.content} onChange={(e) => setNewPost({...newPost, content: e.target.value})} />
                <div>
                  <label htmlFor="post-image-upload" className="text-sm font-medium">Imagem (opcional)</label>
                  {postImagePreview && <img src={postImagePreview} alt="Preview" className="w-full max-h-60 object-cover rounded-md my-2" />}
                  <Input id="post-image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setPostImageFile, setPostImagePreview)} className="mt-1" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAddPostDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddPost}>Adicionar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => { setEditingPost(null); setPostImagePreview(null); setPostImageFile(null); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Editar Post</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <Textarea placeholder="O que está acontecendo?" value={editingPost.content} onChange={(e) => setEditingPost({...editingPost, content: e.target.value})} />
                  <div>
                    <label htmlFor="edit-post-image-upload" className="text-sm font-medium">Imagem (opcional)</label>
                    <OptimizedImage src={postImagePreview || editingPost.image_url} alt="Preview" className="w-full max-h-60 object-cover rounded-md my-2" />
                    <Input id="edit-post-image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setPostImageFile, setPostImagePreview)} className="mt-1" />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => { setEditingPost(null); setPostImagePreview(null); setPostImageFile(null); }}>Cancelar</Button>
                  <Button onClick={handleUpdatePost}>Salvar</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="Nome do Produto" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                <Textarea placeholder="Descrição" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                <Input type="number" placeholder="Preço (ex: 29.99)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                <div className="relative">
                    <label className="text-sm font-medium">WhatsApp</label>
                    <span className="absolute bottom-0 left-0 flex items-center pl-3 pb-2 text-gray-500">+55</span>
                    <Input placeholder="35..." value={newProduct.whatsapp_number} onChange={(e) => setNewProduct({...newProduct, whatsapp_number: e.target.value})} className="pl-12" />
                </div>
                <div>
                  <label htmlFor="product-image-upload" className="text-sm font-medium">Imagem do Produto</label>
                  {productImagePreview && <img src={productImagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-md my-2" />}
                  <Input id="product-image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setProductImageFile, setProductImagePreview)} className="mt-1" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAddProductDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddProduct}>Adicionar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => { setEditingProduct(null); setProductImagePreview(null); setProductImageFile(null); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Editar Produto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <Input placeholder="Nome do Produto" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
                  <Textarea placeholder="Descrição" value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} />
                  <Input type="number" placeholder="Preço (ex: 29.99)" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} />
                  <div className="relative">
                      <label className="text-sm font-medium">WhatsApp</label>
                      <span className="absolute bottom-0 left-0 flex items-center pl-3 pb-2 text-gray-500">+55</span>
                      <Input placeholder="35..." value={editingProduct.whatsapp_number} onChange={(e) => setEditingProduct({...editingProduct, whatsapp_number: e.target.value})} className="pl-12" />
                  </div>
                  <div>
                    <label htmlFor="edit-product-image-upload" className="text-sm font-medium">Imagem do Produto</label>
                    <OptimizedImage src={productImagePreview || editingProduct.image_url} alt="Preview" className="w-24 h-24 object-cover rounded-md my-2" />
                    <Input id="edit-product-image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setProductImageFile, setProductImagePreview)} className="mt-1" />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => { setEditingProduct(null); setProductImagePreview(null); setProductImageFile(null); }}>Cancelar</Button>
                  <Button onClick={handleUpdateProduct}>Salvar</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );

  const renderBannerManagement = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciamento de Banners</h2>
        <Button onClick={() => setAddBannerDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Banner
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Título</th>
              <th scope="col" className="px-6 py-3">Posição</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {banners.map(banner => (
              <tr key={banner.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                  <OptimizedImage src={banner.image_url} alt={banner.title} className="w-16 h-9 rounded object-cover" />
                  {banner.title}
                </td>
                <td className="px-6 py-4">{getBannerPositionDisplayName(banner.position)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {banner.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingBanner(banner)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteBanner(banner.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingBanner && (
        <Dialog open={!!editingBanner} onOpenChange={() => { setEditingBanner(null); setBannerImagePreview(null); setBannerImageFile(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Banner</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="Título" value={editingBanner.title} onChange={(e) => setEditingBanner({...editingBanner, title: e.target.value})} />
                <Input placeholder="URL do Link (opcional)" value={editingBanner.link_url || ''} onChange={(e) => setEditingBanner({...editingBanner, link_url: e.target.value})} />
                <select value={editingBanner.position} onChange={(e) => setEditingBanner({...editingBanner, position: e.target.value})} className="p-2 border rounded-md">
                    <option value="topo">Topo</option>
                    <option value="intermediario">Intermediário</option>
                </select>
                <div>
                  <label htmlFor="edit-banner-image-upload" className="text-sm font-medium">Imagem do Banner</label>
                  <OptimizedImage src={bannerImagePreview || editingBanner.image_url} alt="Preview" className="w-full max-h-40 object-cover rounded-md my-2" />
                  <Input id="edit-banner-image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBannerImageFile, setBannerImagePreview)} className="mt-1" />
                </div>
                 <div className="flex items-center space-x-2">
                    <input type="checkbox" id="edit-banner-active" checked={editingBanner.is_active} onChange={(e) => setEditingBanner({...editingBanner, is_active: e.target.checked})} />
                    <label htmlFor="edit-banner-active">Ativo</label>
                </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingBanner(null); setBannerImagePreview(null); setBannerImageFile(null); }}>Cancelar</Button>
              <Button onClick={handleUpdateBanner}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isAddBannerDialogOpen} onOpenChange={setAddBannerDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Adicionar Novo Banner</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="Título" value={newBanner.title} onChange={(e) => setNewBanner({...newBanner, title: e.target.value})} />
                <Input placeholder="URL do Link (opcional)" value={newBanner.link_url} onChange={(e) => setNewBanner({...newBanner, link_url: e.target.value})} />
                <select value={newBanner.position} onChange={(e) => setNewBanner({...newBanner, position: e.target.value})} className="p-2 border rounded-md">
                    <option value="topo">Topo</option>
                    <option value="intermediario">Intermediário</option>
                </select>
                <div>
                  <label htmlFor="banner-image-upload" className="text-sm font-medium">Imagem do Banner</label>
                  {bannerImagePreview && <img src={bannerImagePreview} alt="Preview" className="w-full max-h-40 object-cover rounded-md my-2" />}
                  <Input id="banner-image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBannerImageFile, setBannerImagePreview)} className="mt-1" />
                </div>
                 <div className="flex items-center space-x-2">
                    <input type="checkbox" id="banner-active" checked={newBanner.is_active} onChange={(e) => setNewBanner({...newBanner, is_active: e.target.checked})} />
                    <label htmlFor="banner-active">Ativo</label>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAddBannerDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddBanner}>Adicionar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  const renderCategoryManagement = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Gerenciamento de Categorias</h2>
            <Button onClick={() => setAddCategoryDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Categoria
            </Button>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">Data de Criação</th>
                        <th scope="col" className="px-6 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(category => (
                        <tr key={category.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                            <td className="px-6 py-4">{new Date(category.created_at).toLocaleDateString('pt-BR')}</td>
                            <td className="px-6 py-4 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteCategory(category.id)} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Deletar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <Dialog open={isAddCategoryDialogOpen} onOpenChange={setAddCategoryDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input placeholder="Nome da Categoria" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setAddCategoryDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAddCategory}>Adicionar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        {editingCategory && (
            <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                        <Button onClick={handleUpdateCategory}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </motion.div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart, content: renderDashboard() },
    { id: 'users', label: 'Usuários', icon: Users, content: renderUserManagement() },
    { id: 'companies', label: 'Empresas', icon: Building, content: renderCompanyManagement() },
    { id: 'categories', label: 'Categorias', icon: ClipboardList, content: renderCategoryManagement() },
    { id: 'posts', label: 'Posts', icon: FileText, content: renderContentManagement('Moderação de Posts', posts, handleUpdatePostStatus, handleDeletePost, 'post') },
    { id: 'products', label: 'Produtos', icon: FileText, content: renderContentManagement('Moderação de Produtos', products, handleUpdateProductStatus, handleDeleteProduct, 'product') },
    { id: 'banners', label: 'Banners', icon: ImageIcon, content: renderBannerManagement() },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <div className="sticky top-24">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Painel Admin</h1>
              <nav className="flex flex-col space-y-2">
                {tabs.map(tab => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="mr-3 h-5 w-5" />
                    {tab.label}
                  </Button>
                ))}
              </nav>
            </div>
          </aside>
          <main className="flex-1">
            {tabs.find(tab => tab.id === activeTab)?.content}
          </main>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }) => {
  const colors = {
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600',
    green: 'from-green-400 to-green-600',
    yellow: 'from-yellow-400 to-yellow-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white p-6 rounded-xl shadow-lg`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const getPlanBadge = (plan) => {
  switch (plan) {
    case 'ouro': return 'bg-yellow-100 text-yellow-800';
    case 'prata': return 'bg-gray-200 text-gray-800';
    case 'bronze': return 'bg-orange-100 text-orange-800';
    default: return 'bg-green-100 text-green-800';
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default AdminPage;