export type PropertyTypeOption = { value: string; label: string };
export type PropertyTypeGroup = { label: string; options: PropertyTypeOption[] };

export const PROPERTY_TYPE_GROUPS: PropertyTypeGroup[] = [
  {
    label: '🏠 Residenciais',
    options: [
      { value: 'house', label: 'Casa' },
      { value: 'sobrado', label: 'Sobrado' },
      { value: 'apartment', label: 'Apartamento' },
      { value: 'kitnet_studio', label: 'Kitnet / Studio' },
      { value: 'flat', label: 'Flat' },
      { value: 'loft', label: 'Loft' },
      { value: 'cobertura', label: 'Cobertura' },
      { value: 'duplex', label: 'Duplex' },
      { value: 'triplex', label: 'Triplex' },
      { value: 'casa_geminada', label: 'Casa geminada' },
      { value: 'casa_condominio', label: 'Casa de condomínio' },
      { value: 'mansao', label: 'Mansão' },
      { value: 'bangalo', label: 'Bangalô' },
      { value: 'chale', label: 'Chalé' },
      { value: 'edicula', label: 'Edícula' },
      { value: 'village', label: 'Village' },
      { value: 'tiny_house', label: 'Tiny House' },
    ],
  },
  {
    label: '🏢 Comerciais / Empresariais',
    options: [
      { value: 'sala_comercial', label: 'Sala comercial' },
      { value: 'loja', label: 'Loja' },
      { value: 'galpao', label: 'Galpão' },
      { value: 'armazem', label: 'Armazém' },
      { value: 'predio_comercial', label: 'Prédio comercial' },
      { value: 'andar_corporativo', label: 'Andar corporativo' },
      { value: 'escritorio', label: 'Escritório' },
      { value: 'ponto_comercial', label: 'Ponto comercial' },
      { value: 'quiosque', label: 'Quiosque' },
      { value: 'box_comercial', label: 'Box comercial' },
      { value: 'coworking', label: 'Coworking' },
      { value: 'galeria_comercial', label: 'Galeria comercial' },
    ],
  },
  {
    label: '🏗️ Terrenos e Lotes',
    options: [
      { value: 'land', label: 'Terreno' },
      { value: 'lote', label: 'Lote' },
      { value: 'loteamento', label: 'Loteamento' },
      { value: 'area', label: 'Área' },
      { value: 'gleba', label: 'Gleba' },
      { value: 'sitio_urbano', label: 'Sítio urbano' },
    ],
  },
  {
    label: '🌾 Rurais / Agropecuários',
    options: [
      { value: 'chacara', label: 'Chácara' },
      { value: 'sitio', label: 'Sítio' },
      { value: 'fazenda', label: 'Fazenda' },
      { value: 'haras', label: 'Haras' },
      { value: 'rancho', label: 'Rancho' },
      { value: 'area_rural', label: 'Área rural' },
      { value: 'terreno_agricola', label: 'Terreno agrícola' },
      { value: 'propriedade_rural', label: 'Propriedade rural' },
      { value: 'estancia', label: 'Estância' },
    ],
  },
  {
    label: '🏖️ Lazer e Turismo',
    options: [
      { value: 'casa_praia', label: 'Casa de praia' },
      { value: 'casa_campo', label: 'Casa de campo' },
      { value: 'pousada', label: 'Pousada' },
      { value: 'hotel', label: 'Hotel' },
      { value: 'resort', label: 'Resort' },
      { value: 'motel', label: 'Motel' },
      { value: 'hostel', label: 'Hostel' },
      { value: 'camping', label: 'Camping' },
      { value: 'glamping', label: 'Glamping' },
    ],
  },
  {
    label: '🏢 Empreendimentos e Condomínios',
    options: [
      { value: 'condominio_fechado', label: 'Condomínio fechado' },
      { value: 'condominio_vertical', label: 'Condomínio vertical (edifício)' },
      { value: 'condominio_horizontal', label: 'Condomínio horizontal (vilas, casas)' },
      { value: 'empreendimento', label: 'Empreendimento' },
      { value: 'complexo_imobiliario', label: 'Complexo imobiliário' },
      { value: 'condominio_lotes', label: 'Condomínio de lotes' },
    ],
  },
  {
    label: '🏘️ Outros tipos específicos',
    options: [
      { value: 'apart_hotel', label: 'Apart-hotel' },
      { value: 'flat_mobiliado', label: 'Flat mobiliado' },
      { value: 'casa_mista', label: 'Casa mista' },
      { value: 'casa_prefabricada', label: 'Casa pré-fabricada' },
      { value: 'container_house', label: 'Container house' },
      { value: 'imovel_historico', label: 'Imóvel histórico / tombado' },
      { value: 'predio_residencial', label: 'Prédio residencial' },
      { value: 'multifamiliar', label: 'Multifamiliar' },
      { value: 'duplex_comercial', label: 'Duplex comercial' },
      { value: 'condo', label: 'Condomínio' },
      { value: 'commercial', label: 'Comercial' },
    ],
  },
];

export const PROPERTY_TYPE_MAP: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPE_GROUPS.flatMap((g) => g.options.map((o) => [o.value, o.label]))
);
