#!/bin/bash

# ==========================================
# SCRIPT DE CORREÇÃO COMPLETA - DADOS PÚBLICOS
# Executa migração consolidada para resolver problemas de inconsistência
# ==========================================

echo "🔍 Iniciando correção completa dos dados públicos..."

# Verificar se estamos no diretório correto
if [ ! -f "MIGRACAO_FINAL_DADOS_PUBLICOS.sql" ]; then
    echo "❌ Arquivo MIGRACAO_FINAL_DADOS_PUBLICOS.sql não encontrado"
    echo "Execute este script na raiz do projeto"
    exit 1
fi

# Função para executar SQL no Supabase
execute_sql() {
    local file=$1
    local description=$2
    
    echo "📋 $description"
    echo "   Arquivo: $file"
    
    # Verificar se psql está disponível
    if command -v psql >/dev/null 2>&1; then
        if [ -n "$DATABASE_URL" ]; then
            echo "   Executando via psql..."
            psql "$DATABASE_URL" -f "$file"
            if [ $? -eq 0 ]; then
                echo "✅ SQL executado com sucesso"
            else
                echo "❌ Erro ao executar SQL"
                exit 1
            fi
        else
            echo "❌ DATABASE_URL não configurada"
            echo "   Configure a variável de ambiente DATABASE_URL"
            exit 1
        fi
    else
        echo "⚠️  psql não disponível"
        echo ""
        echo "🔧 Para executar manualmente:"
        echo "   1. Acesse o Supabase SQL Editor"
        echo "   2. Cole o conteúdo do arquivo: $file"
        echo "   3. Execute o script"
        echo ""
        echo "💡 Ou instale psql e configure DATABASE_URL"
        return 1
    fi
}

# Build do frontend primeiro para verificar se não há erros
echo "🏗️  Verificando build do frontend..."
cd frontend
if npm run build > build.log 2>&1; then
    echo "✅ Build do frontend bem-sucedido"
    cd ..
else
    echo "❌ Erro no build do frontend"
    echo "   Verifique o arquivo frontend/build.log para detalhes"
    cd ..
    exit 1
fi

# Executar migração consolidada
execute_sql "MIGRACAO_FINAL_DADOS_PUBLICOS.sql" "Migração consolidada - correção de dados públicos"

# Verificar se foi bem-sucedido
if [ $? -eq 0 ]; then
    echo ""
    echo "🎯 Correção completa finalizada com sucesso!"
    echo ""
    echo "📊 O que foi corrigido:"
    echo "✅ Colunas obrigatórias adicionadas (is_public, is_active, views_count, etc.)"
    echo "✅ Dados normalizados (bairros vazios preenchidos, contadores zerados)"
    echo "✅ Políticas RLS atualizadas para acesso consistente"
    echo "✅ Funções RPC corrigidas para retornar dados completos"
    echo "✅ Índices de performance criados"
    echo ""
    echo "🔍 Para verificar:"
    echo "1. Acesse o site público"
    echo "2. Faça refresh várias vezes"
    echo "3. Confirme que informações permanecem consistentes"
    echo "4. Verifique que bairro e visualizações sempre aparecem"
    echo ""
    echo "🚀 Deploy recomendado:"
    echo "   cd frontend && npm run build && npm run start"
    echo ""
    echo "✨ Problema de dados sumindo após refresh RESOLVIDO!"
else
    echo ""
    echo "❌ Erro na execução da migração"
    echo "   Verifique os logs acima para detalhes"
    exit 1
fi