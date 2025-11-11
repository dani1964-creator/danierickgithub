import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { trackFavorite } from '@/lib/analytics';

/**
 * Hook profissional para gerenciar favoritos com localStorage
 * Inspirado em sistemas de e-commerce e plataformas imobiliárias premium
 */

export interface FavoriteProperty {
  id: string;
  slug: string;
  title: string;
  price: number;
  main_image_url: string;
  property_type: string;
  transaction_type: string;
  bedrooms: number;
  bathrooms: number;
  area_m2: number;
  city: string;
  neighborhood: string;
  broker_slug: string;
  favorited_at: string;
}

const FAVORITES_KEY = 'property_favorites';
const MAX_FAVORITES = 50; // Limite para evitar localStorage muito grande

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar favoritos do localStorage ao iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      logger.error('Error loading favorites from localStorage:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar favoritos no localStorage quando mudar
  const saveFavorites = useCallback((newFavorites: FavoriteProperty[]) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      logger.error('Error saving favorites to localStorage:', error);
    }
  }, []);

  /**
   * Adiciona propriedade aos favoritos
   */
  const addFavorite = useCallback((property: Omit<FavoriteProperty, 'favorited_at'>) => {
    setFavorites((current) => {
      // Verificar se já está favoritado
      if (current.some(fav => fav.id === property.id)) {
        logger.warn('Property already in favorites:', property.id);
        return current;
      }

      // Verificar limite
      if (current.length >= MAX_FAVORITES) {
        logger.warn('Maximum favorites limit reached');
        return current;
      }

      const newFavorite: FavoriteProperty = {
        ...property,
        favorited_at: new Date().toISOString(),
      };

      const newFavorites = [newFavorite, ...current];
      
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        trackFavorite(property.id, 'add');
        logger.info('Property added to favorites:', property.id);
      } catch (error) {
        logger.error('Error saving favorite:', error);
      }

      return newFavorites;
    });
  }, []);

  /**
   * Remove propriedade dos favoritos
   */
  const removeFavorite = useCallback((propertyId: string) => {
    setFavorites((current) => {
      const newFavorites = current.filter(fav => fav.id !== propertyId);
      
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        trackFavorite(propertyId, 'remove');
        logger.info('Property removed from favorites:', propertyId);
      } catch (error) {
        logger.error('Error removing favorite:', error);
      }

      return newFavorites;
    });
  }, []);

  /**
   * Toggle favorito (adiciona se não existe, remove se existe)
   */
  const toggleFavorite = useCallback((property: Omit<FavoriteProperty, 'favorited_at'>) => {
    const isFavorited = favorites.some(fav => fav.id === property.id);
    
    if (isFavorited) {
      removeFavorite(property.id);
      return false;
    } else {
      addFavorite(property);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  /**
   * Verifica se propriedade está favoritada
   */
  const isFavorited = useCallback((propertyId: string) => {
    return favorites.some(fav => fav.id === propertyId);
  }, [favorites]);

  /**
   * Limpa todos os favoritos
   */
  const clearFavorites = useCallback(() => {
    try {
      localStorage.removeItem(FAVORITES_KEY);
      setFavorites([]);
      logger.info('All favorites cleared');
    } catch (error) {
      logger.error('Error clearing favorites:', error);
    }
  }, []);

  /**
   * Obtém favoritos ordenados
   */
  const getSortedFavorites = useCallback((sortBy: 'recent' | 'price_asc' | 'price_desc' | 'alphabetical' = 'recent') => {
    const sorted = [...favorites];

    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => 
          new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime()
        );
      
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      
      default:
        return sorted;
    }
  }, [favorites]);

  /**
   * Filtra favoritos por tipo de transação
   */
  const filterByTransactionType = useCallback((type: string) => {
    return favorites.filter(fav => fav.transaction_type === type);
  }, [favorites]);

  /**
   * Filtra favoritos por tipo de propriedade
   */
  const filterByPropertyType = useCallback((type: string) => {
    return favorites.filter(fav => fav.property_type === type);
  }, [favorites]);

  /**
   * Filtra favoritos por faixa de preço
   */
  const filterByPriceRange = useCallback((min: number, max: number) => {
    return favorites.filter(fav => fav.price >= min && fav.price <= max);
  }, [favorites]);

  /**
   * Busca favoritos por termo
   */
  const searchFavorites = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return favorites.filter(fav => 
      fav.title.toLowerCase().includes(lowerQuery) ||
      fav.city.toLowerCase().includes(lowerQuery) ||
      fav.neighborhood.toLowerCase().includes(lowerQuery)
    );
  }, [favorites]);

  return {
    favorites,
    isLoading,
    count: favorites.length,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    clearFavorites,
    getSortedFavorites,
    filterByTransactionType,
    filterByPropertyType,
    filterByPriceRange,
    searchFavorites,
  };
}

/**
 * Hook simplificado apenas para verificar se está favoritado
 */
export function useIsFavorited(propertyId: string) {
  const { isFavorited } = useFavorites();
  return isFavorited(propertyId);
}
