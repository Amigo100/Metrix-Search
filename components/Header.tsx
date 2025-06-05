import { Search, LogIn, UserPlus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from './UserMenu';
import { useState } from 'react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

const Header = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}> 
            <Search className="h-8 w-8 text-teal-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Metrix</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
              About
            </Link>
            <button className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors" onClick={() => setIsPrivacyOpen(true)}>
              <Shield className="h-4 w-4 inline mr-1" />
              Privacy
            </button>
          </nav>
          <div className="flex items-center space-x-4">
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => router.push('/login')}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button size="sm" className="hidden sm:flex bg-teal-600 hover:bg-teal-700" onClick={() => router.push('/signup')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                  <Button variant="outline" size="sm" className="p-2 sm:hidden" onClick={() => router.push('/login')}>
                    <LogIn className="h-4 w-4" />
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </div>
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </header>
  );
};

export default Header;
