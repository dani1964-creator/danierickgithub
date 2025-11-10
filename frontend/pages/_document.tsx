import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
    {/* Default favicon usado pelo painel/admin. */}
    <link rel="icon" href="/imobideps-logo.svg" />
    {/* NÃO usar o SVG do produto como fallback para vitrines públicas permanentemente.
      O favicon das vitrines públicas é injetado dinamicamente por páginas públicas
      (ex.: `pages/public-site.tsx` / TenantProvider) quando o corretor configurar um favicon.
      Aqui colocamos um favicon padrão que existe no /public para restaurar o ícone das abas do admin. */}
        <meta name="theme-color" content="#000000" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
