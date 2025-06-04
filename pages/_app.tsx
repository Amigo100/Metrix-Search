// /pages/_app.tsx
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { appWithTranslation } from 'next-i18next';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.className}>
      <Component {...pageProps} />
    </div>
  );
}

export default appWithTranslation(MyApp);
