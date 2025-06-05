import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { User, LogOut, Settings } from 'lucide-react';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="p-1 h-auto">
          <Avatar className="h-8 w-8">
            <AvatarImage src={(user.user_metadata as any)?.avatar_url} />
            <AvatarFallback className="bg-teal-600 text-white text-sm">
              {displayName ? getInitials(displayName) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={(user.user_metadata as any)?.avatar_url} />
              <AvatarFallback className="bg-teal-600 text-white">
                {displayName ? getInitials(displayName) : <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription>Manage your account settings and preferences.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button variant="outline" className="justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
          <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
