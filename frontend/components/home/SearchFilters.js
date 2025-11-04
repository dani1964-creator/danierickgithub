"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const collapsible_1 = require("@/components/ui/collapsible");
const security_1 = require("@/lib/security");
const SearchFilters = ({ searchTerm, setSearchTerm, filters, setFilters, hasActiveFilters, primaryColor = '#2563eb', secondaryColor = '#64748b', propertyTypeOptions, propertyTypeGroups }) => {
    const [isAdvancedOpen, setIsAdvancedOpen] = (0, react_1.useState)(false);
    const searchInputRef = (0, react_1.useRef)(null);
    const handleSearchChange = (value) => {
        // Sanitize and limit search input
        const sanitized = (0, security_1.sanitizeInput)(value).substring(0, 200);
        setSearchTerm(sanitized);
    };
    const handlePriceChange = (field, value) => {
        // Only allow numeric input for prices
        const numericValue = value.replace(/[^0-9]/g, '');
        // Limit to reasonable price range
        const limitedValue = numericValue.substring(0, 12); // Max 12 digits
        setFilters(prev => ({
            ...prev,
            [field]: limitedValue
        }));
    };
    const handleTextFieldChange = (field, value, maxLength = 100) => {
        // Sanitize text input
        const sanitized = (0, security_1.sanitizeInput)(value).substring(0, maxLength);
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-background dark:bg-card rounded-2xl shadow-soft-2 border dark:border-border p-6 md:p-8 space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { ref: searchInputRef, placeholder: "Buscar por localiza\u00E7\u00E3o, tipo de im\u00F3vel, c\u00F3digo...", value: searchTerm, onChange: (e) => handleSearchChange(e.target.value), className: "h-12 sm:h-14 text-base pl-12 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary/50 shadow-sm", maxLength: 200 }), (0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { className: "h-12 sm:h-14 px-6 sm:px-8 text-base font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200", style: { backgroundColor: primaryColor }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "h-5 w-5 mr-2" }), (0, jsx_runtime_1.jsx)("span", { children: "Buscar" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-3 items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { className: "h-5 w-5 text-primary" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-semibold text-foreground", children: "Filtros R\u00E1pidos:" })] }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: filters.transaction_type, onValueChange: (value) => setFilters(prev => ({
                            ...prev,
                            transaction_type: value === 'all' ? '' : value
                        })), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { className: "w-32 sm:w-36 h-11 text-sm font-medium rounded-xl border-2 border-gray-200 hover:border-primary/30 transition-colors", children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Transa\u00E7\u00E3o" }) }), (0, jsx_runtime_1.jsxs)(select_1.SelectContent, { className: "rounded-xl", children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "all", children: "Todos" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "sale", children: "Venda" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "rent", children: "Aluguel" })] })] }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: filters.property_type || 'all', onValueChange: (value) => setFilters(prev => ({
                            ...prev,
                            property_type: value === 'all' ? '' : value
                        })), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { className: "w-36 sm:w-44 h-11 text-sm font-medium rounded-xl border-2 border-gray-200 hover:border-primary/30 transition-colors", children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "Tipo de Im\u00F3vel" }) }), (0, jsx_runtime_1.jsxs)(select_1.SelectContent, { className: "rounded-xl", children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "all", children: "Todos os Tipos" }), propertyTypeGroups && propertyTypeGroups.length > 0 ? (propertyTypeGroups.map((group) => ((0, jsx_runtime_1.jsxs)(select_1.SelectGroup, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectLabel, { className: "font-semibold text-primary", children: group.label }), group.options.map((opt) => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: opt.value, children: opt.label }, opt.value)))] }, group.label)))) : propertyTypeOptions && propertyTypeOptions.length > 0 ? (propertyTypeOptions.map((opt) => ((0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: opt.value, children: opt.label }, opt.value)))) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "apartment", children: "Apartamento" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "house", children: "Casa" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "commercial", children: "Comercial" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "land", children: "Terreno" })] }))] })] }), (0, jsx_runtime_1.jsxs)(collapsible_1.Collapsible, { open: isAdvancedOpen, onOpenChange: setIsAdvancedOpen, children: [(0, jsx_runtime_1.jsx)(collapsible_1.CollapsibleTrigger, { asChild: true, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-gray-200 dark:border-border hover:border-primary/30 bg-background dark:bg-muted hover:bg-gray-50 dark:hover:bg-muted/80 text-foreground hover:text-primary font-medium transition-all duration-200", children: [(0, jsx_runtime_1.jsx)("span", { children: "Filtros Avan\u00E7ados" }), isAdvancedOpen ? ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronUp, { className: "h-4 w-4" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "h-4 w-4" }))] }) }), (0, jsx_runtime_1.jsx)(collapsible_1.CollapsibleContent, { className: "mt-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm font-semibold text-foreground block", children: "C\u00F3digo do Im\u00F3vel" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Ex: IMG001", value: filters.property_code, onChange: (e) => handleTextFieldChange('property_code', e.target.value, 50), maxLength: 50, className: "h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm font-semibold text-foreground block", children: "Cidade" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Nome da cidade", value: filters.city, onChange: (e) => handleTextFieldChange('city', e.target.value, 100), maxLength: 100, className: "h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm font-semibold text-foreground block", children: "Bairro" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Nome do bairro", value: filters.neighborhood, onChange: (e) => handleTextFieldChange('neighborhood', e.target.value, 100), maxLength: 100, className: "h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm font-semibold text-foreground block", children: "Estado (UF)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "Ex: SP, RJ", value: filters.uf, onChange: (e) => handleTextFieldChange('uf', e.target.value.toUpperCase(), 2), maxLength: 2, className: "h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm font-semibold text-foreground block", children: "Pre\u00E7o M\u00EDnimo" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "R$ 0", type: "text", value: filters.min_price, onChange: (e) => handlePriceChange('min_price', e.target.value), maxLength: 12, className: "h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm font-semibold text-foreground block", children: "Pre\u00E7o M\u00E1ximo" }), (0, jsx_runtime_1.jsx)(input_1.Input, { placeholder: "R$ 999.999", type: "text", value: filters.max_price, onChange: (e) => handlePriceChange('max_price', e.target.value), maxLength: 12, className: "h-11 rounded-xl border-2 border-gray-200 focus:border-primary/50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm font-semibold text-foreground block", children: "Quartos" }), (0, jsx_runtime_1.jsxs)(select_1.Select, { value: filters.bedrooms, onValueChange: (value) => setFilters(prev => ({
                                                        ...prev,
                                                        bedrooms: value === 'all' ? '' : value
                                                    })), children: [(0, jsx_runtime_1.jsx)(select_1.SelectTrigger, { className: "h-11 rounded-xl border-2 border-gray-200 hover:border-primary/30", children: (0, jsx_runtime_1.jsx)(select_1.SelectValue, { placeholder: "N\u00BA de Quartos" }) }), (0, jsx_runtime_1.jsxs)(select_1.SelectContent, { className: "rounded-xl", children: [(0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "all", children: "Todos" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "1", children: "1 Quarto" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "2", children: "2 Quartos" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "3", children: "3 Quartos" }), (0, jsx_runtime_1.jsx)(select_1.SelectItem, { value: "4", children: "4+ Quartos" })] })] })] })] }) })] }), hasActiveFilters && ((0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", onClick: clearAllFilters, className: "flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 bg-background dark:bg-card hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-all duration-200", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-4 w-4" }), "Limpar Filtros"] }))] })] }));
};
exports.default = SearchFilters;
