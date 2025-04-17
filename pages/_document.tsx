// file: pages/_document.tsx  (unchanged imports)

export default function Document(props: Props) {
  const currentLocale =
    props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale;

  return (
    <Html lang={currentLocale}>
      <Head>
        {/* PWA meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-title" content="Metrix" />

        {/* NEW: favicon & Apple touch icon */}
        <link rel="icon" href="/favicon-v2.png" sizes="any" />
        <link
          rel="apple-touch-icon"
          href="/favicon-v2.png"
          sizes="180x180"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
