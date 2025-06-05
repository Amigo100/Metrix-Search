import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { appWithTranslation } from 'next-i18next';
import '@/styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.className}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </div>
  );
}

export default appWithTranslation(MyApp);
