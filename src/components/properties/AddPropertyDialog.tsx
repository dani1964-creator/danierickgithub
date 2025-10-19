import { useState, useEffect } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
import { useToast } from '@/hooks/use-toast';

interface AddPropertyDialogProps {
  onPropertyAdded: () => void;
}

const AddPropertyDialog = ({ onPropertyAdded }: AddPropertyDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRealtors();
    }
  }, [user]);

  const fetchRealtors = async () => {
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
      console.error('Error fetching realtors:', error);
    }
  };
  const [open, setOpen] = useState(false);
  const [loading, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [realtors, setRealtors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    property_type: 'apartment',
    transaction_type: 'sale',
    address: '',
    neighborhood: '',
    uf: '',
    bedrooms: '',
    bathrooms: '',
    area_m2: '',
    parking_spaces: '',
    is_featured: false,
    features: [] as string[],
    property_code: '',
    realtor_id: '',
    // Novos campos - Informações gerais
    hoa_fee: '',
    hoa_periodicity: 'monthly',
    iptu_value: '',
    iptu_periodicity: 'annual',
    built_year: '',
    suites: '',
    private_area_m2: '',
    total_area_m2: '',
    covered_parking_spaces: '',
    floor_number: '',
    total_floors: '',
    sunlight_orientation: '',
    property_condition: '',
    water_cost: '',
    electricity_cost: '',
    furnished: false,
    accepts_pets: false,
    elevator: false,
    portaria_24h: false,
    gas_included: false,
    accessibility: false,
    heating_type: '',
    notes: '',
  });

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
      const insertPayload: any = {
        broker_id: brokerId,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        property_type: formData.property_type,
        transaction_type: formData.transaction_type,
        address: formData.address,
        neighborhood: formData.neighborhood,
        uf: formData.uf,
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
        // Novos campos - Informações gerais
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
      };

      // If DB taxonomy available, include foreign key id
      const mappedId = valueToId.get(formData.property_type);
      if (mappedId) insertPayload.property_type_id = mappedId;

      const { error } = await supabase
        .from('properties')
        .insert(insertPayload as any);

      if (error) throw error;

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
        uf: '',
        bedrooms: '',
        bathrooms: '',
        area_m2: '',
        parking_spaces: '',
        is_featured: false,
        features: [],
        property_code: '',
        realtor_id: '',
        hoa_fee: '',
        hoa_periodicity: 'monthly',
        iptu_value: '',
        iptu_periodicity: 'annual',
        built_year: '',
        suites: '',
        private_area_m2: '',
        total_area_m2: '',
        covered_parking_spaces: '',
        floor_number: '',
        total_floors: '',
        sunlight_orientation: '',
        property_condition: '',
        water_cost: '',
        electricity_cost: '',
        furnished: false,
        accepts_pets: false,
        elevator: false,
        portaria_24h: false,
        gas_included: false,
        accessibility: false,
        heating_type: '',
        notes: '',
      });
      setSelectedImages([]);
      setImageUrls([]);
      setCurrentImageUrl('');
      setOpen(false);
      onPropertyAdded();

    } catch (error: any) {
      toast({
        title: "Erro ao adicionar imóvel",
        description: error.message,
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
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Rua das Flores, 123"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                placeholder="Centro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                value={formData.uf}
                onChange={(e) => handleInputChange('uf', e.target.value)}
                placeholder="SP"
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
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
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
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`URL ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
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