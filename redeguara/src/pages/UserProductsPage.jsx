import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ShoppingBag, Loader2, Image as ImageIcon, Package, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { optimizeSupabaseImage } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

const StatusPill = ({ status }) => {
  const statusMap = {
    approved: { text: 'Aprovado', color: 'bg-green-100 text-green-800' },
    pending: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    rejected: { text: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  };
  const currentStatus = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${currentStatus.color}`}>{currentStatus.text}</span>;
};

const ProductFormModal = ({ isOpen, setIsOpen, product, onSave, user }) => {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    if (product) {
      setWhatsappNumber(product.whatsapp_number ? product.whatsapp_number.replace(/^\+55/, '') : '');
      if (product.image_url) {
        setImagePreview(product.image_url);
      } else {
        setImagePreview(null);
      }
    } else {
      setWhatsappNumber('');
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, isOpen]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 600,
        useWebWorker: true
      }
      try {
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast({ variant: "destructive", title: "Erro ao comprimir imagem", description: "Tente uma imagem menor." });
        setImageFile(null);
        setImagePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const record = Object.fromEntries(formData.entries());
    
    try {
      let imageUrl = product?.image_url || null;

      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
      }
      
      delete record.image_file;
      record.image_url = imageUrl;
      record.price = parseFloat(record.price);
      record.whatsapp_number = `+55${whatsappNumber}`;

      let query;
      if (product?.id) {
        query = supabase.from('products').update(record).eq('id', product.id);
      } else {
        record.user_id = user.id;
        record.status = 'pending';
        query = supabase.from('products').insert([record]);
      }

      const { data, error } = await query.select().single();
      if (error) throw error;

      toast({ title: "Sucesso!", description: "Seu produto foi enviado para aprovação!" });
      onSave(data, product?.id);
      setIsOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar produto", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product?.id ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea id="description" name="description" defaultValue={product?.description} className="w-full p-2 border rounded-md" rows="3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" name="category" defaultValue={product?.category} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp para Contato</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">+55</span>
              <Input id="whatsapp_number" name="whatsapp_number" placeholder="35..." value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} required className="pl-12"/>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image_file">Imagem do Produto</Label>
            {imagePreview && <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-md my-2" />}
            <Input id="image_file" name="image_file" type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <DialogFooter className="sticky bottom-0 bg-white pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UserProductsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao carregar produtos", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.plan_type !== 'prata' && user.plan_type !== 'ouro' && user.user_type !== 'admin')) {
        toast({ variant: "destructive", title: "Acesso Negado", description: "Você precisa de um plano Prata ou Ouro para cadastrar produtos." });
        navigate('/');
      } else {
        fetchProducts();
      }
    }
  }, [user, authLoading, navigate, fetchProducts]);

  const onSaveSuccess = useCallback((savedProduct, originalId) => {
    if (originalId) { // It was an edit
      setProducts(prev => prev.map(p => p.id === originalId ? savedProduct : p));
    } else { // It was a new product
      setProducts(prev => [savedProduct, ...prev]);
    }
  }, []);

  const openModal = (product = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast({ title: "Excluído!", description: "Produto excluído com sucesso." });
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center"><ShoppingBag className="mr-3" />Meus Produtos</h1>
            <p className="text-gray-600">Gerencie os produtos que você anunciou no marketplace.</p>
          </div>
          <Button onClick={() => openModal()} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" /><span>Novo Produto</span>
          </Button>
        </motion.div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-gray-100 relative">
                  {product.image_url ? (
                    <img src={optimizeSupabaseImage(product.image_url, 400, 300, 60, 'cover')} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusPill status={product.status} />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                  <p className="text-green-600 font-semibold text-md mt-1">R$ {product.price}</p>
                  <p className="text-sm text-gray-600 mt-2 flex-grow line-clamp-3">{product.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openModal(product)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(product.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Você ainda não tem produtos.</h2>
            <p className="text-gray-600 mt-2 mb-6">Comece a vender! Adicione seu primeiro produto e alcance toda a cidade.</p>
            <Button onClick={() => openModal()}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Primeiro Produto
            </Button>
          </div>
        )}
      </div>
      {isModalOpen && <ProductFormModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} product={selectedProduct} onSave={onSaveSuccess} user={user} />}
    </div>
  );
};

export default UserProductsPage;