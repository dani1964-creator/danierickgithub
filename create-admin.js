const { createClient } = require('@supabase/supabase-js');

async function createAdminUser() {
  // Configurações do Supabase
  const supabaseUrl = 'https://ysjkwtosaylrbmjqtvmr.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzamt3dG9zYXlscmJtanF0dm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MDg2NzEsImV4cCI6MjA0NTk4NDY3MX0.V0JOL4E9xyZyK_ue7GqkJk9KeZOEaNhTqf9CDRNEGck';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('Criando usuário admin...');
    
    // Tentar criar o usuário via signup
    const { data, error } = await supabase.auth.signUp({
      email: 'erickjq123@gmail.com',
      password: 'Danis0133.',
      options: {
        data: {
          business_name: 'Super Admin',
          display_name: 'Administrador do Sistema',
        }
      }
    });
    
    if (error) {
      console.error('Erro ao criar usuário:', error.message);
      
      // Se o usuário já existe, vamos tentar fazer login para testar
      if (error.message.includes('already registered')) {
        console.log('Usuário já existe. Testando login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'erickjq123@gmail.com',
          password: 'Danis0133.'
        });
        
        if (loginError) {
          console.error('Erro no login:', loginError.message);
        } else {
          console.log('✅ Login realizado com sucesso! Usuário já estava cadastrado.');
          console.log('Email:', loginData.user?.email);
        }
      }
    } else {
      console.log('✅ Usuário criado com sucesso!');
      console.log('Email:', data.user?.email);
      console.log('ID:', data.user?.id);
    }
    
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

createAdminUser();