import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        {/* Fallbacks adicionais para dispositivos e navegadores que suportam SVG */}
        <link rel="icon" type="image/svg+xml" href="/imobideps-logo.svg" />
        <link rel="apple-touch-icon" href="/imobideps-logo.svg" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
