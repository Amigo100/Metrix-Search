import { FileText, LogIn, Search, Shield, UserPlus } from 'lucide-react';

import Link from 'next/link';
import { useRouter } from 'next/router';

import { Button } from '@/components/ui/button';

import UserMenu from './UserMenu';

import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Search className="h-8 w-8 text-teal-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Metrix</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/about"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="flex items-center text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              <Shield className="h-4 w-4 mr-1" />
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="flex items-center text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              <FileText className="h-4 w-4 mr-1" />
              Terms
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            {!loading &&
              (user ? (
                <UserMenu />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex"
                    onClick={() => router.push('/login')}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="hidden sm:flex bg-teal-600 hover:bg-teal-700"
                    onClick={() => router.push('/signup')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2 sm:hidden"
                    onClick={() => router.push('/login')}
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>
                </>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
