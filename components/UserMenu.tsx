import { LogOut, Settings, User, Download, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/router';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const router = useRouter();
  const { user, signOut, resetPassword } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const isEmailUser = user.app_metadata?.provider === 'email';

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const displayName = (user.user_metadata as any)?.full_name || user.email;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) alert('Failed to sign out');
  };

  const handleSettings = () => {
    router.push('/settings');
    setOpen(false);
  };

  const handleDownload = () => {
    router.push('/download');
    setOpen(false);
  };

  const handleResetPassword = async () => {
    if (!user.email) return;
    const { error } = await resetPassword(user.email);
    if (error) alert('Failed to send reset email');
    else alert('Password reset email sent');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        className="p-1 h-auto"
        onClick={() => setOpen(true)}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={(user.user_metadata as any)?.avatar_url} />
          <AvatarFallback className="bg-teal-600 text-white text-sm">
            {displayName ? (
              getInitials(displayName)
            ) : (
              <User className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={(user.user_metadata as any)?.avatar_url} />
              <AvatarFallback className="bg-teal-600 text-white">
                {displayName ? (
                  getInitials(displayName)
                ) : (
                  <User className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button variant="outline" className="justify-start" onClick={handleSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
          <Button variant="outline" className="justify-start" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download App
          </Button>
          {isEmailUser && (
            <Button variant="outline" className="justify-start" onClick={handleResetPassword}>
              <KeyRound className="h-4 w-4 mr-2" />
              Reset Password
            </Button>
          )}
          <Button
            variant="outline"
            className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
