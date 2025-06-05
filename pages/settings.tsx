import { useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, LogOut, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile, signOut, resetPassword } = useAuth();

  const [name, setName] = useState((user?.user_metadata as any)?.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({ full_name: name });
    setSaving(false);
    if (error) alert('Failed to update profile');
    else alert('Profile updated');
  };

  const handleReset = async () => {
    if (!user?.email) return;
    const { error } = await resetPassword(user.email);
    if (error) alert('Failed to send reset email');
    else alert('Password reset email sent');
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) alert('Failed to sign out');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-md mx-auto p-4 pt-8">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled />
          </div>
          <Button type="submit" className="mt-2">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
        <div className="mt-8 flex flex-col gap-2">
          {user?.app_metadata?.provider === 'email' && (
            <Button variant="outline" onClick={handleReset} className="justify-start">
              <KeyRound className="h-4 w-4 mr-2" />
              Reset Password
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout} className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </main>
    </div>
  );
}
