import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  property_type: string;
  transaction_type: string;
  address: string;
  neighborhood: string | null;
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
  const [realtors, setRealtors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: property.title,
    description: property.description || '',
    price: property.price.toString(),
    property_type: property.property_type,
    transaction_type: property.transaction_type,
    address: property.address,
    neighborhood: property.neighborhood || '',
    uf: property.uf || '',
    bedrooms: property.bedrooms?.toString() || '',
    bathrooms: property.bathrooms?.toString() || '',
    area_m2: property.area_m2?.toString() || '',
    parking_spaces: property.parking_spaces?.toString() || '',
    is_featured: property.is_featured,
    status: property.status || 'active',
    features: property.features || [],
    property_code: property.property_code || '',
    realtor_id: (property as any).realtor_id || '',
  });

  useEffect(() => {
    if (user) {
      fetchRealtors();
    }
  }, [user]);

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
        uf: property.uf || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        area_m2: property.area_m2?.toString() || '',
        parking_spaces: property.parking_spaces?.toString() || '',
        is_featured: property.is_featured,
        status: property.status || 'active',
        features: property.features || [],
        property_code: property.property_code || '',
        realtor_id: (property as any).realtor_id || '',
      });
      setSelectedImages([]);
      setImageUrls([]);
      setCurrentImageUrl('');
    }
  }, [open, property]);

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

  const propertyTypes = [
    { value: 'apartment', label: 'Apartamento' },
    { value: 'house', label: 'Casa' },
    { value: 'commercial', label: 'Comercial' },
    { value: 'land', label: 'Terreno' },
  ];

  const transactionTypes = [
    { value: 'sale', label: 'Venda' },
    { value: 'rent', label: 'Aluguel' },
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
      const { error } = await supabase
        .from('properties')
        .update({
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
          status: formData.status,
          features: formData.features,
          images: allImages,
          main_image_url: allImages[0] || null,
          property_code: formData.property_code,
          realtor_id: formData.realtor_id || null,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: "Imóvel atualizado",
        description: "As informações do imóvel foram atualizadas com sucesso!"
      });

      onOpenChange(false);
      onPropertyUpdated();

    } catch (error: any) {
      toast({
        title: "Erro ao atualizar imóvel",
        description: error.message,
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
                  {propertyTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
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
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem:', imageUrl);
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

            {/* Preview de URLs */}
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