// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="description" content="Track your personal expenses easily with our intuitive dashboard." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#10b981" /> {/* Tailwind emerald-500 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        {/* Example Google Font (Optional) */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
