#!/bin/bash

# Cron job para verificar vencimento de assinaturas
# Adicione no crontab para executar diariamente às 09:00:
# 0 9 * * * /path/to/check-subscription-expiration.sh

# Log file
LOG_FILE="/var/log/subscription-checker.log"

# Função para log com timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

log_message "Iniciando verificação de vencimentos de assinatura..."

# URL da função Supabase ou endpoint local
FUNCTION_URL="${SUPABASE_URL}/rest/v1/rpc/check_subscription_expiration"
API_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    log_message "ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas"
    exit 1
fi

# Executar função de verificação
response=$(curl -s -X POST "$FUNCTION_URL" \
    -H "apikey: $API_KEY" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{}')

if [ $? -eq 0 ]; then
    log_message "Verificação concluída com sucesso"
    log_message "Resposta: $response"
else
    log_message "ERRO: Falha na verificação de vencimentos"
    log_message "Resposta: $response"
fi

log_message "Verificação finalizada"