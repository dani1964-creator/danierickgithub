/**
 * Rota dinâmica para detalhes de imóveis no site público
 * URL: https://{slug}.adminimobiliaria.site/{property-slug}
 * 
 * Esta página captura URLs como:
 * - /apartamento-3-quartos-centro-651438be
 * - /casa-luxo-batel-a1b2c3d4
 * 
 * E renderiza a página de detalhes do imóvel.
 * 
 * IMPORTANTE: O PropertyDetailPage espera receber:
 * - propertySlug: vem do parâmetro da rota [propertySlug]
 * - slug: slug do broker (obtido do middleware via headers)
 */

import { GetServerSideProps } from 'next';
import PropertyDetailPage from '@/components/properties/PropertyDetailPage';

export const getServerSideProps: GetServerSideProps = async (context) => {
  // O middleware já injetou o broker slug nos headers
  const brokerSlug = context.req.headers['x-broker-slug'] as string | undefined;
  const customDomain = context.req.headers['x-custom-domain'] as string | undefined;
  const propertySlug = context.params?.propertySlug as string;

  // Injetar na query para que o PropertyDetailPage possa acessar
  return {
    props: {
      // Passar via query params virtuais para compatibilidade com o componente
      initialQuery: {
        slug: brokerSlug || '',
        propertySlug: propertySlug || '',
        customDomain: customDomain || '',
      }
    }
  };
};

export default PropertyDetailPage;
