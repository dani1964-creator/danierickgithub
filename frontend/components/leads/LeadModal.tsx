import { useState } from 'react';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import type React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Mail, Phone, MessageSquare } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leadData: {
    broker_id: string;
    property_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    source: string;
    status: string;
  }) => void;
  brokerProfile: {
    id: string;
    business_name: string;
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
  };
  property?: {
    id: string;
    title: string;
  };
  source?: string;
}

const LeadModal = ({
  isOpen,
  onClose,
  onSuccess,
  brokerProfile,
  property,
  source = 'website'
}: LeadModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const primaryColor = brokerProfile.primary_color || '#2563eb';
  const secondaryColor = brokerProfile.secondary_color || '#64748b';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const leadData = {
        broker_id: brokerProfile.id,
        property_id: property?.id || null,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        message: formData.message.trim() || `Interesse em: ${property?.title || 'Informações sobre imóveis'}`,
        source: source,
        status: 'new'
      };

      const { error } = await supabase
        .from('leads')
        .insert([leadData]);

      if (error) {
        logger.error('Error creating lead:', error);
        toast({
          title: "Erro ao enviar",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Cadastro realizado!",
        description: "Em breve nossa equipe entrará em contato.",
        variant: "default"
      });

      onSuccess(leadData);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      logger.error('Error submitting lead:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  type RingStyle = React.CSSProperties & { [key: string]: string | number | undefined };
  const inputRingStyle: RingStyle = { ['--tw-ring-color']: primaryColor + '40' };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[400px] mx-auto rounded-lg"
        style={{
          borderColor: primaryColor + '20'
        }}
      >
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            {brokerProfile.logo_url ? (
              <div className="relative h-12 w-32">
                <Image 
                  src={brokerProfile.logo_url} 
                  alt={brokerProfile.business_name}
                  fill
                  className="object-contain"
                  sizes="128px"
                />
              </div>
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {brokerProfile.business_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="text-center space-y-2">
            <DialogTitle className="text-xl font-semibold">
              Receba mais informações
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {property ? `Sobre: ${property.title}` : 'Sobre nossos imóveis disponíveis'}
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: primaryColor }} />
              Nome completo *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Seu nome completo"
              className="transition-all focus-visible:ring-1"
              style={inputRingStyle}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" style={{ color: primaryColor }} />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="seu@email.com"
              className="transition-all focus-visible:ring-1"
              style={inputRingStyle}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" style={{ color: primaryColor }} />
              WhatsApp
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="transition-all focus-visible:ring-1"
              style={inputRingStyle}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} />
              Mensagem (opcional)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Conte-nos mais sobre seu interesse..."
              className="transition-all focus-visible:ring-1 min-h-[80px]"
              style={inputRingStyle}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 text-white hover:opacity-90 transition-all"
              style={{ 
                backgroundColor: primaryColor,
                borderColor: primaryColor
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar cadastro'
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Seus dados são protegidos e não serão compartilhados com terceiros.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadModal;