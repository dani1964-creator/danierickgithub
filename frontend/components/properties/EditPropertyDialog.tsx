import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { X, Upload, Calculator, Flame, CreditCard } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { PROPERTY_TYPE_GROUPS } from '@/components/properties/property-types';
import { usePropertyTypes } from '@/hooks/usePropertyTypes';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

interface Realtor {
  id: string;
  name: string;
  creci: string | null;
  is_active: boolean;
  avatar_url: string | null;
}

interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  property_type: string;
  transaction_type: string;
  address: string;
  neighborhood: string | null;
  city: string | null;
  uf: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  parking_spaces: number | null;
  is_featured: boolean;
  features: string[] | null;
  images: string[] | null;
  property_code: string | null;
  status: string | null;
  realtor_id?: string | null;
  // Novos campos (opcionais)
  hoa_fee?: number | null;
  hoa_periodicity?: string | null;
  iptu_value?: number | null;
  iptu_periodicity?: string | null;
  built_year?: number | null;
  suites?: number | null;
  private_area_m2?: number | null;
  total_area_m2?: number | null;
  covered_parking_spaces?: number | null;
  floor_number?: number | null;
  total_floors?: number | null;
  sunlight_orientation?: string | null;
  property_condition?: string | null;
  water_cost?: number | null;
  electricity_cost?: number | null;
  furnished?: boolean | null;
  accepts_pets?: boolean | null;
  elevator?: boolean | null;
  portaria_24h?: boolean | null;
  gas_included?: boolean | null;
  accessibility?: boolean | null;
  heating_type?: string | null;
  notes?: string | null;
  // Campos de financiamento
  financing_enabled?: boolean | null;
  financing_down_payment_percentage?: number | null;
  financing_max_installments?: number | null;
  financing_interest_rate?: number | null;
  // Campos de oportunidade
  show_opportunity_badge?: boolean | null;
  opportunity_badge_text?: string | null;
  // Campos de métodos de pagamento
  payment_methods_type?: string | null;
  payment_methods_text?: string[] | null;
  payment_methods_banner_url?: string | null;
}

interface EditPropertyDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyUpdated: () => void;
}

