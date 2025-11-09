const dns = require('dns').promises;

async function check(name){
  console.log('==', name, '==');
  try{
    const a = await dns.resolve4(name);
    console.log('A:', a.join(', '));
  }catch(e){
    console.log('A: error -', e.code || e.message);
  }
  try{
    const cname = await dns.resolveCname(name);
    console.log('CNAME:', cname.join(', '));
  }catch(e){
    console.log('CNAME: none or error -', e.code || e.message);
  }
  try{
    const any = await dns.resolveAny(name);
    console.log('ANY:', any.map(x=>x.address||x.value||JSON.stringify(x)).join(', '));
  }catch(e){
    console.log('ANY: none or error -', e.code || e.message);
  }
  console.log('');
}

(async()=>{
  const names = ['adminimobiliaria.site','danierick.adminimobiliaria.site','test.adminimobiliaria.site','painel.adminimobiliaria.site'];
  for(const n of names) await check(n);
})();