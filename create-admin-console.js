// Script para criar usuário admin via console do navegador
// Execute este código no DevTools do navegador na página da aplicação

(async function createAdminUser() {
  try {
    console.log('Iniciando criação de usuário admin...');
    
    // Importar o client do Supabase da aplicação
    const { supabase } = await import('./src/integrations/supabase/client.ts');
    
    // Tentar criar o usuário
    const { data, error } = await supabase.auth.signUp({
      email: 'erickjq123@gmail.com',
      password: 'Danis0133.',
      options: {
        data: {
          business_name: 'Super Admin',
          display_name: 'Administrador do Sistema'
        }
      }
    });
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      
      // Se o usuário já existe, vamos testar o login
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        console.log('🔄 Usuário já existe. Testando credenciais...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'erickjq123@gmail.com',
          password: 'Danis0133.'
        });
        
        if (loginError) {
          console.error('❌ Erro no login:', loginError.message);
        } else {
          console.log('✅ Login realizado com sucesso!');
          console.log('📧 Email:', loginData.user?.email);
          console.log('🆔 ID:', loginData.user?.id);
        }
      }
    } else {
      console.log('✅ Usuário criado com sucesso!');
      console.log('📧 Email:', data.user?.email);
      console.log('🆔 ID:', data.user?.id);
      console.log('📨 Verifique o email para confirmar a conta.');
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
})();