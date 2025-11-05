import React from 'react';
import type { BrokerProfile } from '@/shared/types/broker';

type MinimalBrokerSEO = Partial<Pick<BrokerProfile,
  'site_title' |
  'site_description' |
  'site_favicon_url' |
  'site_share_image_url' |
  'business_name' |
  'logo_url' |
  'website_slug'
>>;

interface SEODebugPanelProps {
  brokerProfile: MinimalBrokerSEO | null;
  isVisible?: boolean;
}

export const SEODebugPanel: React.FC<SEODebugPanelProps> = ({ 
  brokerProfile, 
  isVisible = true 
}) => {
  if (!isVisible || !brokerProfile) return null;

  const seoData = {
    site_title: brokerProfile.site_title,
    site_description: brokerProfile.site_description,
    site_favicon_url: brokerProfile.site_favicon_url,
    site_share_image_url: brokerProfile.site_share_image_url,
    business_name: brokerProfile.business_name,
    logo_url: brokerProfile.logo_url,
    website_slug: brokerProfile.website_slug,
  };

  const finalTitle = brokerProfile?.site_title || 
    `${brokerProfile?.business_name || 'Imobiliária'} - Imóveis para Venda e Locação`;

  const finalDescription = brokerProfile?.site_description || 
    `Encontre imóveis com ${brokerProfile?.business_name || 'nossa imobiliária'}.`;

  const finalImage = brokerProfile?.site_share_image_url ? 
    (brokerProfile.site_share_image_url.startsWith('http') ? 
      brokerProfile.site_share_image_url : 
      `${window.location.origin}${brokerProfile.site_share_image_url}`) :
    brokerProfile?.logo_url ? 
      (brokerProfile.logo_url.startsWith('http') ? 
        brokerProfile.logo_url : 
        `${window.location.origin}${brokerProfile.logo_url}`) :
      `${window.location.origin}/placeholder.svg`;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>🐛 DEBUG SEO</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong style={{ color: '#ffff00' }}>Dados Brutos:</strong>
        <pre style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '5px', 
          margin: '5px 0',
          overflow: 'auto',
          maxHeight: '100px'
        }}>
          {JSON.stringify(seoData, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong style={{ color: '#ffff00' }}>Meta Tags Finais:</strong>
        <div style={{ margin: '5px 0' }}>
          <strong>Title:</strong> {finalTitle}
        </div>
        <div style={{ margin: '5px 0' }}>
          <strong>Description:</strong> {finalDescription}
        </div>
        <div style={{ margin: '5px 0' }}>
          <strong>OG Image:</strong> 
          <div style={{ wordBreak: 'break-all' }}>{finalImage}</div>
        </div>
      </div>

      <div style={{ fontSize: '10px', color: '#ccc' }}>
        Pressione F12 → Console para mais detalhes
      </div>
    </div>
  );
};