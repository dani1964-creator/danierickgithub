import { useEffect, useState } from 'react';

export default function DiagnosticBanner() {
  const [hostname, setHostname] = useState('');
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'adminimobiliaria.site';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHostname(window.location.hostname || '');
  }, []);

  if (!hostname) return null;

  const copyInfo = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ hostname, baseDomain }));
      // no toast lib here to avoid extra deps
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <strong className="text-yellow-800">Diagnóstico de DNS / Hostname</strong>
          <p className="text-sm text-yellow-700 mt-1">Hostname: <span className="font-medium">{hostname}</span> · Domínio base: <span className="font-medium">{baseDomain}</span></p>
          <ul className="mt-2 text-sm text-yellow-700 list-disc ml-5">
            <li>Se estiver vendo uma página de erro (ex: Cloudflare 1016), verifique onde o DNS do domínio está apontando no provedor (DigitalOcean/registros do domínio).</li>
            <li>Verifique se existe um registro wildcard <code>*.{baseDomain}</code> apontando para o App/Droplet ou um A/CNAME correto.</li>
            <li>Se houver um serviço de CDN/Proxy (ex: Cloudflare), ele pode interceptar a requisição — confirme as nameservers e registros.</li>
          </ul>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <button onClick={copyInfo} className="px-3 py-1 rounded bg-yellow-600 text-white text-sm">Copiar info</button>
          <a
            className="text-sm underline text-yellow-800"
            href={`mailto:suporte@adminimobiliaria.site?subject=Diagnostico%20DNS&body=${encodeURIComponent(
              `Hostname: ${hostname}\nBase domain: ${baseDomain}`
            )}`}
          >
            Enviar por e-mail
          </a>
        </div>
      </div>
    </div>
  );
}
