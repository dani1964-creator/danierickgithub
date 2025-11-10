import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    {/* NÃO usar o SVG do produto como favicon global para sites públicos.
      O favicon das vitrines públicas deve ser configurado por corretor
      e é injetado dinamicamente em cada página pública via <Head>. */}
        <meta name="theme-color" content="#000000" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
