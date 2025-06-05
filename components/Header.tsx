import { Search, User, LogIn, UserPlus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { ProfileModal } from './ProfileModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Metrix</h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link
                href="#"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </Link>
              <button
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                onClick={() => setIsPrivacyOpen(true)}
              >
                <Shield className="h-4 w-4 inline mr-1" />
                Privacy
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/login" className="hidden sm:flex">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/login" className="hidden sm:flex">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="p-2" onClick={() => setIsProfileOpen(true)}>
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </>
  );
}

export default Header;
