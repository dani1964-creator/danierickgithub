
import { useRef, useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { sanitizeInput } from '@/lib/security';

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filters: {
    transaction_type: string;
    property_type: string;
    min_price: string;
    max_price: string;
    bedrooms: string;
    neighborhood: string;
    city: string;
    uf: string;
    property_code: string;
    status: string;
  };
  setFilters: (filters: {
    transaction_type: string;
    property_type: string;
    min_price: string;
    max_price: string;
    bedrooms: string;
    neighborhood: string;
    city: string;
    uf: string;
    property_code: string;
    status: string;
  } | ((prev: SearchFiltersProps['filters']) => SearchFiltersProps['filters'])) => void;
  hasActiveFilters: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  propertyTypeOptions?: { value: string; label: string }[];
  propertyTypeGroups?: { label: string; options: { value: string; label: string }[] }[];
}

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  hasActiveFilters,
  primaryColor = '#2563eb',
  secondaryColor = '#64748b',
  propertyTypeOptions,
  propertyTypeGroups
}: SearchFiltersProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (value: string) => {
    // Sanitize and limit search input
    const sanitized = sanitizeInput(value).substring(0, 200);
    setSearchTerm(sanitized);
  };

  const handlePriceChange = (field: 'min_price' | 'max_price', value: string) => {
    // Only allow numeric input for prices
    const numericValue = value.replace(/[^0-9]/g, '');
    // Limit to reasonable price range
    const limitedValue = numericValue.substring(0, 12); // Max 12 digits
    
    setFilters(prev => ({ 
      ...prev, 
      [field]: limitedValue
    }));
  };

  const handleTextFieldChange = (field: string, value: string, maxLength: number = 100) => {
    // Sanitize text input
    const sanitized = sanitizeInput(value).substring(0, maxLength);
    setFilters(prev => ({ 
      ...prev, 
      [field]: sanitized
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      transaction_type: '',
      property_type: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      neighborhood: '',
      city: '',
      uf: '',
      property_code: '',
      status: ''
    });
    setSearchTerm('');
    setIsAdvancedOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca Principal */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            ref={searchInputRef}
            placeholder="Buscar por localização, tipo de imóvel, código..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 sm:h-12 text-sm sm:text-base pr-10 sm:pr-4"
            maxLength={200}
          />
          {/* Ícone interno (mobile) */}
          <button
            type="button"
            aria-label="Buscar"
            className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => searchInputRef.current?.focus()}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
        {/* Botão externo (desktop e acima) */}
        <Button 
          className="hidden sm:inline-flex h-11 sm:h-12 px-4 sm:px-6 md:px-8 text-sm sm:text-base"
          style={{ backgroundColor: primaryColor }}
        >
          <Search className="h-4 w-4 mr-2" />
          <span>Buscar</span>
        </Button>
      </div>

      {/* Filtros Básicos */}
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm font-medium">Filtros:</span>
        </div>
        
        <Select 
          value={filters.transaction_type} 
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            transaction_type: value === 'all' ? '' : value 
          }))}
        >
          <SelectTrigger className="w-24 sm:w-32 h-9 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sale">Venda</SelectItem>
            <SelectItem value="rent">Aluguel</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.property_type || 'all'} 
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            property_type: value === 'all' ? '' : value 
          }))}
        >
          <SelectTrigger className="w-28 sm:w-40 h-9 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder="Imóvel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {propertyTypeGroups && propertyTypeGroups.length > 0 ? (
              propertyTypeGroups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectGroup>
              ))
            ) : propertyTypeOptions && propertyTypeOptions.length > 0 ? (
              propertyTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))
            ) : (
              <>
                <SelectItem value="apartment">Apartamento</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="land">Terreno</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>


        {/* Botão Filtros Avançados */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 text-white border-0"
              style={{ backgroundColor: secondaryColor }}
            >
              <span>Avançado</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Código do Imóvel
                </label>
                <Input
                  placeholder="Ex: IMG001"
                  value={filters.property_code}
                  onChange={(e) => handleTextFieldChange('property_code', e.target.value, 50)}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Cidade
                </label>
                <Input
                  placeholder="Nome da cidade"
                  value={filters.city}
                  onChange={(e) => handleTextFieldChange('city', e.target.value, 100)}
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Bairro
                </label>
                <Input
                  placeholder="Nome do bairro"
                  value={filters.neighborhood}
                  onChange={(e) => handleTextFieldChange('neighborhood', e.target.value, 100)}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Estado (UF)
                </label>
                <Input
                  placeholder="Ex: SP, RJ"
                  value={filters.uf}
                  onChange={(e) => handleTextFieldChange('uf', e.target.value.toUpperCase(), 2)}
                  maxLength={2}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Preço Mínimo
                </label>
                <Input
                  placeholder="Valor mínimo"
                  type="text"
                  value={filters.min_price}
                  onChange={(e) => handlePriceChange('min_price', e.target.value)}
                  maxLength={12}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Preço Máximo
                </label>
                <Input
                  placeholder="Valor máximo"
                  type="text"
                  value={filters.max_price}
                  onChange={(e) => handlePriceChange('max_price', e.target.value)}
                  maxLength={12}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Quartos
                </label>
                <Select 
                  value={filters.bedrooms} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    bedrooms: value === 'all' ? '' : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Quartos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-white border-0"
            style={{ backgroundColor: secondaryColor }}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;
