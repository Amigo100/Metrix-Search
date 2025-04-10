// /pages/_app.tsx
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Inter } from 'next/font/google';
import { appWithTranslation } from 'next-i18next';

import '@/styles/globals.css';

import HomeContextProvider from '@/pages/api/home/home.provider';
import AppLayout from '@/layouts/AppLayout';

const inter = Inter({ subsets: ['latin'] });

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const noLayoutNeeded = ['/', '/login'];
  const useLayout = !noLayoutNeeded.includes(router.pathname);

  return (
    <div className={inter.className}>
      <HomeContextProvider>
        {useLayout ? (
          <AppLayout>
            <Component {...pageProps} />
          </AppLayout>
        ) : (
          <Component {...pageProps} />
        )}
      </HomeContextProvider>
    </div>
  );
}

export default appWithTranslation(MyApp);
