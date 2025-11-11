import { Heart } from 'lucide-react';
import { useRouter } from 'next/router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoritesButtonProps {
  variant?: 'default' | 'minimal' | 'icon-only';
  className?: string;
  showCount?: boolean;
}

/**
 * Botão de favoritos com contador para usar em headers/menus
 * Estilo premium com animações
 */
export function FavoritesButton({ 
  variant = 'default', 
  className,
  showCount = true 
}: FavoritesButtonProps) {
  const router = useRouter();
  const { count } = useFavorites();

  const handleClick = () => {
    router.push('/favoritos');
  };

  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group",
          className
        )}
        title={`${count} favorito${count !== 1 ? 's' : ''}`}
      >
        <Heart 
          className={cn(
            "h-5 w-5 transition-all duration-200",
            count > 0 
              ? "text-pink-500 fill-pink-500 group-hover:scale-110" 
              : "text-gray-600 group-hover:text-pink-500 group-hover:scale-110"
          )} 
        />
        {count > 0 && showCount && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-in zoom-in duration-200">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={cn(
          "gap-2 hover:bg-gray-100 transition-all duration-200",
          className
        )}
      >
        <Heart 
          className={cn(
            "h-4 w-4",
            count > 0 ? "text-pink-500 fill-pink-500" : "text-gray-600"
          )} 
        />
        <span className="text-sm font-medium">
          Favoritos
        </span>
        {count > 0 && showCount && (
          <Badge 
            variant="secondary" 
            className="bg-pink-100 text-pink-700 hover:bg-pink-200 ml-1"
          >
            {count}
          </Badge>
        )}
      </Button>
    );
  }

  // Default variant
  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={cn(
        "gap-2 border-gray-300 hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 group",
        count > 0 && "border-pink-300 bg-pink-50",
        className
      )}
    >
      <Heart 
        className={cn(
          "h-4 w-4 transition-all duration-200 group-hover:scale-110",
          count > 0 ? "text-pink-500 fill-pink-500" : "text-gray-600 group-hover:text-pink-500"
        )} 
      />
      <span className="font-medium">
        Meus Favoritos
      </span>
      {count > 0 && showCount && (
        <Badge 
          variant="secondary" 
          className="bg-pink-500 text-white hover:bg-pink-600 ml-1 animate-in zoom-in duration-200"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
}

/**
 * Badge flutuante de favoritos (para mobile)
 */
export function FloatingFavoritesButton() {
  const router = useRouter();
  const { count } = useFavorites();

  // Não mostrar se não tiver favoritos
  if (count === 0) return null;

  return (
    <button
      onClick={() => router.push('/favoritos')}
      className="fixed bottom-20 right-4 z-40 bg-pink-500 hover:bg-pink-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group"
      title={`${count} favorito${count !== 1 ? 's' : ''}`}
    >
      <Heart className="h-6 w-6 fill-white" />
      <span className="absolute -top-2 -right-2 bg-white text-pink-600 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
        {count > 99 ? '99' : count}
      </span>
    </button>
  );
}
