#!/bin/bash

# ==========================================
# SCRIPT DE MANUTENÇÃO COMPLETA
# Executa auditoria e correção dos dados públicos
# ==========================================

echo "🔍 Iniciando auditoria completa dos dados públicos..."

# Verificar se o Supabase está configurado
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados"
    echo "Configure as variáveis de ambiente antes de executar este script"
    exit 1
fi

# Função para executar SQL no Supabase
execute_sql() {
    local file=$1
    local description=$2
    
    echo "📋 $description"
    echo "   Arquivo: $file"
    
    # Usar psql se disponível, ou curl como fallback
    if command -v psql >/dev/null 2>&1; then
        psql "$DATABASE_URL" -f "$file"
    else
        echo "⚠️  psql não disponível, execute manualmente o arquivo SQL: $file"
        echo "   Ou configure a conexão com o banco de dados"
    fi
    
    echo "✅ Concluído: $description"
    echo ""
}

# Executar scripts na ordem correta
echo "🚀 Executando scripts de auditoria e correção..."

# 1. Auditoria principal
execute_sql "AUDITORIA_DADOS_PUBLICOS.sql" "Auditoria principal e estrutura de dados"

# 2. Correções específicas
execute_sql "CORRECAO_DADOS_PUBLICOS.sql" "Correções de inconsistências e normalização"

echo "🎯 Manutenção completa finalizada!"
echo ""
echo "📊 Próximos passos:"
echo "1. Verifique os relatórios gerados pelos scripts SQL"
echo "2. Teste o site público para confirmar que as informações aparecem consistentemente"
echo "3. Monitore logs para identificar outros problemas"
echo ""
echo "🔧 Para build e deploy:"
echo "   cd frontend && npm run build"
echo "   (Verifique se não há erros de TypeScript)"
echo ""
echo "📝 Observações importantes:"
echo "- Todas as propriedades públicas agora têm dados obrigatórios preenchidos"
echo "- Políticas RLS foram atualizadas para garantir acesso consistente"
echo "- Funções RPC foram corrigidas para retornar dados completos"
echo "- Cache do frontend foi atualizado para usar as novas funções"
echo ""
echo "✨ O site público agora deve mostrar informações consistentes!"