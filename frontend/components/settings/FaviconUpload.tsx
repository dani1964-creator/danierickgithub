import { useState } from 'react';
import Image from 'next/image';
import { Upload, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/utils';

interface FaviconUploadProps {
  faviconUrl: string;
  onFaviconChange: (url: string) => void;
}

const FaviconUpload = ({ faviconUrl, onFaviconChange }: FaviconUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem (PNG, JPG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      const filePath = `favicons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      onFaviconChange(data.publicUrl);
      
      toast({
        title: "Favicon enviado",
        description: "Favicon atualizado com sucesso!"
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

  const removeFavicon = () => {
    onFaviconChange('');
  };

  return (
    <div className="space-y-4">
      {faviconUrl && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 bg-muted rounded-sm flex items-center justify-center overflow-hidden">
                <Image 
                  src={faviconUrl} 
                  alt="Favicon atual" 
                  fill
                  className="object-cover"
                  sizes="32px"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <Globe className="w-4 h-4 text-muted-foreground hidden" />
              </div>
              <div>
                <p className="text-sm font-medium">Favicon atual</p>
                <p className="text-xs text-muted-foreground">
                  Aparece na aba do navegador
                </p>
              </div>
            </div>
            <Button
              variant="outline" 
              size="sm"
              onClick={removeFavicon}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById('favicon-upload')?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Enviando...' : faviconUrl ? 'Alterar Favicon' : 'Enviar Favicon'}
        </Button>
        
        <input
          id="favicon-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <p className="text-xs text-muted-foreground text-center">
          Recomendado: 32x32px ou 16x16px • PNG, JPG • Máx. 2MB
        </p>
      </div>
    </div>
  );
};

export default FaviconUpload;