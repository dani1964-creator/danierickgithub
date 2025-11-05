#!/bin/bash
# Script para substituir react-router-dom por Next.js router em todos os arquivos

echo "Iniciando correção de react-router-dom para Next.js router..."

# Lista de arquivos a corrigir (excluindo _vite_legacy)
files=(
  "frontend/pages/notfound.tsx"
  "frontend/pages/auth.tsx"
  "frontend/pages/about-us.tsx"
  "frontend/pages/privacy-policy.tsx"
  "frontend/pages/public-site.tsx"
  "frontend/pages/terms-of-use.tsx"
  "frontend/pages/dashboard.tsx"
  "frontend/components/home/FixedHeader.tsx"
  "frontend/components/home/Footer.tsx"
  "frontend/components/ui/page-transition.tsx"
  "frontend/components/properties/PropertyCard.tsx"
  "frontend/components/properties/PropertyDetailPage.tsx"
  "frontend/components/layout/PersistentLayout.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processando: $file"
    
    # Substituir imports
    sed -i "s/import { useNavigate } from 'react-router-dom';/import { useRouter } from 'next\/router';/g" "$file"
    sed -i "s/import { useLocation } from 'react-router-dom';/import { useRouter } from 'next\/router';/g" "$file"
    sed -i "s/import { useParams } from 'react-router-dom';/import { useRouter } from 'next\/router';/g" "$file"
    sed -i "s/import { Navigate } from 'react-router-dom';/\/\/ Navigate não é necessário no Next.js - use router.push()/g" "$file"
    sed -i 's/import { Outlet, useLocation } from '\''react-router-dom'\'';/import { useRouter } from '\''next\/router'\'';/g' "$file"
    
    # Patterns mais complexos
    sed -i "s/import { useLocation, useNavigate } from \"react-router-dom\";/import { useRouter } from 'next\/router';/g" "$file"
    sed -i "s/import { useParams, Navigate, useNavigate } from 'react-router-dom';/import { useRouter } from 'next\/router';/g" "$file"
    sed -i "s/import { Navigate, useNavigate } from 'react-router-dom';/import { useRouter } from 'next\/router';/g" "$file"
    sed -i "s/import { useNavigate, useParams } from 'react-router-dom';/import { useRouter } from 'next\/router';/g" "$file"
    sed -i "s/import { useParams, useNavigate } from 'react-router-dom';/import { useRouter } from 'next\/router';/g" "$file"
    
  else
    echo "Arquivo não encontrado: $file"
  fi
done

echo "✅ Correção concluída!"
echo ""
echo "⚠️  ATENÇÃO: Você precisará ajustar manualmente:"
echo "  - const navigate = useNavigate() → const router = useRouter()"
echo "  - const location = useLocation() → const router = useRouter()"
echo "  - const params = useParams() → const router = useRouter()"
echo "  - navigate('/path') → router.push('/path')"
echo "  - location.pathname → router.pathname"
echo "  - params.id → router.query.id"
echo "  - <Navigate to='/path' /> → remover e usar router.push()"
echo "  - <Outlet /> → {children} (no layout)"
