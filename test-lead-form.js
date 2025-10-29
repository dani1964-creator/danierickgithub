const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testLeadSubmission() {
  console.log('Testando submissão de lead...')
  
  // Primeiro, vamos testar o broker_id válido
  try {
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('id, business_name')
      .limit(1)

    if (brokersError) {
      console.log('Erro ao buscar brokers:', brokersError)
      return
    }

    if (!brokers || brokers.length === 0) {
      console.log('Nenhum broker encontrado')
      return
    }

    const brokerId = brokers[0].id
    console.log('Usando broker:', brokers[0].business_name, 'ID:', brokerId)

    // Agora vamos tentar inserir um lead
    const leadData = {
      name: 'João Teste',
      email: 'joao.teste@example.com',
      phone: '11999999999',
      message: 'Teste de formulário',
      broker_id: brokerId,
      source: 'website'
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()

    if (error) {
      console.log('Erro ao inserir lead:', error)
    } else {
      console.log('Lead inserido com sucesso:', data)
    }
  } catch (err) {
    console.log('Erro geral:', err)
  }
}

testLeadSubmission()