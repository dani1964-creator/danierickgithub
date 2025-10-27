#!/usr/bin/env node

const fetch = require('node-fetch');

const SUPABASE_URL = 'https://demcjskpwcxqohzlyjxb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww';

async function testSupabase() {
  try {
    console.log('=== Testando conexão com Supabase ===');
    
    // Teste 1: Listar brokers
    const brokersResponse = await fetch(`${SUPABASE_URL}/rest/v1/brokers?select=id,business_name,website_slug`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    const brokers = await brokersResponse.json();
    console.log('Brokers encontrados:', brokers);
    
    // Teste 2: Testar função RPC
    const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_broker_by_domain_or_slug`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ website_slug_param: 'teste' })
    });
    
    const rpcResult = await rpcResponse.json();
    console.log('Resultado da função RPC:', rpcResult);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testSupabase();