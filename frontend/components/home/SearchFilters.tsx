
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
    <div className="bg-background dark:bg-card rounded-2xl shadow-soft-2 border dark:border-border p-6 md:p-8 space-y-6">
      {/* Barra de Busca Principal */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            id="property-search"
            name="search"
            ref={searchInputRef}
            placeholder="Buscar por localização, tipo de imóvel, código..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-12 sm:h-14 text-base pl-12 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary/50 shadow-sm"
            maxLength={200}
            autoComplete="off"
            aria-label="Buscar imóveis"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        {/* Botão de busca sempre visível */}
        <Button 
          className="h-12 sm:h-14 px-6 sm:px-8 text-base font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          style={{ backgroundColor: primaryColor }}
        >
          <Search className="h-5 w-5 mr-2" />
          <span>Buscar</span>
        </Button>
      </div>

      {/* Filtros Básicos */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Filtros Rápidos:</span>
        </div>
        
        <Select 
          value={filters.transaction_type} 
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            transaction_type: value === 'all' ? '' : value 
          }))}
        >
          <SelectTrigger className="w-32 sm:w-36 h-11 text-sm font-medium rounded-xl border-2 border-gray-200 hover:border-primary/30 transition-colors">
            <SelectValue placeholder="Transação" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
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
          <SelectTrigger className="w-36 sm:w-44 h-11 text-sm font-medium rounded-xl border-2 border-gray-200 hover:border-primary/30 transition-colors">
            <SelectValue placeholder="Tipo de Imóvel" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {propertyTypeGroups && propertyTypeGroups.length > 0 ? (
              propertyTypeGroups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel className="font-semibold text-primary">{group.label}</SelectLabel>
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
              className="flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-gray-200 dark:border-border hover:border-primary/30 bg-background dark:bg-muted hover:bg-gray-50 dark:hover:bg-muted/80 text-foreground hover:text-primary font-medium transition-all duration-200"
            >
              <span>Filtros Avançados</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Código do Imóvel
                </label>
                <Input
                  placeholder="Ex: IMG001"
                  value={filters.property_code}
                  onChange={(e) => handleTextFieldChange('property_code', e.target.value, 50)}
                  maxLength={50}
                  className="h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Cidade
                </label>
                <Input
                  placeholder="Nome da cidade"
                  value={filters.city}
                  onChange={(e) => handleTextFieldChange('city', e.target.value, 100)}
                  maxLength={100}
                  className="h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Bairro
                </label>
                <Input
                  placeholder="Nome do bairro"
                  value={filters.neighborhood}
                  onChange={(e) => handleTextFieldChange('neighborhood', e.target.value, 100)}
                  maxLength={100}
                  className="h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Estado (UF)
                </label>
                <Input
                  placeholder="Ex: SP, RJ"
                  value={filters.uf}
                  onChange={(e) => handleTextFieldChange('uf', e.target.value.toUpperCase(), 2)}
                  maxLength={2}
                  className="h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Preço Mínimo
                </label>
                <Input
                  placeholder="R$ 0"
                  type="text"
                  value={filters.min_price}
                  onChange={(e) => handlePriceChange('min_price', e.target.value)}
                  maxLength={12}
                  className="h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Preço Máximo
                </label>
                <Input
                  placeholder="R$ 999.999"
                  type="text"
                  value={filters.max_price}
                  onChange={(e) => handlePriceChange('max_price', e.target.value)}
                  maxLength={12}
                  className="h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Quartos
                </label>
                <Select 
                  value={filters.bedrooms} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    bedrooms: value === 'all' ? '' : value 
                  }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-gray-200 hover:border-primary/30">
                    <SelectValue placeholder="Nº de Quartos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="1">1 Quarto</SelectItem>
                    <SelectItem value="2">2 Quartos</SelectItem>
                    <SelectItem value="3">3 Quartos</SelectItem>
                    <SelectItem value="4">4+ Quartos</SelectItem>
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
            onClick={clearAllFilters}
            className="flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 bg-background dark:bg-card hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-all duration-200"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;
