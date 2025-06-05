import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconBrandGoogle } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name);
    setLoading(false);
    if (!error) {
      alert('Please check your email to confirm your account.');
      router.replace('/');
    } else {
      alert(error.message);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">Create your Metrix account</h1>
        <div className="space-y-3">
          <Button variant="outline" onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center space-x-2">
            <IconBrandGoogle className="w-5 h-5" />
            <span>Sign up with Google</span>
          </Button>
        </div>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or sign up with your email</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="text" name="name" placeholder="Full name" required value={form.name} onChange={handleChange} />
          <Input type="email" name="email" placeholder="Email" required value={form.email} onChange={handleChange} />
          <Input type="password" name="password" placeholder="Password" required value={form.password} onChange={handleChange} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : 'Sign Up'}
          </Button>
        </form>
        <p className="text-xs text-gray-500 text-center">Sign up with Google or your email via Supabase.</p>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
