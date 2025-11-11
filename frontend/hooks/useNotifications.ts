import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Info, XCircle, WifiOff, ImageOff } from 'lucide-react';

/**
 * Hook customizado para notificações profissionais
 */
export function useNotifications() {
  const { toast } = useToast();

  const showError = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'destructive',
      duration: 5000,
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      className: 'bg-green-50 border-green-200 text-green-900',
      duration: 3000,
    });
  };

  const showInfo = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      className: 'bg-blue-50 border-blue-200 text-blue-900',
      duration: 4000,
    });
  };

  const showWarning = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      duration: 4000,
    });
  };

  // Notificações específicas para problemas comuns
  const showNetworkError = () => {
    toast({
      title: 'Problema de conexão',
      description: 'Verifique sua conexão com a internet e tente novamente.',
      variant: 'destructive',
      duration: 6000,
    });
  };

  const showImageError = (count: number = 1) => {
    if (count === 1) {
      toast({
        title: 'Erro ao carregar imagem',
        description: 'Não foi possível carregar uma das imagens. Tentando novamente...',
        className: 'bg-orange-50 border-orange-200 text-orange-900',
        duration: 3000,
      });
    } else {
      toast({
        title: `Erro ao carregar ${count} imagens`,
        description: 'Algumas imagens não puderam ser carregadas.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const showPropertyNotFound = () => {
    toast({
      title: 'Imóvel não encontrado',
      description: 'Este imóvel pode ter sido removido ou não está mais disponível.',
      variant: 'destructive',
      duration: 5000,
    });
  };

  const showLeadSuccess = () => {
    toast({
      title: 'Mensagem enviada com sucesso!',
      description: 'Em breve entraremos em contato com você.',
      className: 'bg-green-50 border-green-200 text-green-900',
      duration: 5000,
    });
  };

  const showCopySuccess = () => {
    toast({
      title: 'Copiado!',
      description: 'Link copiado para a área de transferência.',
      className: 'bg-blue-50 border-blue-200 text-blue-900',
      duration: 2000,
    });
  };

  const showShareSuccess = () => {
    toast({
      title: 'Compartilhado!',
      description: 'Imóvel compartilhado com sucesso.',
      className: 'bg-blue-50 border-blue-200 text-blue-900',
      duration: 3000,
    });
  };

  const showFavoriteAdded = () => {
    toast({
      title: 'Adicionado aos favoritos',
      description: 'Você pode encontrar este imóvel na sua lista de favoritos.',
      className: 'bg-pink-50 border-pink-200 text-pink-900',
      duration: 3000,
    });
  };

  const showFavoriteRemoved = () => {
    toast({
      title: 'Removido dos favoritos',
      className: 'bg-gray-50 border-gray-200 text-gray-900',
      duration: 2000,
    });
  };

  return {
    showError,
    showSuccess,
    showInfo,
    showWarning,
    showNetworkError,
    showImageError,
    showPropertyNotFound,
    showLeadSuccess,
    showCopySuccess,
    showShareSuccess,
    showFavoriteAdded,
    showFavoriteRemoved,
  };
}
