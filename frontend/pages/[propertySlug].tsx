/**
 * Rota dinâmica para detalhes de imóveis no site público
 * URL: https://{slug}.adminimobiliaria.site/{property-slug}
 * 
 * Esta página captura URLs como:
 * - /apartamento-3-quartos-centro-651438be
 * - /casa-luxo-batel-a1b2c3d4
 * 
 * E renderiza a página de detalhes do imóvel.
 */

import PropertyDetailPage from '@/components/properties/PropertyDetailPage';

export default PropertyDetailPage;
