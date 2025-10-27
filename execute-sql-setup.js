const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://zlngnbfczegzcgwadacj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  try {
    console.log('🚀 Iniciando execução do script SQL...');
    
    // Ler o script SQL
    const sqlScript = fs.readFileSync('./setup-complete-brokers.sql', 'utf8');
    
    // Dividir o script em comandos individuais (separados por ponto e vírgula)
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📝 Encontrados ${commands.length} comandos SQL para executar`);
    
    // Executar comando por comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.toLowerCase().includes('select')) {
        // Para SELECTs, usar .from()
        console.log(`🔍 Executando consulta ${i + 1}...`);
        
        if (command.toLowerCase().includes('auth.users')) {
          // Consulta especial para auth.users
          const { data, error } = await supabase.auth.admin.listUsers();
          if (error) {
            console.error(`❌ Erro na consulta ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Consulta ${i + 1} executada com sucesso`);
          }
        } else {
          // Outras consultas
          const { data, error } = await supabase.rpc('execute_sql', { sql_command: command });
          if (error) {
            console.error(`❌ Erro na consulta ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Consulta ${i + 1} executada:`, data);
          }
        }
      } else {
        // Para INSERTs, UPDATEs, etc., usar RPC se disponível ou method específico
        console.log(`💾 Executando comando ${i + 1}...`);
        
        try {
          if (command.toLowerCase().includes('insert into auth.users')) {
            // Comando especial para criar usuários - vamos pular pois precisa de privilégios especiais
            console.log(`⚠️  Pulando criação de usuário auth (requer privilégios especiais)`);
            continue;
          }
          
          if (command.toLowerCase().includes('insert into brokers')) {
            // Inserir broker usando método direto
            const brokerData = {
              id: '550e8400-e29b-41d4-a716-446655440002',
              user_id: '550e8400-e29b-41d4-a716-446655440001', // Vamos usar um ID temporário
              business_name: 'Danierick Imobiliária',
              website_slug: 'danierick',
              email: 'danierick@adminimobiliaria.site',
              phone: '(11) 99999-7777',
              address: 'Av. Principal, 1000 - Sala 101',
              city: 'São Paulo',
              uf: 'SP',
              cep: '01310-100',
              primary_color: '#1e40af',
              secondary_color: '#64748b',
              is_active: true,
              subscription_status: 'active',
              subscription_tier: 'pro',
              site_title: 'Danierick Imobiliária - Seu Imóvel Ideal',
              site_description: 'Encontre o imóvel perfeito com a Danierick Imobiliária. Especialistas em vendas e locações em São Paulo.',
              subdomain: 'danierick',
              canonical_prefer_custom_domain: false
            };
            
            const { data, error } = await supabase
              .from('brokers')
              .upsert(brokerData, { onConflict: 'website_slug' });
            
            if (error) {
              console.error(`❌ Erro ao inserir broker:`, error.message);
            } else {
              console.log(`✅ Broker 'danierick' criado com sucesso!`);
            }
            continue;
          }
          
          // Para outros comandos, tentar executar diretamente
          const { data, error } = await supabase.rpc('execute_sql', { sql_command: command });
          if (error) {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (err) {
          console.error(`❌ Exceção no comando ${i + 1}:`, err.message);
        }
      }
    }
    
    // Verificar se o broker foi criado
    console.log('\n🔍 Verificando broker criado...');
    const { data: brokers, error: brokerError } = await supabase
      .from('brokers')
      .select('*')
      .eq('website_slug', 'danierick');
    
    if (brokerError) {
      console.error('❌ Erro ao verificar broker:', brokerError.message);
    } else if (brokers && brokers.length > 0) {
      console.log('✅ Broker "danierick" encontrado:', brokers[0]);
    } else {
      console.log('⚠️  Broker "danierick" não encontrado');
    }
    
    console.log('\n🎉 Script executado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

executeSQLScript();