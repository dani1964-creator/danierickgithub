import { useState } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

interface HeaderBrandUploadProps {
  brandImageUrl: string;
  onBrandImageChange: (url: string) => void;
}

const HeaderBrandUpload = ({ brandImageUrl, onBrandImageChange }: HeaderBrandUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `header-brand-${Date.now()}.${fileExt}`;
      const filePath = `headers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      onBrandImageChange(publicUrl);

      toast({
        title: "Imagem carregada",
        description: "Sua imagem de marca foi enviada com sucesso!"
      });

    } catch (error: unknown) {
      toast({
        title: "Erro no upload",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeBrandImage = () => {
    onBrandImageChange('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="brand-image-upload">Imagem de Marca Combinada (Logo + Nome)</Label>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Opcional:</strong> Faça upload de uma imagem que combine seu logo e nome da imobiliária.
          Esta imagem será usada no cabeçalho do site ao invés do logo e nome separados.
          <br />
          <strong>Dimensões recomendadas:</strong> 400x80 pixels (proporção ~5:1)
          <br />
          <strong>Formato:</strong> PNG com fundo transparente para melhor resultado
        </AlertDescription>
      </Alert>
      
      {brandImageUrl ? (
        <div className="space-y-3">
          <div className="relative inline-block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <Image
              src={brandImageUrl}
              alt="Imagem de marca (logo + nome)"
              width={400}
              height={80}
              className="rounded border object-contain"
              style={{ maxWidth: '400px', height: 'auto' }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 rounded-full"
              onClick={removeBrandImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta imagem substituirá o logo e nome separados no cabeçalho do site público.
          </p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Nenhuma imagem de marca configurada</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Faça upload de uma imagem horizontal que combine seu logo e nome.
                Ao configurar, ela substituirá o logo + nome no header.
              </p>
            </div>
            <div className="relative">
              <input
                id="brand-image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('brand-image-upload')?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Selecionar Imagem'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {brandImageUrl && (
        <div className="flex items-center gap-2">
          <input
            id="brand-image-upload-replace"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('brand-image-upload-replace')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando...' : 'Substituir Imagem'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default HeaderBrandUpload;
