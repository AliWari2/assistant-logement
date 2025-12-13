import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta charset="utf-8" />
        <meta name="description" content="Assistant IA pour résoudre vos problèmes immobiliers" />
        <meta name="theme-color" content="#2a5298" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Assistant Immo" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%232a5298' width='192' height='192'/><text x='50%' y='50%' font-size='120' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'>🏢</text></svg>" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%232a5298' width='100' height='100'/><text x='50' y='50' font-size='70' text-anchor='middle' dominant-baseline='middle'>🏢</text></svg>" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/service-worker.js').then((reg) => {
                console.log('Service Worker registered:', reg);
              }).catch((err) => {
                console.log('Service Worker registration failed:', err);
              });
            });
          }
        `}} />
      </body>
    </Html>
  );
}