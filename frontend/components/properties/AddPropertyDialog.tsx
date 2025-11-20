import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { Plus, Upload, X, Calculator, Flame, CreditCard } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { PROPERTY_TYPE_GROUPS } from '@/components/properties/property-types';
import { usePropertyTypes } from '@/hooks/usePropertyTypes';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { toSlug } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

interface AddPropertyDialogProps {
  onPropertyAdded: () => void;
}

const AddPropertyDialog = ({ onPropertyAdded }: AddPropertyDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  interface Realtor {
    id: string;
    name: string;
    creci: string | null;
    is_active: boolean;
    avatar_url: string | null;
  }

  const fetchRealtors = useCallback(async () => {
    try {
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (brokerData) {
        const { data: realtorsData } = await supabase
          .from('realtors')
          .select('id, name, creci, is_active, avatar_url')
          .eq('broker_id', brokerData.id)
          .eq('is_active', true)
          .order('name');

        setRealtors(realtorsData || []);
        
        // Carregar categorias ativas
        const { data: categoriesData } = await supabase
          .from('property_categories')
          .select('id, name, color')
          .eq('broker_id', brokerData.id)
          .eq('is_active', true)
          .order('display_order');
        
        setAvailableCategories(categoriesData || []);
      }
    } catch (error) {
      logger.error('Error fetching realtors:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchRealtors();
    }
  }, [user, fetchRealtors]);
  const [open, setOpen] = useState(false);
  const [loading, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{id: string, name: string, color: string | null}>>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    property_type: 'apartment',
    transaction_type: 'sale',
    address: '',
    neighborhood: '',
    city: '',
    uf: '',
    bedrooms: '',
    bathrooms: '',
    area_m2: '',
    parking_spaces: '',
    is_featured: false,
    categories: [] as string[],
    features: [] as string[],
    property_code: '',
    realtor_id: '',
    // Campos de financiamento
    financing_enabled: false,
    financing_down_payment_percentage: '30',
    financing_max_installments: '360',
    financing_interest_rate: '0.8',
    // Campos de badge de oportunidade
    show_opportunity_badge: false,
    opportunity_badge_text: 'Oportunidade!',
    // Campos de formas de pagamento
    payment_methods_type: 'none' as 'none' | 'text' | 'banner',
    payment_methods_text: [] as string[],
    payment_methods_banner_url: '',
  });

  const { groups: propertyTypes, valueToId } = usePropertyTypes();

  const transactionTypes = [
    { value: 'sale', label: 'Venda' },
    { value: 'rent', label: 'Aluguel' },
  ];

  // periodicidades removidas com a retirada das informações gerais

  const commonFeatures = [
    'Garagem', 'Piscina', 'Elevador', 'Portaria 24h', 'Área de lazer',
    'Academia', 'Salão de festas', 'Varanda', 'Área gourmet', 'Jardim'
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleAddPaymentMethod = (method: string) => {
    if (method.trim() && !formData.payment_methods_text.includes(method.trim())) {
      setFormData(prev => ({
        ...prev,
        payment_methods_text: [...prev.payment_methods_text, method.trim()]
      }));
    }
  };

  const handleRemovePaymentMethod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      payment_methods_text: prev.payment_methods_text.filter((_, i) => i !== index)
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files].slice(0, 10)); // Max 10 images
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    if (currentImageUrl.trim()) {
      setImageUrls(prev => [...prev, currentImageUrl.trim()]);
      setCurrentImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];
    
    for (const file of selectedImages) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `property-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const getBrokerProfile = async () => {
    // First try to get existing broker profile
    const { data: existingBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (existingBroker) {
      return existingBroker.id;
    }

    // If no broker profile exists, create one
    const { data: newBroker, error } = await supabase
      .from('brokers')
      .insert({
        user_id: user?.id,
        business_name: 'Minha Imobiliária',
        email: user?.email || '',
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        plan_type: 'free',
        is_active: true,
        max_properties: 5
      })
      .select('id')
      .single();

    if (error) throw error;
    return newBroker.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Get broker ID
      const brokerId = await getBrokerProfile();

      // Upload images and combine with URLs
      const uploadedUrls = await uploadImages();
      const allImageUrls = [...uploadedUrls, ...imageUrls];

      // Create property
      const insertPayload: Database['public']['Tables']['properties']['Insert'] = {
        broker_id: brokerId,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        property_type: formData.property_type,
        transaction_type: formData.transaction_type,
        address: formData.address,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        uf: formData.uf || null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
        parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
        is_featured: formData.is_featured,
        features: formData.features,
        images: allImageUrls,
        main_image_url: allImageUrls[0] || null,
        property_code: formData.property_code,
        realtor_id: formData.realtor_id || null,
        // Campos de financiamento
        financing_enabled: formData.financing_enabled && formData.transaction_type === 'sale',
        financing_down_payment_percentage: formData.financing_enabled 
          ? parseFloat(formData.financing_down_payment_percentage) 
          : null,
        financing_max_installments: formData.financing_enabled 
          ? parseInt(formData.financing_max_installments) 
          : null,
        financing_interest_rate: formData.financing_enabled 
          ? parseFloat(formData.financing_interest_rate) 
          : null,
        // Campos de badge de oportunidade
        show_opportunity_badge: formData.show_opportunity_badge,
        opportunity_badge_text: formData.show_opportunity_badge 
          ? formData.opportunity_badge_text 
          : null,
        // Campos de formas de pagamento
        payment_methods_type: formData.payment_methods_type,
        payment_methods_text: formData.payment_methods_type === 'text' 
          ? formData.payment_methods_text 
          : null,
        payment_methods_banner_url: formData.payment_methods_type === 'banner' 
          ? formData.payment_methods_banner_url 
          : null,
    // mínimos obrigatórios adicionais
        is_active: true,
  slug: toSlug(formData.title),
    // Informações gerais removidas do formulário
      };

      // If DB taxonomy available, include foreign key id
    const mappedId = valueToId.get(formData.property_type);
    if (mappedId) insertPayload.property_type_id = mappedId;

      const { data: newProperty, error } = await supabase
        .from('properties')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error) throw error;

      // Associar imóvel às categorias selecionadas
      if (formData.categories.length > 0 && newProperty) {
        const categoryAssignments = formData.categories.map(categoryId => ({
          property_id: newProperty.id,
          category_id: categoryId,
          broker_id: brokerId,
        }));

        const { error: categoryError } = await supabase
          .from('property_category_assignments')
          .insert(categoryAssignments);

        if (categoryError) {
          logger.error('Error assigning categories:', categoryError);
          // Não falhar a operação inteira, apenas logar erro
        }
      }

      toast({
        title: "Imóvel adicionado",
        description: "O imóvel foi cadastrado com sucesso!"
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        property_type: 'apartment',
        transaction_type: 'sale',
        address: '',
        neighborhood: '',
        city: '',
        uf: '',
        bedrooms: '',
        bathrooms: '',
        area_m2: '',
        parking_spaces: '',
        is_featured: false,
        categories: [],
        features: [],
        property_code: '',
        realtor_id: '',
        financing_enabled: false,
        financing_down_payment_percentage: '30',
        financing_max_installments: '360',
        financing_interest_rate: '0.8',
        show_opportunity_badge: false,
        opportunity_badge_text: 'Oportunidade!',
        payment_methods_type: 'none',
        payment_methods_text: [],
        payment_methods_banner_url: '',
      });
      setSelectedImages([]);
      setImageUrls([]);
      setCurrentImageUrl('');
      setOpen(false);
      onPropertyAdded();

    } catch (error: unknown) {
      toast({
        title: "Erro ao adicionar imóvel",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Imóvel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Imóvel</DialogTitle>
          <DialogDescription>
            Preencha as informações do imóvel para adicionar ao seu catálogo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes do Imóvel</TabsTrigger>
              <TabsTrigger value="vendas">Vendas & Marketing</TabsTrigger>
            </TabsList>

            {/* TAB 1: INFORMAÇÕES BÁSICAS */}
            <TabsContent value="basico" className="space-y-4 mt-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Apartamento 3 quartos no Centro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="500000"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="property_code">Código do Imóvel</Label>
                  <Input
                    id="property_code"
                    value={formData.property_code}
                    onChange={(e) => handleInputChange('property_code', e.target.value)}
                    placeholder="Ex: COD001, REF123, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Corretor Responsável</Label>
                  <Select
                    value={formData.realtor_id}
                    onValueChange={(value) => handleInputChange('realtor_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar corretor" />
                    </SelectTrigger>
                    <SelectContent>
                      {realtors.map(realtor => (
                        <SelectItem key={realtor.id} value={realtor.id}>
                          {realtor.name} {realtor.creci && `(${realtor.creci})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Imóvel *</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => handleInputChange('property_type', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(group => (
                        <SelectGroup key={group.label}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Transação *</Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value) => handleInputChange('transaction_type', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Venda ou Aluguel" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo (Rua, Número) *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Ex: Rua das Flores, 123, Apto 45"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Ex: Centro, Jardins"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">Estado (UF)</Label>
                  <Input
                    id="uf"
                    value={formData.uf}
                    onChange={(e) => handleInputChange('uf', e.target.value)}
                    placeholder="Ex: SP, RJ, MG"
                    maxLength={2}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: DETALHES DO IMÓVEL */}
            <TabsContent value="detalhes" className="space-y-4 mt-4">
              {/* Property Details */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Quartos</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area_m2">Área (m²)</Label>
                  <Input
                    id="area_m2"
                    type="number"
                    value={formData.area_m2}
                    onChange={(e) => handleInputChange('area_m2', e.target.value)}
                    placeholder="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parking_spaces">Vagas</Label>
                  <Input
                    id="parking_spaces"
                    type="number"
                    value={formData.parking_spaces}
                    onChange={(e) => handleInputChange('parking_spaces', e.target.value)}
                    placeholder="2"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva as principais características do imóvel..."
                  rows={4}
                />
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Características</Label>
                <div className="flex flex-wrap gap-2">
                  {commonFeatures.map(feature => (
                    <Badge
                      key={feature}
                      variant={formData.features.includes(feature) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleFeatureToggle(feature)}
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <Label>Imagens</Label>
                
                {/* Upload de arquivos */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <label htmlFor="images" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-muted-foreground">
                          Clique para adicionar imagens ou arraste aqui
                        </span>
                        <input
                          id="images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Adicionar por URL */}
                <div className="space-y-3">
                  <Label>Ou adicione imagens por URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentImageUrl}
                      onChange={(e) => setCurrentImageUrl(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={addImageUrl}
                      disabled={!currentImageUrl.trim()}
                      variant="outline"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
                
                {/* Preview de imagens por arquivo */}
                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Imagens por arquivo</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative h-24">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          <Button
                            type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                         </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview de imagens por URL */}
                {imageUrls.length > 0 && (
              <div className="space-y-2">
                <Label>Imagens por URL</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative h-24">
                      <Image
                        src={url}
                        alt={`URL ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.border = '2px solid red';
                          (e.target as HTMLImageElement).title = 'Erro ao carregar imagem';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImageUrl(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
            />
            <Label htmlFor="is_featured">Imóvel em destaque</Label>
          </div>

          {/* Categorias */}
          {availableCategories.length > 0 && (
            <div className="space-y-3">
              <Label>Categorias do imóvel</Label>
              <p className="text-xs text-muted-foreground">
                Selecione as categorias onde este imóvel aparecerá no site público
              </p>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => {
                  const isSelected = formData.categories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        const newCategories = isSelected
                          ? formData.categories.filter(id => id !== category.id)
                          : [...formData.categories, category.id];
                        handleInputChange('categories', newCategories);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'text-white scale-105 shadow-md'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                      style={isSelected ? { backgroundColor: category.color || '#2563eb' } : {}}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
              {formData.categories.length === 0 && (
                <p className="text-xs text-amber-600">
                  ⚠️ Nenhuma categoria selecionada. O imóvel não aparecerá em seções específicas.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: VENDAS & MARKETING */}
        <TabsContent value="vendas" className="space-y-6 mt-4">
          {/* Simulador de Financiamento */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-start gap-2">
              <Calculator className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base leading-tight">Simulador de Financiamento</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              💡 Exibe uma calculadora no site público mostrando entrada e parcelas estimadas. Ideal para imóveis à venda.
            </p>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="financing_enabled"
                checked={formData.financing_enabled}
                onCheckedChange={(checked) => handleInputChange('financing_enabled', checked)}
                disabled={formData.transaction_type !== 'sale'}
              />
              <Label htmlFor="financing_enabled">
                Habilitar simulador de financiamento
                {formData.transaction_type !== 'sale' && (
                  <span className="text-xs text-muted-foreground ml-2">(apenas para venda)</span>
                )}
              </Label>
            </div>

            {formData.financing_enabled && (
              <div className="grid gap-4 md:grid-cols-3 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="financing_down_payment_percentage">Entrada (%)</Label>
                  <Input
                    id="financing_down_payment_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.financing_down_payment_percentage}
                    onChange={(e) => handleInputChange('financing_down_payment_percentage', e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="financing_max_installments">Parcelas (máx)</Label>
                  <Input
                    id="financing_max_installments"
                    type="number"
                    min="1"
                    max="600"
                    step="1"
                    value={formData.financing_max_installments}
                    onChange={(e) => handleInputChange('financing_max_installments', e.target.value)}
                    placeholder="360"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="financing_interest_rate">Taxa (% a.m.)</Label>
                  <Input
                    id="financing_interest_rate"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={formData.financing_interest_rate}
                    onChange={(e) => handleInputChange('financing_interest_rate', e.target.value)}
                    placeholder="0.80"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Use 0 para parcelamento sem juros
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Badge de Oportunidade */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-start gap-2">
              <Flame className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base leading-tight">Badge de Oportunidade</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              🏷️ Destaque este imóvel com um badge chamativo no site público. Ótimo para promoções e ofertas especiais.
            </p>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show_opportunity_badge"
                checked={formData.show_opportunity_badge}
                onCheckedChange={(checked) => handleInputChange('show_opportunity_badge', checked)}
              />
              <Label htmlFor="show_opportunity_badge">Mostrar badge "Oportunidade!"</Label>
            </div>

            {formData.show_opportunity_badge && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="opportunity_badge_text">Texto do badge</Label>
                <Input
                  id="opportunity_badge_text"
                  value={formData.opportunity_badge_text}
                  onChange={(e) => handleInputChange('opportunity_badge_text', e.target.value)}
                  placeholder="Oportunidade!"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  Prévia: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse">
                    {formData.opportunity_badge_text || 'Oportunidade!'}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Formas de Pagamento */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-start gap-2">
              <CreditCard className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base leading-tight">Formas de Pagamento</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              💳 Mostre aos interessados as opções de pagamento aceitas. Escolha entre lista de texto ou banner personalizado.
            </p>
            
            <div className="space-y-3">
              <Label>Tipo de exibição</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_methods_type"
                    value="none"
                    checked={formData.payment_methods_type === 'none'}
                    onChange={(e) => handleInputChange('payment_methods_type', e.target.value)}
                    className="h-4 w-4"
                  />
                  <span>Não exibir</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_methods_type"
                    value="text"
                    checked={formData.payment_methods_type === 'text'}
                    onChange={(e) => handleInputChange('payment_methods_type', e.target.value)}
                    className="h-4 w-4"
                  />
                  <span>Lista de texto</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_methods_type"
                    value="banner"
                    checked={formData.payment_methods_type === 'banner'}
                    onChange={(e) => handleInputChange('payment_methods_type', e.target.value)}
                    className="h-4 w-4"
                  />
                  <span>Banner/imagem</span>
                </label>
              </div>
            </div>

            {formData.payment_methods_type === 'text' && (
              <div className="space-y-3 pl-6">
                <Label>Métodos de pagamento aceitos</Label>
                <div className="flex gap-2">
                  <Input
                    id="new_payment_method"
                    placeholder="Ex: PIX, Boleto, Cartão..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleAddPaymentMethod(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('new_payment_method') as HTMLInputElement;
                      if (input) {
                        handleAddPaymentMethod(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
                
                {formData.payment_methods_text.length > 0 && (
                  <div className="space-y-2">
                    {formData.payment_methods_text.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{method}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePaymentMethod(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {formData.payment_methods_type === 'banner' && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="payment_methods_banner_url">URL do banner</Label>
                <Input
                  id="payment_methods_banner_url"
                  value={formData.payment_methods_banner_url}
                  onChange={(e) => handleInputChange('payment_methods_banner_url', e.target.value)}
                  placeholder="https://exemplo.com/banner-pagamentos.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Tamanho recomendado: 800x200px
                </p>
                {formData.payment_methods_banner_url && (
                  <div className="relative h-24 mt-2">
                    <Image
                      src={formData.payment_methods_banner_url}
                      alt="Preview banner pagamentos"
                      fill
                      className="object-contain rounded border"
                      sizes="400px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.border = '2px solid red';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Adicionar Imóvel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyDialog;