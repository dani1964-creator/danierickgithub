#!/bin/bash
set -e

echo "Starting Next.js application..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Verificar se .next existe
if [ ! -d ".next" ]; then
    echo "ERROR: .next directory not found!"
    echo "Contents of current directory:"
    ls -la
    exit 1
fi

echo "Starting Next.js server..."
exec npm start
