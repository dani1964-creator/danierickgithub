#!/bin/bash
echo "=== DIAGNÓSTICO FINAL ==="
echo "Buscando arquivos que fazem CREATE FUNCTION sem DROP..."

cd supabase/migrations

echo "Arquivos com CREATE sem DROP precedente:"
for file in *.sql; do
  if grep -q "CREATE.*FUNCTION" "$file"; then
    if ! grep -q "DROP.*FUNCTION.*IF EXISTS" "$file"; then
      echo "PRECISA DROP: $file"
    fi
  fi
done

echo -e "\n=== ANÁLISE ESPECÍFICA ==="
echo "Funções mais problemáticas:"
grep -o "CREATE.*FUNCTION [^(]*" *.sql | sort | uniq -c | sort -nr | head -10

