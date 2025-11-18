import React from 'react';
import { Home, Ruler, DollarSign, CheckCircle, XCircle, Building2, Sparkles, FileText, Calendar, Sun, Droplet, Zap, PawPrint, Car, Wind } from 'lucide-react';
import { PaymentMethods } from './PaymentMethods';

interface PropertyDetailsProps {
  property: any;
  brokerProfile: any;
  isDarkMode: boolean;
  formatPrice: (value: number) => string;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  brokerProfile,
  isDarkMode,
  formatPrice
}) => {
  // Helper para renderizar badge de amenidade
  const renderAmenityBadge = (label: string, value: boolean, icon: React.ReactNode) => {
    // Só renderizar se for true (disponível)
    if (value !== true) return null;
    
    return (
      <div className="property-amenity-badge is-available">
        <span className="property-amenity-badge__icon">{icon}</span>
        <span className="property-amenity-badge__label">{label}</span>
        <span className="property-amenity-badge__status">
          <CheckCircle className="w-4 h-4" />
        </span>
      </div>
    );
  };

  // Verificar se há dados de áreas
  const hasAreaData = property.private_area_m2 || property.total_area_m2 || 
    property.suites != null || property.covered_parking_spaces != null ||
    property.floor_number != null || property.total_floors != null ||
    property.built_year || property.sunlight_orientation;

  // Verificar se há dados de comodidades (apenas itens que realmente aparecem - valor true)
  const hasAmenitiesData = 
    property.furnished === true ||
    property.accepts_pets === true ||
    property.gas_included === true ||
    property.accessibility === true;

  // Verificar se há dados de condição (apenas itens que realmente aparecem)
  const hasConditionData = 
    property.elevator === true ||
    property.portaria_24h === true ||
    property.property_condition || 
    property.heating_type || 
    (property.features && property.features.length > 0);

  return (
    <div className="property-details-linear">
      {/* Descrição */}
      <div className="property-details-section">
        <div className="property-details-section__header">
          <FileText className="property-details-section__icon" />
          <h2 className="property-details-section__title">Descrição</h2>
        </div>
        <div className="property-details-section__content">
          {property.description ? (
            <p className="property-details-description">{property.description}</p>
          ) : (
            <p className="property-details-empty">Nenhuma descrição disponível.</p>
          )}
        </div>
      </div>

      {/* Áreas & Medidas */}
      {hasAreaData && (
        <div className="property-details-section">
          <div className="property-details-section__header">
            <Ruler className="property-details-section__icon" />
            <h2 className="property-details-section__title">Áreas & Medidas</h2>
          </div>
          <div className="property-details-section__content">
            <div className="property-details-list">
              {property.private_area_m2 && (
                <div className="property-details-item">
                  <span className="property-details-item__label">Área privativa</span>
                  <span className="property-details-item__value">{property.private_area_m2}m²</span>
                </div>
              )}
              {property.total_area_m2 && (
                <div className="property-details-item">
                  <span className="property-details-item__label">Área total</span>
                  <span className="property-details-item__value">{property.total_area_m2}m²</span>
                </div>
              )}
              {property.suites != null && (
                <div className="property-details-item">
                  <span className="property-details-item__label">Suítes</span>
                  <span className="property-details-item__value">{property.suites}</span>
                </div>
              )}
              {property.covered_parking_spaces != null && (
                <div className="property-details-item">
                  <span className="property-details-item__label">Vagas cobertas</span>
                  <span className="property-details-item__value">{property.covered_parking_spaces}</span>
                </div>
              )}
              {property.floor_number != null && (
                <div className="property-details-item">
                  <span className="property-details-item__label">Andar</span>
                  <span className="property-details-item__value">{property.floor_number}</span>
                </div>
              )}
              {property.total_floors != null && (
                <div className="property-details-item">
                  <span className="property-details-item__label">Total de andares</span>
                  <span className="property-details-item__value">{property.total_floors}</span>
                </div>
              )}
              {property.built_year && (
                <div className="property-details-item">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="property-details-item__label">Ano de construção</span>
                  <span className="property-details-item__value">{property.built_year}</span>
                </div>
              )}
              {property.sunlight_orientation && (
                <div className="property-details-item">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="property-details-item__label">Face do sol</span>
                  <span className="property-details-item__value">{property.sunlight_orientation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Comodidades & Facilidades - SEM DUPLICATAS */}
      {hasAmenitiesData && (
        <div className="property-details-section">
          <div className="property-details-section__header">
            <Home className="property-details-section__icon" />
            <h2 className="property-details-section__title">Comodidades & Facilidades</h2>
          </div>
          <div className="property-details-section__content">
            <div className="property-amenities-grid">
              {renderAmenityBadge('Mobiliado', property.furnished, <Home className="w-4 h-4" />)}
              {renderAmenityBadge('Aceita Pets', property.accepts_pets, <PawPrint className="w-4 h-4" />)}
              {renderAmenityBadge('Gás Incluso', property.gas_included, <Wind className="w-4 h-4" />)}
              {renderAmenityBadge('Acessibilidade', property.accessibility, <Building2 className="w-4 h-4" />)}
            </div>
          </div>
        </div>
      )}

      {/* Condição & Estrutura - AGORA INCLUI CARACTERÍSTICAS ADICIONAIS */}
      {hasConditionData && (
        <div className="property-details-section">
          <div className="property-details-section__header">
            <Building2 className="property-details-section__icon" />
            <h2 className="property-details-section__title">Condição & Estrutura</h2>
          </div>
          <div className="property-details-section__content">
            <div className="property-details-list">
              {property.elevator && (
                <div className="property-details-item">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="property-details-item__label">Elevador</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
              {property.portaria_24h && (
                <div className="property-details-item">
                  <Building2 className="w-4 h-4 text-green-500" />
                  <span className="property-details-item__label">Portaria 24h</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
              {property.property_condition && (
                <div className="property-details-item">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="property-details-item__label">Condição</span>
                  <span className="property-details-item__value">{property.property_condition}</span>
                </div>
              )}
              {property.heating_type && (
                <div className="property-details-item">
                  <Wind className="w-4 h-4 text-orange-500" />
                  <span className="property-details-item__label">Aquecimento</span>
                  <span className="property-details-item__value">{property.heating_type}</span>
                </div>
              )}
            </div>
            
            {/* Features mescladas (sem subtítulo) */}
            {property.features && property.features.length > 0 && (
              <div className="property-features-grid mt-4">
                {property.features.map((feature: string, index: number) => (
                  <div key={`feat-${index}`} className="property-feature-item">
                    <div className="property-feature-item__dot"></div>
                    <span className="property-feature-item__text">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formas de Pagamento */}
      {property.payment_methods_type && property.payment_methods_type !== 'none' && (
        <div className="property-details-section">
          <div className="property-details-section__header">
            <DollarSign className="property-details-section__icon" />
            <h2 className="property-details-section__title">Formas de Pagamento</h2>
          </div>
          <div className="property-details-section__content">
            <PaymentMethods
              type={property.payment_methods_type as 'text' | 'banner'}
              methods={property.payment_methods_text || []}
              bannerUrl={property.payment_methods_banner_url || undefined}
              isDarkMode={isDarkMode}
              primaryColor={brokerProfile?.primary_color}
            />
          </div>
        </div>
      )}

      {/* Observações */}
      {property.notes && (
        <div className="property-details-section">
          <div className="property-details-section__header">
            <FileText className="property-details-section__icon" />
            <h2 className="property-details-section__title">Observações Importantes</h2>
          </div>
          <div className="property-details-section__content">
            <p className="property-details-notes">{property.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};
