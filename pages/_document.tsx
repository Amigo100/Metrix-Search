// file: pages/_document.tsx
import {
  DocumentProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

import i18nextConfig from '../next-i18next.config';

type Props = DocumentProps & {
  /* add custom document props if you ever need them */
};

export default function Document(props: Props) {
  const currentLocale =
    props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale;

  return (
    <Html lang={currentLocale}>
      <Head>
        {/* PWA meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-title" content="Metrix" />

        {/* NEW favicon assets (put the files in /public) */}
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
