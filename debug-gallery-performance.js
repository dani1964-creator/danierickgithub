/**
 * Script para detectar problemas específicos na galeria de imagens
 * que podem estar causando lentidão especificamente no imóvel "casa teste venda"
 */

// Função para detectar URLs de imagem problemáticas
function analyzeImageUrls(urls) {
  const analysis = {
    totalImages: urls.length,
    issues: [],
    recommendations: []
  };
  
  urls.forEach((url, index) => {
    // Verificar tamanho estimado da URL (URLs muito longas podem indicar dados inline)
    if (url.length > 500) {
      analysis.issues.push(`Imagem ${index + 1}: URL muito longa (${url.length} caracteres)`);
    }
    
    // Verificar se é data URL (base64)
    if (url.startsWith('data:')) {
      analysis.issues.push(`Imagem ${index + 1}: Data URL (base64) - pode causar lentidão`);
      analysis.recommendations.push(`Converter imagem ${index + 1} para arquivo hospedado`);
    }
    
    // Verificar domínio de origem
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('temp') || urlObj.hostname.includes('test')) {
        analysis.issues.push(`Imagem ${index + 1}: Hostname temporário (${urlObj.hostname})`);
      }
      
      // Verificar se é HTTPS
      if (urlObj.protocol === 'http:') {
        analysis.issues.push(`Imagem ${index + 1}: Usando HTTP ao invés de HTTPS`);
      }
    } catch (e) {
      analysis.issues.push(`Imagem ${index + 1}: URL inválida - ${e.message}`);
    }
  });
  
  return analysis;
}

// Função para testar velocidade de carregamento de imagens
function testImageLoadSpeed(url) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      resolve({
        url,
        loadTime,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        size: `${img.naturalWidth}x${img.naturalHeight}`,
        status: 'success'
      });
    };
    
    img.onerror = () => {
      const loadTime = performance.now() - startTime;
      resolve({
        url,
        loadTime,
        status: 'error'
      });
    };
    
    img.src = url;
  });
}

// Simulação de URLs de exemplo (baseado no padrão do projeto)
const sampleImageUrls = [
  // URLs típicas de imóveis
  'https://example.com/property-images/casa-teste-venda-1.jpg',
  'https://example.com/property-images/casa-teste-venda-2.jpg',
  // URL problemática simulada
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...' // Base64 muito longo
];

console.log('=== Análise de Performance da Galeria ===');
console.log('');

// Análise das URLs
const analysis = analyzeImageUrls(sampleImageUrls);
console.log('📊 Análise das URLs das Imagens:');
console.log(`Total de imagens: ${analysis.totalImages}`);

if (analysis.issues.length > 0) {
  console.log('');
  console.log('⚠️  Problemas identificados:');
  analysis.issues.forEach(issue => console.log(`   • ${issue}`));
}

if (analysis.recommendations.length > 0) {
  console.log('');
  console.log('💡 Recomendações:');
  analysis.recommendations.forEach(rec => console.log(`   • ${rec}`));
}

console.log('');
console.log('🔧 Otimizações já implementadas:');
console.log('   • Transições reduzidas de 500ms para 300ms');
console.log('   • will-change adicionado para otimização de GPU');
console.log('   • Preload inteligente das próximas 2 imagens');
console.log('   • SafeImage otimizado com useCallback');
console.log('   • Qualidade de imagem ajustada para 85%');

console.log('');
console.log('📋 Checklist para "casa teste venda":');
console.log('   □ Verificar se as imagens são < 500KB cada');
console.log('   □ Confirmar que não há data URLs (base64)');
console.log('   □ Validar que todas URLs são HTTPS');
console.log('   □ Testar em rede 3G para simular condições lentas');
console.log('   □ Verificar se há muitas imagens (>10) no array');

console.log('');
console.log('🚀 Próximos passos recomendados:');
console.log('   1. Inspecionar elemento na galeria do imóvel específico');
console.log('   2. Abrir DevTools > Network e analisar tempo de carregamento');
console.log('   3. Verificar se há 404s ou timeouts em imagens específicas');
console.log('   4. Comparar performance com outros imóveis da mesma imobiliária');