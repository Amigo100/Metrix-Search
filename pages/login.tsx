import React, { useState } from 'react';
// Note: 'next/router' is specific to Next.js projects.
// Commented out for preview compatibility. Replace with actual routing if needed.
// import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button'; // Assuming Button component is available
import { Input } from '@/components/ui/input';   // Assuming Input component is available
import { Label } from '@/components/ui/label';   // Assuming Label component is available
import { motion } from 'framer-motion';
import { Lock, User, KeyRound } from 'lucide-react';
import { cn } from "@/lib/utils"; // Assuming cn utility is available

// Placeholder image URL (Optional - can be used if layout includes an image)
// const LoginImage = '/login-graphic.png';

const LoginPage = () => {
  // const router = useRouter(); // Commented out for preview

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
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // Example check - replace with actual API call and response handling
      if (email === 'alexdeighton@metrixai.com' && password === 'Alexander') {
        console.log('Login successful! Redirecting...'); // Log success
        // router.push('/dashboard'); // Commented out for preview
        alert('Simulated Login Successful! (Redirect disabled in preview)'); // Simple feedback for preview
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
    // Main container: Light theme background and text
    <div className="min-h-screen bg-stone-50 text-stone-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* You might want to add the MetrixAILogo here */}
            {/* <img src="/MetrixAI.png" alt="Metrix AI Logo" className="mx-auto h-12 w-auto mb-4" /> */}
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">
              Metrix AI Login
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Welcome back! Please enter your credentials.
            </p>
          </motion.div>
        </div>

        {/* Login Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          // Light theme card: white background, light border, shadow
          className="bg-white rounded-xl shadow-lg p-8 border border-stone-200"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md space-y-4">
              {/* Email Input */}
              <div>
                <Label htmlFor="email-address" className="sr-only">Email address</Label>
                <div className="relative">
                  {/* Light theme icon color */}
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    // Light theme input styles
                    className={cn(
                      "appearance-none rounded-md relative block w-full px-10 py-3 text-stone-900", // Darker text
                      "border border-stone-300 placeholder-stone-400 focus:outline-none focus:ring-2", // Lighter border/placeholder
                      "focus:ring-[#3D7F80] focus:border-transparent focus:z-10 sm:text-sm", // Teal focus ring
                      "bg-white", // White background
                      error && email === '' && "border-red-500 focus:ring-red-500" // Error state only if field is involved
                    )}
                    placeholder="Email address"
                  />
                </div>
              </div>
              {/* Password Input */}
              <div>
                <Label htmlFor="password" className="sr-only">Password</Label>
                <div className="relative">
                  {/* Light theme icon color */}
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                     // Light theme input styles
                    className={cn(
                      "appearance-none rounded-md relative block w-full px-10 py-3 text-stone-900", // Darker text
                      "border border-stone-300 placeholder-stone-400 focus:outline-none focus:ring-2", // Lighter border/placeholder
                      "focus:ring-[#3D7F80] focus:border-transparent focus:z-10 sm:text-sm", // Teal focus ring
                      "bg-white", // White background
                      error && password === '' && "border-red-500 focus:ring-red-500" // Error state only if field is involved
                    )}
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center" role="alert"> {/* Adjusted error color slightly */}
                {error}
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  // Light theme checkbox styles
                  className="h-4 w-4 rounded border-stone-300 text-[#3D7F80] focus:ring-[#3D7F80] bg-white cursor-pointer"
                />
                {/* Light theme label text */}
                <Label htmlFor="remember-me" className="ml-2 block text-sm text-stone-700">
                  Remember me
                </Label>
              </div>

              <div className="text-sm">
                {/* Light theme link styles (Teal -> Navy) */}
                <a href="#" className="font-medium text-[#3D7F80] hover:text-[#2D4F6C] hover:underline">
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className={cn(
                  "group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-md text-white", // White text on button
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3D7F80] transition-all duration-300", // Teal focus ring
                  loading
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed" // Light theme loading state
                    : "bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80] hover:from-[#254058] hover:to-[#316667] shadow-md hover:shadow-lg", // Navy/Teal gradient
                  "disabled:opacity-70 disabled:cursor-not-allowed" // Adjusted disabled state
                )}
                disabled={loading}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {/* Light theme button icon color (Light Teal -> White on hover) */}
                  <Lock className="h-5 w-5 text-[#A0D2DB] group-hover:text-white transition-colors" aria-hidden="true" />
                </span>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Sign Up Link */}
        <div className="text-center">
          {/* Light theme text and link */}
          <p className="text-sm text-stone-600">
            Don&apos;t have an account?{' '}
            <a href="#" className="font-medium text-[#3D7F80] hover:text-[#2D4F6C] hover:underline">
              Sign up for a free trial
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