const EditPropertyDialog = ({ property, open, onOpenChange, onPropertyUpdated }: EditPropertyDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [formData, setFormData] = useState({
    title: property.title,
    description: property.description || '',
    price: property.price.toString(),
    property_type: property.property_type,
    transaction_type: property.transaction_type,
    address: property.address,
    neighborhood: property.neighborhood || '',
    city: property.city || '',
    uf: property.uf || '',
    bedrooms: property.bedrooms?.toString() || '',
    bathrooms: property.bathrooms?.toString() || '',
    area_m2: property.area_m2?.toString() || '',
    parking_spaces: property.parking_spaces?.toString() || '',
    is_featured: property.is_featured,
    status: property.status || 'active',
    features: property.features || [],
    property_code: property.property_code || '',
  realtor_id: property.realtor_id || '',
    // Informações gerais
    hoa_fee: property.hoa_fee?.toString() || '',
    hoa_periodicity: property.hoa_periodicity || 'monthly',
    iptu_value: property.iptu_value?.toString() || '',
    iptu_periodicity: property.iptu_periodicity || 'annual',
    built_year: property.built_year?.toString() || '',
    suites: property.suites?.toString() || '',
    private_area_m2: property.private_area_m2?.toString() || '',
    total_area_m2: property.total_area_m2?.toString() || '',
    covered_parking_spaces: property.covered_parking_spaces?.toString() || '',
    floor_number: property.floor_number?.toString() || '',
    total_floors: property.total_floors?.toString() || '',
    sunlight_orientation: property.sunlight_orientation || '',
    property_condition: property.property_condition || '',
    water_cost: property.water_cost?.toString() || '',
    electricity_cost: property.electricity_cost?.toString() || '',
    furnished: Boolean(property.furnished),
    accepts_pets: Boolean(property.accepts_pets),
    elevator: Boolean(property.elevator),
    portaria_24h: Boolean(property.portaria_24h),
    gas_included: Boolean(property.gas_included),
    accessibility: Boolean(property.accessibility),
    heating_type: property.heating_type || '',
    notes: property.notes || '',
    // Campos de financiamento
    financing_enabled: Boolean(property.financing_enabled),
    financing_down_payment_percentage: property.financing_down_payment_percentage?.toString() || '20',
    financing_max_installments: property.financing_max_installments?.toString() || '360',
    financing_interest_rate: property.financing_interest_rate?.toString() || '0.80',
    // Campos de oportunidade
    show_opportunity_badge: Boolean(property.show_opportunity_badge),
    opportunity_badge_text: property.opportunity_badge_text || '',
    // Campos de métodos de pagamento
    payment_methods_type: property.payment_methods_type || 'none',
    payment_methods_text: Array.isArray(property.payment_methods_text) 
      ? property.payment_methods_text.join('\n') 
      : property.payment_methods_text || '',
    payment_methods_banner_url: property.payment_methods_banner_url || '',
  });

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

  // Sync with latest property data whenever the dialog opens
  useEffect(() => {
    if (open) {
      setCurrentImages(property.images || []);
      setFormData({
        title: property.title,
        description: property.description || '',
        price: property.price.toString(),
        property_type: property.property_type,
        transaction_type: property.transaction_type,
        address: property.address,
        neighborhood: property.neighborhood || '',
        city: property.city || '',
        uf: property.uf || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        area_m2: property.area_m2?.toString() || '',
        parking_spaces: property.parking_spaces?.toString() || '',
        is_featured: property.is_featured,
        status: property.status || 'active',
        features: property.features || [],
        property_code: property.property_code || '',
  realtor_id: property.realtor_id || '',
        hoa_fee: property.hoa_fee?.toString() || '',
        hoa_periodicity: property.hoa_periodicity || 'monthly',
        iptu_value: property.iptu_value?.toString() || '',
        iptu_periodicity: property.iptu_periodicity || 'annual',
        built_year: property.built_year?.toString() || '',
        suites: property.suites?.toString() || '',
        private_area_m2: property.private_area_m2?.toString() || '',
        total_area_m2: property.total_area_m2?.toString() || '',
        covered_parking_spaces: property.covered_parking_spaces?.toString() || '',
        floor_number: property.floor_number?.toString() || '',
        total_floors: property.total_floors?.toString() || '',
        sunlight_orientation: property.sunlight_orientation || '',
        property_condition: property.property_condition || '',
        water_cost: property.water_cost?.toString() || '',
        electricity_cost: property.electricity_cost?.toString() || '',
        furnished: Boolean(property.furnished),
        accepts_pets: Boolean(property.accepts_pets),
        elevator: Boolean(property.elevator),
        portaria_24h: Boolean(property.portaria_24h),
        gas_included: Boolean(property.gas_included),
        accessibility: Boolean(property.accessibility),
        heating_type: property.heating_type || '',
        notes: property.notes || '',
        // Campos de financiamento
        financing_enabled: Boolean(property.financing_enabled),
        financing_down_payment_percentage: property.financing_down_payment_percentage?.toString() || '20',
        financing_max_installments: property.financing_max_installments?.toString() || '360',
        financing_interest_rate: property.financing_interest_rate?.toString() || '0.80',
        // Campos de oportunidade
        show_opportunity_badge: Boolean(property.show_opportunity_badge),
        opportunity_badge_text: property.opportunity_badge_text || '',
        // Campos de métodos de pagamento
        payment_methods_type: property.payment_methods_type || 'none',
        payment_methods_text: Array.isArray(property.payment_methods_text) 
          ? property.payment_methods_text.join('\n') 
          : property.payment_methods_text || '',
        payment_methods_banner_url: property.payment_methods_banner_url || '',
      });
      setSelectedImages([]);
      setImageUrls([]);
      setCurrentImageUrl('');
    }
  }, [open, property]);

  

  const { groups: propertyTypes, valueToId } = usePropertyTypes();

  const transactionTypes = [
    { value: 'sale', label: 'Venda' },
    { value: 'rent', label: 'Aluguel' },
  ];

  const periodicities = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'annual', label: 'Anual' },
    { value: 'other', label: 'Outro' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'rented', label: 'Alugado' },
    { value: 'sold', label: 'Vendido' },
    { value: 'inactive', label: 'Inativo' },
  ];

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files].slice(0, 10));
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setCurrentImages(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload new images
      const uploadedUrls = await uploadImages();
      
      // Combine existing images, new uploads, and URLs
      const allImages = [...currentImages, ...uploadedUrls, ...imageUrls];

      // Update property
      const updatePayload = {
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
        status: formData.status,
        features: formData.features,
        images: allImages,
        main_image_url: allImages[0] || null,
        property_code: formData.property_code,
        realtor_id: formData.realtor_id || null,
        // Informações gerais
        hoa_fee: formData.hoa_fee ? parseFloat(formData.hoa_fee) : null,
        hoa_periodicity: formData.hoa_periodicity || null,
        iptu_value: formData.iptu_value ? parseFloat(formData.iptu_value) : null,
        iptu_periodicity: formData.iptu_periodicity || null,
        built_year: formData.built_year ? parseInt(formData.built_year) : null,
        suites: formData.suites ? parseInt(formData.suites) : null,
        private_area_m2: formData.private_area_m2 ? parseFloat(formData.private_area_m2) : null,
        total_area_m2: formData.total_area_m2 ? parseFloat(formData.total_area_m2) : null,
        covered_parking_spaces: formData.covered_parking_spaces ? parseInt(formData.covered_parking_spaces) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
        sunlight_orientation: formData.sunlight_orientation || null,
        property_condition: formData.property_condition || null,
        water_cost: formData.water_cost ? parseFloat(formData.water_cost) : null,
        electricity_cost: formData.electricity_cost ? parseFloat(formData.electricity_cost) : null,
        furnished: formData.furnished,
        accepts_pets: formData.accepts_pets,
        elevator: formData.elevator,
        portaria_24h: formData.portaria_24h,
        gas_included: formData.gas_included,
        accessibility: formData.accessibility,
        heating_type: formData.heating_type || null,
        notes: formData.notes || null,
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
          ? formData.payment_methods_text.split('\n').map(m => m.trim()).filter(m => m.length > 0)
          : null,
        payment_methods_banner_url: formData.payment_methods_type === 'banner' 
          ? formData.payment_methods_banner_url 
          : null,
        updated_at: new Date().toISOString()
      };

  const mappedId = valueToId.get(formData.property_type);
  if (mappedId) (updatePayload as Record<string, unknown>).property_type_id = mappedId;

      const { error } = await supabase
        .from('properties')
        .update(updatePayload as unknown as Record<string, unknown>)
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: "Imóvel atualizado",
        description: "As informações do imóvel foram atualizadas com sucesso!"
      });

      onOpenChange(false);
      onPropertyUpdated();

    } catch (error: unknown) {
      toast({
        title: "Erro ao atualizar imóvel",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Imóvel</DialogTitle>
          <DialogDescription>
            Atualize as informações do imóvel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid gap-4 md:grid-cols-3">
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
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status do imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
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

          {/* Informações gerais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações gerais</h3>
            {/* Condomínio/HOA e IPTU */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hoa_fee">Condomínio (R$)</Label>
                  <Input
                    id="hoa_fee"
                    type="number"
                    value={formData.hoa_fee}
                    onChange={(e) => handleInputChange('hoa_fee', e.target.value)}
                    placeholder="450"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Periodicidade</Label>
                  <Select
                    value={formData.hoa_periodicity}
                    onValueChange={(value) => handleInputChange('hoa_periodicity', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Periodicidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodicities.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="iptu_value">IPTU (R$)</Label>
                  <Input
                    id="iptu_value"
                    type="number"
                    value={formData.iptu_value}
                    onChange={(e) => handleInputChange('iptu_value', e.target.value)}
                    placeholder="1200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Periodicidade</Label>
                  <Select
                    value={formData.iptu_periodicity}
                    onValueChange={(value) => handleInputChange('iptu_periodicity', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Periodicidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodicities.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Áreas e vagas cobertas */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="private_area_m2">Área útil (m²)</Label>
                <Input
                  id="private_area_m2"
                  type="number"
                  value={formData.private_area_m2}
                  onChange={(e) => handleInputChange('private_area_m2', e.target.value)}
                  placeholder="85"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_area_m2">Área total (m²)</Label>
                <Input
                  id="total_area_m2"
                  type="number"
                  value={formData.total_area_m2}
                  onChange={(e) => handleInputChange('total_area_m2', e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="covered_parking_spaces">Vagas cobertas</Label>
                <Input
                  id="covered_parking_spaces"
                  type="number"
                  value={formData.covered_parking_spaces}
                  onChange={(e) => handleInputChange('covered_parking_spaces', e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suites">Suítes</Label>
                <Input
                  id="suites"
                  type="number"
                  value={formData.suites}
                  onChange={(e) => handleInputChange('suites', e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Andar, total de andares e ano */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="floor_number">Andar</Label>
                <Input
                  id="floor_number"
                  type="number"
                  value={formData.floor_number}
                  onChange={(e) => handleInputChange('floor_number', e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_floors">Total de andares</Label>
                <Input
                  id="total_floors"
                  type="number"
                  value={formData.total_floors}
                  onChange={(e) => handleInputChange('total_floors', e.target.value)}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="built_year">Ano de construção</Label>
                <Input
                  id="built_year"
                  type="number"
                  value={formData.built_year}
                  onChange={(e) => handleInputChange('built_year', e.target.value)}
                  placeholder="2015"
                />
              </div>
            </div>

            {/* Face do sol e condição */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sunlight_orientation">Face do sol</Label>
                <Input
                  id="sunlight_orientation"
                  value={formData.sunlight_orientation}
                  onChange={(e) => handleInputChange('sunlight_orientation', e.target.value)}
                  placeholder="Norte, Sul, Leste, Oeste..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property_condition">Condição do imóvel</Label>
                <Input
                  id="property_condition"
                  value={formData.property_condition}
                  onChange={(e) => handleInputChange('property_condition', e.target.value)}
                  placeholder="Novo, Usado, Reformado..."
                />
              </div>
            </div>

            {/* Custos utilidades */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="water_cost">Água (R$)</Label>
                <Input
                  id="water_cost"
                  type="number"
                  value={formData.water_cost}
                  onChange={(e) => handleInputChange('water_cost', e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricity_cost">Luz (R$)</Label>
                <Input
                  id="electricity_cost"
                  type="number"
                  value={formData.electricity_cost}
                  onChange={(e) => handleInputChange('electricity_cost', e.target.value)}
                  placeholder="180"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="furnished"
                  checked={formData.furnished}
                  onCheckedChange={(checked) => handleInputChange('furnished', checked)}
                />
                <Label htmlFor="furnished">Mobiliado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="accepts_pets"
                  checked={formData.accepts_pets}
                  onCheckedChange={(checked) => handleInputChange('accepts_pets', checked)}
                />
                <Label htmlFor="accepts_pets">Aceita pets</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="elevator"
                  checked={formData.elevator}
                  onCheckedChange={(checked) => handleInputChange('elevator', checked)}
                />
                <Label htmlFor="elevator">Elevador</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="portaria_24h"
                  checked={formData.portaria_24h}
                  onCheckedChange={(checked) => handleInputChange('portaria_24h', checked)}
                />
                <Label htmlFor="portaria_24h">Portaria 24h</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="gas_included"
                  checked={formData.gas_included}
                  onCheckedChange={(checked) => handleInputChange('gas_included', checked)}
                />
                <Label htmlFor="gas_included">Gás encanado incluso</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="accessibility"
                  checked={formData.accessibility}
                  onCheckedChange={(checked) => handleInputChange('accessibility', checked)}
                />
                <Label htmlFor="accessibility">Acessibilidade</Label>
              </div>
            </div>

            {/* Aquecimento e observações */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heating_type">Tipo de aquecimento</Label>
                <Input
                  id="heating_type"
                  value={formData.heating_type}
                  onChange={(e) => handleInputChange('heating_type', e.target.value)}
                  placeholder="Elétrico, Gás..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Informações adicionais relevantes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

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
              <Label htmlFor="show_opportunity_badge">Exibir badge de oportunidade</Label>
            </div>

            {formData.show_opportunity_badge && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="opportunity_badge_text">Texto do badge</Label>
                <Input
                  id="opportunity_badge_text"
                  value={formData.opportunity_badge_text}
                  onChange={(e) => handleInputChange('opportunity_badge_text', e.target.value)}
                  placeholder="Ex: Oportunidade Única!"
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

          {/* Métodos de Pagamento */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-start gap-2">
              <CreditCard className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base leading-tight">Métodos de Pagamento</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              💳 Mostre aos interessados as opções de pagamento aceitas. Escolha entre lista de texto ou banner personalizado.
            </p>
            
            <div className="space-y-2">
              <Label>Tipo de exibição</Label>
              <Select
                value={formData.payment_methods_type}
                onValueChange={(value) => handleInputChange('payment_methods_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione como exibir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não exibir</SelectItem>
                  <SelectItem value="text">Texto personalizado</SelectItem>
                  <SelectItem value="banner">Banner personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.payment_methods_type === 'text' && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="payment_methods_text">Texto dos métodos</Label>
                <Textarea
                  id="payment_methods_text"
                  value={formData.payment_methods_text}
                  onChange={(e) => handleInputChange('payment_methods_text', e.target.value)}
                  placeholder="Digite cada método de pagamento em uma linha separada:\nPIX\nCartão de crédito\nFinanciamento bancário\nDinheiro"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Digite cada método de pagamento em uma linha separada</p>
              </div>
            )}

            {formData.payment_methods_type === 'banner' && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="payment_methods_banner_url">URL do Banner</Label>
                <Input
                  id="payment_methods_banner_url"
                  value={formData.payment_methods_banner_url}
                  onChange={(e) => handleInputChange('payment_methods_banner_url', e.target.value)}
                  placeholder="https://exemplo.com/banner-pagamento.jpg"
                />
              </div>
            )}
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

          {/* Current Images */}
          {currentImages && currentImages.length > 0 && (
            <div className="space-y-2">
              <Label>Imagens Atuais</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentImages.map((imageUrl, index) => (
                  <div key={index} className="relative h-24 group">
                    <Image
                      src={imageUrl}
                      alt={`Imagem ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      onError={(e) => {
                          logger.error('Erro ao carregar imagem:', imageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add More Images */}
          <div className="space-y-4">
            <Label>Adicionar Mais Imagens</Label>
            
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
            
            {/* Preview de novos arquivos */}
            {selectedImages.length > 0 && (
              <div className="space-y-2">
                <Label>Novos arquivos</Label>
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

            {/* Preview de URLs */}
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

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar Imóvel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPropertyDialog;