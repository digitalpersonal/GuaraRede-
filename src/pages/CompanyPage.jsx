import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Building, Mail, MapPin, Phone, Globe, Edit, Save, X, Trash2, ArrowLeft, Plus, Users, MessageSquare, Star, Image as ImageIcon, CheckCircle, AlertTriangle, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import OptimizedImage from '@/components/OptimizedImage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import imageCompression from 'browser-image-compression';

const CompanyPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [categories, setCategories] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCompanyData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*, categories(id, name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCompany(data);
      const initialEditData = {
        ...data,
        whatsapp_number: data.whatsapp_number ? data.whatsapp_number.replace(/^\+55/, '') : '',
        whatsapp_numbers: data.whatsapp_numbers && data.whatsapp_numbers.length > 0 
            ? data.whatsapp_numbers.map(n => ({...n, number: n.number.replace(/^\+55/, '')})) 
            : [{ name: '', number: '' }],
      };
      setEditData(initialEditData);
      setLogoPreview(data.logo_url);
      setIsOwner(user && (user.user_id === data.user_id || user.user_type === 'admin'));

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados da empresa",
        description: error.message,
      });
      navigate('/guia-comercial');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar categorias",
        description: error.message,
      });
    }
  }, []);

  useEffect(() => {
    fetchCompanyData();
    fetchCategories();
  }, [fetchCompanyData, fetchCategories]);
  
  const isPassengerTransport = useMemo(() => {
    const category = isEditing 
        ? categories.find(c => String(c.id) === String(editData.category_id))
        : company?.categories;
    return category?.name === 'Transporte de Passageiros';
  }, [editData.category_id, categories, company, isEditing]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsappChange = (index, field, value) => {
    const newNumbers = [...(editData.whatsapp_numbers || [{name: '', number: ''}])];
    newNumbers[index] = { ...newNumbers[index], [field]: value };
    setEditData(prev => ({ ...prev, whatsapp_numbers: newNumbers }));
  };

  const addWhatsappField = () => {
    if ((editData.whatsapp_numbers || []).length < 15) {
      setEditData(prev => ({ ...prev, whatsapp_numbers: [...(prev.whatsapp_numbers || []), { name: '', number: '' }] }));
    }
  };

  const removeWhatsappField = (index) => {
    const newNumbers = (editData.whatsapp_numbers || []).filter((_, i) => i !== index);
    setEditData(prev => ({ ...prev, whatsapp_numbers: newNumbers.length > 0 ? newNumbers : [{ name: '', number: '' }] }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return editData.logo_url;

    const compressedFile = await imageCompression(logoFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    });
    
    const fileName = `${user.user_id}/${Date.now()}-${compressedFile.name}`;
    const { data, error } = await supabase.storage
      .from('company-logos')
      .upload(fileName, compressedFile);

    if (error) {
      throw new Error(`Erro ao enviar logo: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const filledWhatsappNumbers = (editData.whatsapp_numbers || [])
        .filter(w => w.name && w.number)
        .map(w => ({ ...w, number: w.number.startsWith('+55') ? w.number : `+55${w.number}` }));

    if (isPassengerTransport) {
        if (filledWhatsappNumbers.length === 0) {
            toast({ variant: "destructive", title: "Erro", description: "Adicione ao menos um contato de WhatsApp completo (nome e número)." });
            setIsSaving(false);
            return;
        }
    } else {
        if (!editData.whatsapp_number) {
            toast({ variant: "destructive", title: "Erro", description: "O número do WhatsApp é obrigatório." });
            setIsSaving(false);
            return;
        }
    }

    try {
      let logoUrl = await uploadLogo();

      const updatePayload = {
        name: editData.name,
        description: editData.description,
        email: editData.email,
        address: editData.address,
        category_id: editData.category_id,
        logo_url: logoUrl,
      };

      if (isPassengerTransport) {
        updatePayload.whatsapp_numbers = filledWhatsappNumbers;
        updatePayload.whatsapp_number = null;
      } else {
        updatePayload.whatsapp_number = editData.whatsapp_number.startsWith('+55') ? editData.whatsapp_number : `+55${editData.whatsapp_number}`;
        updatePayload.whatsapp_numbers = [];
      }
      
      const { error } = await supabase
        .from('companies')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso!",
        description: "Dados da empresa atualizados.",
      });
      setIsEditing(false);
      fetchCompanyData();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex-grow flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;
  }

  if (!company) {
    return <div className="flex-grow flex items-center justify-center text-center">Empresa não encontrada.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Responsive Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-green-400 p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
              {/* Logo Section */}
              {isEditing ? (
                <div className="relative w-32 h-32 flex-shrink-0">
                  <OptimizedImage 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-md object-contain" 
                    width={128} 
                    height={128}
                    resize="contain"
                  />
                  <label htmlFor="logo-upload" className="absolute bottom-0 right-0 bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors z-10">
                    <Edit className="w-4 h-4 text-blue-500" />
                  </label>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              ) : (
                <div className="relative w-32 h-32 flex-shrink-0">
                   <OptimizedImage 
                        src={company.logo_url} 
                        alt={company.name} 
                        className="w-full h-full rounded-full overflow-hidden bg-white border-4 border-white shadow-md object-contain" 
                        width={128} 
                        height={128}
                        resize="contain"
                    />
                </div>
              )}

              {/* Text Content Section */}
              <div className="text-center sm:text-left flex-1 min-w-0 w-full sm:w-auto">
                {isEditing ? (
                  <Input 
                    name="name" 
                    value={editData.name || ''} 
                    onChange={handleEditChange} 
                    className="text-2xl sm:text-3xl font-bold bg-transparent text-white border-white/50 placeholder-white/70 w-full mb-2" 
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold break-words leading-tight">
                    {company.name}
                  </h1>
                )}
                
                <div className="mt-2 text-blue-50 text-base sm:text-lg font-medium break-words leading-snug">
                    {isEditing ? (
                        categories.find(c => String(c.id) === String(editData.category_id))?.name || 'Sem Categoria'
                    ) : (
                        company.categories?.name || 'Sem Categoria'
                    )}
                </div>
              </div>
            </div>

            {/* Edit/Action Buttons */}
            {isOwner && (
              <div className="absolute top-4 right-4 flex gap-2">
                {isEditing ? (
                  <>
                    <Button size="icon" onClick={handleSave} disabled={isSaving} className="h-8 w-8 sm:h-10 sm:w-10">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="bg-white/20 hover:bg-white/30 h-8 w-8 sm:h-10 sm:w-10" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button size="icon" onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white/30 text-white border border-white/40 h-8 w-8 sm:h-10 sm:w-10">
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="p-6 sm:p-8 space-y-8">
            <div>
              <h2 className="font-bold text-gray-700 text-xl mb-2 flex items-center">
                 <Building className="w-5 h-5 mr-2 text-blue-500" /> Sobre Nós
              </h2>
              {isEditing ? (
                <Textarea name="description" value={editData.description || ''} onChange={handleEditChange} className="w-full" rows={4} />
              ) : (
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {company.description ? <MarkdownRenderer content={company.description} /> : <p className="text-gray-500 italic">Nenhuma descrição fornecida.</p>}
                 </div>
              )}
            </div>

            <div>
              <h2 className="font-bold text-gray-700 text-xl mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-green-500" /> Contato
              </h2>
              <div className="space-y-4 bg-white p-1 rounded-lg">
                <InfoItem icon={Mail} label="Email" isEditing={isEditing} fieldName="email" value={editData.email} onChange={handleEditChange} href={`mailto:${company.email}`} />
                <InfoItem icon={MapPin} label="Endereço" isEditing={isEditing} fieldName="address" value={editData.address} onChange={handleEditChange} />

                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select name="category_id" value={editData.category_id || ''} onChange={(e) => {
                      handleEditChange(e);
                    }} className="w-full p-2 border border-gray-300 rounded-md">
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                )}

                {isPassengerTransport ? (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">Contatos de WhatsApp</h3>
                    {isEditing ? (
                      <div className="space-y-3">
                        {(editData.whatsapp_numbers || [{ name: '', number: '' }]).map((item, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-gray-50 p-3 rounded-md">
                            <Input type="text" value={item?.name || ''} onChange={(e) => handleWhatsappChange(index, 'name', e.target.value)} placeholder="Nome" className="sm:col-span-1" />
                            <div className="relative flex-1 sm:col-span-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">+55</span>
                                <Input type="tel" value={item?.number || ''} onChange={(e) => handleWhatsappChange(index, 'number', e.target.value)} placeholder="11999999999" className="pl-10" />
                            </div>
                            <Button size="icon" variant="destructive" onClick={() => removeWhatsappField(index)} disabled={(editData.whatsapp_numbers || []).length <= 1} className="w-full sm:w-auto">
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button onClick={addWhatsappField} disabled={(editData.whatsapp_numbers || []).length >= 15} variant="outline" className="w-full border-dashed">
                          <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Contato
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(company.whatsapp_numbers || []).filter(item => item && item.number).map((item, index) => (
                          <Button asChild key={index} className="w-full bg-green-600 hover:bg-green-700 text-white transition-all shadow-sm hover:shadow-md h-12 text-base">
                            <a href={`https://wa.me/${item.number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                              <MessageSquare className="w-5 h-5" />
                              <span className="truncate">{item.name || `Contato ${index + 1}`}</span>
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  isEditing ? (
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                        <div className="relative mt-1">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">+55</span>
                           <Input name="whatsapp_number" value={editData.whatsapp_number || ''} onChange={handleEditChange} className="pl-12 text-gray-800" placeholder="11999999999" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    company.whatsapp_number && (
                       <div className="flex items-start gap-4">
                            <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                                <Phone className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500 mb-1">WhatsApp</p>
                                <Button asChild className="bg-green-500 text-white hover:bg-green-600 transition-colors px-4 py-2 h-auto text-base w-full sm:w-auto">
                                    <a href={`https://wa.me/${company.whatsapp_number?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Iniciar conversa
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )
                  )
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Guia Comercial
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, isEditing, fieldName, onChange, href }) => {
  if (isEditing) {
    return (
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <Input name={fieldName} value={value || ''} onChange={onChange} className="text-gray-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4">
      <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-800 font-semibold hover:text-blue-600 transition-colors break-words block">
            {value || 'Não informado'}
          </a>
        ) : (
          <p className="text-gray-800 font-semibold break-words">{value || 'Não informado'}</p>
        )}
      </div>
    </div>
  );
};

export default CompanyPage;