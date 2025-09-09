# Guia de Domínios Personalizados

## Como Funciona

Agora você pode usar domínios personalizados para seu site de imobiliária! O sistema detecta automaticamente se você está usando um domínio próprio ou o slug padrão da Lovable.

## Configuração

### 1. No Painel Administrativo
1. Acesse **Configurações do Site** 
2. Na aba **Geral**, preencha:
   - **URL do Site**: Mantenha seu slug (ex: `home`, `imoveis`)
   - **Domínio Personalizado**: Digite seu domínio (ex: `meusite.com.br`)

### 2. Configuração DNS
No seu provedor de domínio, configure:
- **Tipo**: A Record
- **Nome**: @ (para domínio raiz) e www 
- **Valor**: 185.158.133.1 (IP da Lovable)

### 3. Na Vercel/Lovable
1. Adicione seu domínio personalizado
2. Configure SSL automático
3. Aguarde propagação DNS (até 48h)

## Vantagens

✅ **Múltiplos usuários podem usar o mesmo slug** (ex: `/home`)  
✅ **Cada imobiliária tem seu próprio domínio**  
✅ **Sem conflito de dados entre sites**  
✅ **SEO melhorado com domínio próprio**  
✅ **Backward compatibility** com slugs existentes  

## Exemplo de Uso

- **Site A**: `imobiliaria-santos.com.br` (slug: `/home`)
- **Site B**: `corretor-sp.com.br` (slug: `/home`) 
- **Site C**: `lovable.app/casa-praia` (slug: `/casa-praia`)

Todos funcionam independentemente!

## Notas Técnicas

- O sistema detecta automaticamente se é domínio personalizado
- Prioriza busca por domínio, depois por slug
- Mantém compatibilidade com URLs antigas
- Banco de dados otimizado com índices para performance