import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Lock, User, KeyRound } from 'lucide-react';
import { cn } from "@/lib/utils";

// Placeholder image URL
const LoginImage = '/scribe.png';

const LoginPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    // Simulate an API call (replace with your actual authentication logic)
    try {
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demonstration: "test@example.com" with password "password" logs in
      if (email === 'alexdeighton@metrixai.com' && password === 'Alexander') {
        // Redirect to the dashboard
        router.push('/dashboard');
        return;
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError(`An error occurred: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Metrix AI Login
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Welcome back! Please enter your credentials to access your account.
            </p>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700"
        >
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <Label htmlFor="email-address" className="sr-only">
                  Email address
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "appearance-none rounded-md relative block w-full px-10 py-3 text-gray-100",
                      "border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2",
                      "focus:ring-purple-500 focus:border-transparent focus:z-10 sm:text-sm",
                      "bg-gray-900", 
                      error && "border-red-500 focus:ring-red-500"
                    )}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="sr-only">
                  Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "appearance-none rounded-md relative block w-full px-10 py-3 text-gray-100",
                      "border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2",
                      "focus:ring-purple-500 focus:border-transparent focus:z-10 sm:text-sm",
                      "bg-gray-900", 
                      error && "border-red-500 focus:ring-red-500"
                    )}
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2" role="alert">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-900"
                />
                <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </Label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className={cn(
                  "group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-md text-white",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-300",
                  loading
                    ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={loading}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-purple-300 group-hover:text-purple-200" aria-hidden="true" />
                </span>
                {loading ? 'Loading...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </motion.div>
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <a
              href="#"
              className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
