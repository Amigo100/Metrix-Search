import { User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ProfileModal } from './ProfileModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Metrix</h1>
                  <p className="text-xs text-gray-500">Clinical Guidelines Platform</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileOpen(true)}
                className="text-gray-700 hover:bg-gray-100"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Privacy Policy
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
